import { Cliente, ClientTask, MetaVenda, Produto, Proposta, PropostaLinha, TimelineEvent } from '../types';
import { supabase } from './supabase/client';
import { productCatalog } from './productCatalog';
import { customersRepo } from './repositories/customersRepo';
import { proposalsRepo } from './repositories/proposalsRepo';
import { tasksRepo } from './repositories/tasksRepo';
import { auditRepo } from './repositories/auditRepo';
import { MOCK_USER } from './mockData';
import { generateProposalEmailBody } from './genai';
import { normalizeProposalResult, normalizeProposalStatus } from './domain';

const mapProposalExtrasToDb = (extras: Partial<Proposta>) => {
  const payload: Record<string, unknown> = {};

  if (extras.assunto !== undefined) payload.subject = extras.assunto;
  if (extras.data_validade !== undefined) payload.valid_until = extras.data_validade || null;
  if (extras.data_resultado !== undefined) payload.result_date = extras.data_resultado || null;
  if (extras.data_envio_email !== undefined) payload.email_sent_at = extras.data_envio_email || null;
  if (extras.data_aprovacao !== undefined) payload.approved_at = extras.data_aprovacao || null;
  if (extras.condicoes_pagamento !== undefined) payload.payment_terms = extras.condicoes_pagamento;
  if (extras.condicoes_entrega !== undefined) payload.delivery_terms = extras.condicoes_entrega;
  if (extras.prazo_entrega_semanas !== undefined) payload.delivery_weeks = extras.prazo_entrega_semanas;
  if (extras.tipo_embalagem !== undefined) payload.packaging_type = extras.tipo_embalagem;
  if (extras.subtotal !== undefined) payload.subtotal = extras.subtotal;
  if (extras.total !== undefined) payload.total = extras.total;
  if (extras.desconto_global_percent !== undefined) payload.discount_global_percent = extras.desconto_global_percent;
  if (extras.idioma !== undefined) payload.language = extras.idioma;
  if (extras.mercado !== undefined) payload.market = extras.mercado;
  if (extras.observacoes_para_cliente !== undefined) payload.client_notes = extras.observacoes_para_cliente;
  if (extras.observacoes_internas !== undefined) payload.internal_notes = extras.observacoes_internas;
  if (extras.link_pdf_proposta !== undefined) payload.pdf_url = extras.link_pdf_proposta;
  if (extras.doc_url !== undefined) payload.doc_url = extras.doc_url;
  if (extras.motivo_perda !== undefined) payload.lost_reason = extras.motivo_perda;
  if (extras.last_email_to !== undefined) payload.last_email_to = extras.last_email_to;
  if (extras.last_email_cc !== undefined) payload.last_email_cc = extras.last_email_cc;
  if (extras.last_email_subject !== undefined) payload.last_email_subject = extras.last_email_subject;

  return payload;
};

