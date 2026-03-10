import { Proposta, PropostaLinha, UpdateProposalInput } from '../../types';
import { normalizeProposalResult, normalizeProposalStatus } from '../domain';
import { ProposalReferenceEngine } from '../proposalReference';
import { supabase } from '../supabase/client';

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const toProposal = (row: any): Proposta => {
  return {
    proposta_id: row.proposal_number,
    internal_id: row.id,
    assunto: row.subject || '',
    data_criacao: row.created_at,
    data_atualizacao: row.updated_at,
    data_validade: row.valid_until || '',
    estado: normalizeProposalStatus(row.status),
    resultado: normalizeProposalResult(row.result),
    data_resultado: row.result_date || undefined,
    comercial_email: row.commercial_email || '',
    comercial_nome: row.commercial_name || '',
    cliente_id: row.customer_id,
    cliente_nome: row.customers?.name || '',
    cliente_email: row.customers?.email || '',
    cliente_telefone: row.customers?.phone || '',
    nif: row.customers?.vat_number || '',
    moeda: row.currency || 'EUR',
    condicoes_pagamento: row.payment_terms || '',
    condicoes_entrega: row.delivery_terms || '',
    prazo_entrega_semanas: row.delivery_weeks || undefined,
    tipo_embalagem: row.packaging_type || undefined,
    desconto_global_percent: Number(row.discount_global_percent || 0),
    subtotal: Number(row.subtotal || 0),
    iva_percent: 0,
    iva_valor: 0,
    total: Number(row.total || 0),
    idioma: row.language || 'English',
    mercado: row.market || 'International',
    observacoes_internas: row.internal_notes || '',
    observacoes_para_cliente: row.client_notes || '',
    doc_url: row.doc_url || undefined,
    link_pdf_proposta: row.pdf_url || undefined,
    data_envio_email: row.email_sent_at || undefined,
    motivo_perda: row.lost_reason || undefined,
    last_email_to: row.last_email_to || undefined,
    last_email_cc: row.last_email_cc || undefined,
    last_email_subject: row.last_email_subject || undefined,
  };
};

const toLine = (row: any, options: any[] = [], proposalReference: string): PropostaLinha => {
  return {
    linha_id: row.id,
    proposta_id: proposalReference,
    produto_id: row.product_id || '',
    produto_nome: row.product_name,
    descricao_linha: row.description || '',
    quantidade: Number(row.quantity),
    preco_unitario: Number(row.unit_price),
    desconto_percent: Number(row.discount_percent),
    total_linha: Number(row.line_total),
    selectedOptionCodes: options.map((option: any) => option.option_code),
    selectedOptionsDetails: options
      .map((option: any) => `${option.option_label} (${option.price_eur}€)`)
      .join('; '),
  };
};

const resolveOrgId = async (userId: string): Promise<string> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.org_id) {
    return profile.org_id;
  }

  const { data: newOrg, error } = await supabase
    .from('organizations')
    .insert({ name: 'My Organization' })
    .select()
    .single();

  if (error || !newOrg) {
    throw new Error('Failed to resolve Organization ID');
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, org_id: newOrg.id }, { onConflict: 'id' });

  if (profileError) {
    throw new Error('Failed to link user profile with organization');
  }

  return newOrg.id;
};

const generateProposalNumber = async (
  salesRepName: string,
): Promise<string> => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const { count } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString())
    .lt('created_at', endOfDay.toISOString());

  const sequence = (count || 0) + 1;
  return ProposalReferenceEngine.generate(now, salesRepName || 'Sales', sequence);
};

