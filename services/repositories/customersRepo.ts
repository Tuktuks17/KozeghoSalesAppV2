import { Cliente } from '../../types';
import { normalizeClientStatus } from '../domain';
import { supabase } from '../supabase/client';

const toClient = (dbRow: any): Cliente => {
  return {
    cliente_id: dbRow.id,
    nome_empresa: dbRow.name || '',
    nome_contacto: dbRow.contact_name || '',
    email: dbRow.email || '',
    telefone: dbRow.phone || '',
    nif: dbRow.vat_number || '',
    morada_faturacao: dbRow.address || '',
    morada_entrega: '',
    pais: dbRow.country || 'Portugal',
    segmento: dbRow.segment || '',
    data_criacao: dbRow.created_at || new Date().toISOString(),
    data_ultima_proposta: dbRow.last_proposal_date || undefined,
    status: normalizeClientStatus(dbRow.status),
    website: dbRow.website || undefined,
    company_size: dbRow.company_size || undefined,
    notes: dbRow.notes || undefined,
    last_contact_date: dbRow.last_contact_date || undefined,
    preferred_language: dbRow.preferred_language || 'English',
    market: dbRow.market || 'International',
    updated_at: dbRow.updated_at || undefined,
    is_active: dbRow.is_active ?? true,
    metrics: {
      total_proposals_created: 0,
      total_proposals_won: 0,
      total_value_won: 0,
      total_value_pipeline: 0,
      win_rate_percent: 0,
    },
  };
};

const getOrgId = async (userId: string): Promise<string | null> => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('[customersRepo.getOrgId] failed fetching profile org_id', profileError);
  }

  if (profile?.org_id) {
    return profile.org_id;
  }

  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: 'My Organization' })
    .select()
    .single();

  if (orgError || !newOrg) {
    console.error('[customersRepo.getOrgId] failed creating organization', orgError);
    return null;
  }

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, org_id: newOrg.id }, { onConflict: 'id' });

  if (upsertError) {
    console.error('[customersRepo.getOrgId] failed linking user profile to organization', upsertError);
    return null;
  }

  return newOrg.id;
};

export const customersRepo = {
  getAll: async (): Promise<Cliente[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
    return (data || []).map(toClient);
  },

  getById: async (id: string): Promise<Cliente | null> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }
    return toClient(data);
  },

  create: async (customer: Partial<Cliente>): Promise<Cliente | null> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      console.error('[customersRepo.create] user is not authenticated', authError);
      return null;
    }

    const normalizedEmail = customer.email?.trim().toLowerCase();
    if (!normalizedEmail || !customer.nome_empresa?.trim()) {
      console.error('[customersRepo.create] missing required fields (email/company)');
      return null;
    }

    const orgId = await getOrgId(authData.user.id);
    if (!orgId) {
      return null;
    }

    const payload = {
      org_id: orgId,
      name: customer.nome_empresa.trim(),
      contact_name: customer.nome_contacto || '',
      email: normalizedEmail,
      phone: customer.telefone || '',
      vat_number: customer.nif || '',
      address: customer.morada_faturacao || '',
      country: customer.pais || 'Portugal',
      segment: customer.segmento || '',
      notes: customer.notes || '',
      status: normalizeClientStatus(customer.status),
      preferred_language: customer.preferred_language || 'English',
      market: customer.market || 'International',
      is_active: customer.is_active ?? true,
      created_by: authData.user.id,
      updated_by: authData.user.id,
    };

    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    const mutation = existing
      ? supabase.from('customers').update(payload).eq('id', existing.id)
      : supabase.from('customers').insert(payload);

    const { data, error } = await mutation.select().single();
    if (error) {
      console.error('[customersRepo.create] failed inserting/updating customer', error);
      return null;
    }

    return toClient(data);
  },

  update: async (id: string, customer: Partial<Cliente>): Promise<void> => {
    const payload: Record<string, unknown> = {};
    if (customer.nome_empresa !== undefined) payload.name = customer.nome_empresa;
    if (customer.nome_contacto !== undefined) payload.contact_name = customer.nome_contacto;
    if (customer.email !== undefined) payload.email = customer.email.trim().toLowerCase();
    if (customer.telefone !== undefined) payload.phone = customer.telefone;
    if (customer.nif !== undefined) payload.vat_number = customer.nif;
    if (customer.morada_faturacao !== undefined) payload.address = customer.morada_faturacao;
    if (customer.pais !== undefined) payload.country = customer.pais;
    if (customer.segmento !== undefined) payload.segment = customer.segmento;
    if (customer.notes !== undefined) payload.notes = customer.notes;
    if (customer.status !== undefined) payload.status = normalizeClientStatus(customer.status);
    if (customer.preferred_language !== undefined) payload.preferred_language = customer.preferred_language;
    if (customer.market !== undefined) payload.market = customer.market;
    if (customer.is_active !== undefined) payload.is_active = customer.is_active;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id);

    if (error) console.error('Error updating customer:', error);
  },
};