export const api = {
  // --- CUSTOMERS ---
  getClientes: async (): Promise<Cliente[]> => {
    return customersRepo.getAll();
  },

  getClienteById: async (id: string): Promise<Cliente | undefined> => {
    const customer = await customersRepo.getById(id);
    return customer || undefined;
  },

  createCliente: async (cliente: Cliente): Promise<Cliente> => {
    const created = await customersRepo.create(cliente);
    if (!created) {
      throw new Error('Failed to create customer');
    }

    await auditRepo.log('customer.create', 'customer', created.cliente_id, { name: created.nome_empresa });
    return created;
  },

  updateCliente: async (cliente: Cliente): Promise<void> => {
    await customersRepo.update(cliente.cliente_id, cliente);
    await auditRepo.log('customer.update', 'customer', cliente.cliente_id, { changes: 'full_update' });
  },

  saveClientNotes: async (clientId: string, notes: string) => {
    await customersRepo.update(clientId, { notes });
    await auditRepo.log('customer.update', 'customer', clientId, { field: 'notes' });
  },

  updateClientStatus: async (clientId: string, status: string) => {
    const isActive = status !== 'Inactive Client';
    await customersRepo.update(clientId, { status: status as Cliente['status'], is_active: isActive });
    await auditRepo.log('customer.status_change', 'customer', clientId, { status });
  },

  // --- PRODUCTS ---
  getProdutos: async (): Promise<Produto[]> => {
    return productCatalog.getModels();
  },

  // --- PROPOSALS ---
  getPropostas: async (): Promise<Proposta[]> => {
    return proposalsRepo.list();
  },

  getPropostaById: async (id: string): Promise<{ proposta: Proposta; linhas: PropostaLinha[] } | null> => {
    return proposalsRepo.getById(id);
  },

  saveProposta: async (
    proposta: Proposta,
    linhas: PropostaLinha[],
    isDraft = true,
  ): Promise<string> => {
    const proposalToSave: Proposta = {
      ...proposta,
      estado: isDraft ? 'Draft' : normalizeProposalStatus(proposta.estado),
      resultado: normalizeProposalResult(proposta.resultado),
    };

    const internalId = await proposalsRepo.create(proposalToSave, linhas);

    await auditRepo.log(
      isDraft ? 'proposal.create_draft' : 'proposal.create',
      'proposal',
      internalId,
      { total: proposta.total, customer_id: proposta.cliente_id },
    );

    return internalId;
  },

  updatePropostaEstado: async (
    propostaId: string,
    estado: string,
    resultado: string,
    extras: Partial<Proposta> = {},
  ): Promise<void> => {
    const payload = {
      status: normalizeProposalStatus(estado),
      result: normalizeProposalResult(resultado),
      ...mapProposalExtrasToDb(extras),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('proposals')
      .update(payload)
      .or(`id.eq.${propostaId},proposal_number.eq.${propostaId}`);

    if (error) {
      throw new Error(`Failed to update proposal state: ${error.message}`);
    }

    await auditRepo.log('proposal.status_change', 'proposal', propostaId, { estado, resultado });
  },

  // --- TASKS ---
  getTasks: async (clientId?: string): Promise<ClientTask[]> => {
    return tasksRepo.list(clientId);
  },

  addTask: async (task: Partial<ClientTask>): Promise<ClientTask> => {
    const createdTask = await tasksRepo.create(task);
    if (!createdTask) {
      throw new Error('Failed to create task');
    }

    await auditRepo.log('task.create', 'task', createdTask.task_id, { title: createdTask.description });
    return createdTask;
  },

  toggleTask: async (taskId: string): Promise<void> => {
    const success = await tasksRepo.toggle(taskId);
    if (success) {
      await auditRepo.log('task.toggle', 'task', taskId);
    }
  },

  // --- TIMELINE / AUDIT ---
  getTimeline: async (clientId: string): Promise<TimelineEvent[]> => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles(full_name)')
      .contains('metadata', { client_id: clientId })
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((log: any) => ({
      event_id: String(log.id),
      client_id: clientId,
      timestamp: log.created_at,
      type: 'note_added',
      description: `${log.action}`,
      created_by: log.profiles?.full_name || 'System',
    }));
  },

  addTimelineEvent: async (event: Partial<TimelineEvent>) => {
    await auditRepo.log(
      event.type || 'timeline.info',
      'timeline',
      event.client_id || '',
      {
        description: event.description,
        related_proposal: event.related_proposal_id,
        client_id: event.client_id,
      },
    );
  },

  // --- UTILS / KPI ---
  getMetaAtual: async (email: string): Promise<MetaVenda | undefined> => {
    const today = new Date();
    return {
      comercial_email: email,
      mes_ano: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      objetivo_valor: 25000,
    };
  },

  generateProposalDocument: async (
    proposalId: string,
  ): Promise<{ success: boolean; docId?: string; docUrl?: string; docHtml?: string; error?: string }> => {
    const data = await proposalsRepo.getById(proposalId);
    if (!data) return { success: false, error: 'Proposal not found' };

    const client = await customersRepo.getById(data.proposta.cliente_id);
    if (!client) return { success: false, error: 'Client not found' };

    try {
      const { mapProposalToDocModel, renderProposalHtml } = await import('./documentGenerator');
      const model = mapProposalToDocModel(data.proposta, client, data.linhas, MOCK_USER);
      const html = renderProposalHtml(model);

      const proposalStorageId = data.proposta.internal_id || data.proposta.proposta_id;
      const fileName = `proposals/${proposalStorageId}_${Date.now()}.html`;

      const { error: uploadError } = await supabase
        .storage
        .from('proposals')
        .upload(fileName, new Blob([html], { type: 'text/html' }), { upsert: true });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: publicData } = supabase.storage.from('proposals').getPublicUrl(fileName);
      const docUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          status: 'Doc Generated',
          doc_url: docUrl,
          pdf_url: docUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.proposta.internal_id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await auditRepo.log('proposal.generate_doc', 'proposal', proposalStorageId, { url: docUrl });
      return { success: true, docUrl, docHtml: html, docId: fileName };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Document generation failed' };
    }
  },

  sendProposalEmail: async (payload: {
    proposalId: string;
    to: string;
    cc: string;
    subject: string;
    body: string;
    attachPdf: boolean;
    includeDocLink: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    await api.updatePropostaEstado(payload.proposalId, 'Sent', 'Open', {
      data_envio_email: new Date().toISOString(),
      last_email_to: payload.to,
      last_email_cc: payload.cc,
      last_email_subject: payload.subject,
    });

    await auditRepo.log('proposal.email_sent', 'proposal', payload.proposalId, { to: payload.to });
    return { success: true };
  },

  generateEmailBodyAI: async (proposal: Proposta, lines: PropostaLinha[]): Promise<string> => {
    return generateProposalEmailBody(proposal, lines);
  },

  gerarEEnviarProposta: async (propostaId: string): Promise<string> => {
    const res = await api.generateProposalDocument(propostaId);
    return res.success ? 'Sucesso' : 'Erro';
  },
};

export const clienteToSheetsRow = (cliente: Cliente) => ({
  client_id: cliente.cliente_id,
  company_name: cliente.nome_empresa,
  contact_name: cliente.nome_contacto,
  email: cliente.email,
  phone: cliente.telefone,
  website: cliente.website || '',
  tax_id: cliente.nif,
  industry: cliente.segmento,
  company_size: cliente.company_size || '',
  billing_address: cliente.morada_faturacao,
  country: cliente.pais,
  preferred_language: cliente.preferred_language,
  market: cliente.market,
  status: cliente.status,
  created_at: cliente.data_criacao,
  last_activity_date: cliente.last_contact_date || '',
  last_proposal_date: cliente.data_ultima_proposta || '',
  is_active: cliente.is_active ?? true,
  notes: cliente.notes || '',
});