export const proposalsRepo = {
  list: async (): Promise<Proposta[]> => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, customers (name, email, phone, vat_number)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing proposals:', error);
      return [];
    }

    return (data || []).map(toProposal);
  },

  getById: async (id: string): Promise<{ proposta: Proposta; linhas: PropostaLinha[] } | null> => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, customers (*)')
      .or(`id.eq.${id},proposal_number.eq.${id}`)
      .single();

    if (error || !data) return null;

    const { data: linesData, error: linesError } = await supabase
      .from('proposal_lines')
      .select('*, proposal_line_options(*)')
      .eq('proposal_id', data.id)
      .order('sort_order', { ascending: true });

    if (linesError) {
      console.error('Error fetching proposal lines:', linesError);
    }

    const proposta = toProposal(data);
    const linhas = (linesData || []).map((line: any) =>
      toLine(line, line.proposal_line_options, proposta.proposta_id),
    );

    return { proposta, linhas };
  },

  create: async (proposal: Proposta, lines: PropostaLinha[]): Promise<string> => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      throw new Error('No user logged in');
    }

    const orgId = await resolveOrgId(user.id);

    if (!proposal.cliente_id || proposal.cliente_id.length < 10) {
      throw new Error(`Invalid Customer ID: ${proposal.cliente_id}`);
    }

    if (proposal.internal_id && isUuid(proposal.internal_id)) {
      const { data: existingProposal } = await supabase
        .from('proposals')
        .select('id, proposal_number')
        .eq('id', proposal.internal_id)
        .maybeSingle();

      if (existingProposal) {
        const { error: updateError } = await supabase
          .from('proposals')
          .update({
            customer_id: proposal.cliente_id,
            subject: proposal.assunto || '',
            status: normalizeProposalStatus(proposal.estado),
            result: normalizeProposalResult(proposal.resultado),
            result_date: proposal.data_resultado || null,
            valid_until: proposal.data_validade || null,
            currency: proposal.moeda || 'EUR',
            language: proposal.idioma || 'English',
            market: proposal.mercado || 'International',
            payment_terms: proposal.condicoes_pagamento || '',
            delivery_terms: proposal.condicoes_entrega || '',
            delivery_weeks: proposal.prazo_entrega_semanas || null,
            packaging_type: proposal.tipo_embalagem || null,
            client_notes: proposal.observacoes_para_cliente || '',
            internal_notes: proposal.observacoes_internas || '',
            subtotal: proposal.subtotal || 0,
            discount_global_percent: proposal.desconto_global_percent || 0,
            total: proposal.total || 0,
            commercial_email: user.email,
            commercial_name: proposal.comercial_nome || user.user_metadata?.full_name || '',
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProposal.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        const { error: deleteLinesError } = await supabase
          .from('proposal_lines')
          .delete()
          .eq('proposal_id', existingProposal.id);

        if (deleteLinesError) {
          throw new Error(deleteLinesError.message);
        }

        if (lines.length > 0) {
          const linesPayload = lines.map((line, index) => ({
            org_id: orgId,
            proposal_id: existingProposal.id,
            product_id: line.produto_id || 'custom',
            product_name: line.produto_nome,
            description: line.descricao_linha,
            quantity: line.quantidade,
            unit_price: line.preco_unitario,
            discount_percent: line.desconto_percent,
            line_total: line.total_linha,
            sort_order: index,
          }));

          const { data: createdLines, error: linesError } = await supabase
            .from('proposal_lines')
            .insert(linesPayload)
            .select();

          if (linesError) {
            throw new Error(linesError.message);
          }

          const optionsPayload: Array<Record<string, unknown>> = [];
          for (const createdLine of createdLines || []) {
            const originalLine = lines[createdLine.sort_order];
            if (!originalLine?.selectedOptionCodes?.length) continue;
            originalLine.selectedOptionCodes.forEach((optionCode) => {
              optionsPayload.push({
                org_id: orgId,
                proposal_line_id: createdLine.id,
                option_code: optionCode,
                option_label: optionCode,
                price_eur: 0,
              });
            });
          }

          if (optionsPayload.length > 0) {
            const { error: optionsError } = await supabase
              .from('proposal_line_options')
              .insert(optionsPayload);

            if (optionsError) {
              throw new Error(optionsError.message);
            }
          }
        }

        return existingProposal.id;
      }
    }

    const providedReference = proposal.proposta_id?.trim();
    const proposalNumber =
      providedReference && !isUuid(providedReference)
        ? providedReference
        : await generateProposalNumber(proposal.comercial_nome || user.user_metadata?.full_name || 'Sales');

    const { data: createdProposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        org_id: orgId,
        proposal_number: proposalNumber,
        customer_id: proposal.cliente_id,
        subject: proposal.assunto || '',
        status: normalizeProposalStatus(proposal.estado),
        result: normalizeProposalResult(proposal.resultado),
        result_date: proposal.data_resultado || null,
        valid_until: proposal.data_validade || null,
        currency: proposal.moeda || 'EUR',
        language: proposal.idioma || 'English',
        market: proposal.mercado || 'International',
        payment_terms: proposal.condicoes_pagamento || '',
        delivery_terms: proposal.condicoes_entrega || '',
        delivery_weeks: proposal.prazo_entrega_semanas || null,
        packaging_type: proposal.tipo_embalagem || null,
        client_notes: proposal.observacoes_para_cliente || '',
        internal_notes: proposal.observacoes_internas || '',
        subtotal: proposal.subtotal || 0,
        discount_global_percent: proposal.desconto_global_percent || 0,
        total: proposal.total || 0,
        commercial_email: user.email,
        commercial_name: proposal.comercial_nome || user.user_metadata?.full_name || '',
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (proposalError || !createdProposal) {
      console.error('Error creating proposal:', proposalError);
      throw new Error(proposalError?.message || 'Failed to create proposal');
    }

    if (lines.length > 0) {
      const linesPayload = lines.map((line, index) => ({
        org_id: orgId,
        proposal_id: createdProposal.id,
        product_id: line.produto_id || 'custom',
        product_name: line.produto_nome,
        description: line.descricao_linha,
        quantity: line.quantidade,
        unit_price: line.preco_unitario,
        discount_percent: line.desconto_percent,
        line_total: line.total_linha,
        sort_order: index,
      }));

      const { data: createdLines, error: linesError } = await supabase
        .from('proposal_lines')
        .insert(linesPayload)
        .select();

      if (linesError) {
        console.error('Error inserting proposal lines:', linesError);
      } else if (createdLines && createdLines.length > 0) {
        const optionsPayload: Array<Record<string, unknown>> = [];

        for (const createdLine of createdLines) {
          const originalLine = lines[createdLine.sort_order];
          if (!originalLine?.selectedOptionCodes?.length) continue;

          originalLine.selectedOptionCodes.forEach((optionCode) => {
            optionsPayload.push({
              org_id: orgId,
              proposal_line_id: createdLine.id,
              option_code: optionCode,
              option_label: optionCode,
              price_eur: 0,
            });
          });
        }

        if (optionsPayload.length > 0) {
          const { error: optionsError } = await supabase
            .from('proposal_line_options')
            .insert(optionsPayload);

          if (optionsError) {
            console.error('Error inserting proposal line options:', optionsError);
          }
        }
      }
    }

    return createdProposal.id;
  },

  updateProposal: async (id: string, data: UpdateProposalInput): Promise<void> => {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.subject = data.title;
    if (data.status !== undefined) payload.status = normalizeProposalStatus(data.status);
    if (data.totalValue !== undefined) payload.total = data.totalValue;
    if (data.pdfUrl !== undefined) payload.pdf_url = data.pdfUrl;
    if (data.updatedBy !== undefined) payload.updated_by = data.updatedBy;
    payload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('proposals')
      .update(payload)
      .eq('id', id);

    if (error) console.error('Error updating proposal:', error);
  },

  deleteProposal: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting proposal:', error);
  },
};
