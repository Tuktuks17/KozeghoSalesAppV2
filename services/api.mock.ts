
import { Cliente, MetaVenda, Produto, Proposta, PropostaLinha, ClientTask, TimelineEvent } from '../types';
import { CLIENTES, METAS, PROPOSTAS, PROPOSTA_LINHAS, TASKS, TIMELINE_EVENTS, MOCK_USER } from './mockData';
import { productCatalog } from './productCatalog';
import { ProposalReferenceEngine } from './proposalReference';
import { postToSheets, fetchSheetRows } from './sheetsApi';
import { mapProposalToDocModel, renderProposalHtml } from './documentGenerator';
import { generateProposalEmailBody } from './genai';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPERS PARA LER DO SHEETS ---

const parseNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
};

function sheetRowToCliente(row: any): Cliente {
  return {
    cliente_id: String(row.client_id || ''),
    nome_empresa: row.company_name || '',
    nome_contacto: row.contact_name || '',
    nif: row.tax_id || '',
    email: row.email || '',
    telefone: row.phone || '',
    morada_faturacao: row.billing_address || '',
    morada_entrega: '', // ainda não está no Sheets
    pais: row.country || '',
    segmento: row.industry || '',
    data_criacao: row.created_at || new Date().toISOString(),
    data_ultima_proposta: row.last_proposal_date || undefined,

    // CRM Extensions
    status: (row.status as any) || 'Lead',
    website: row.website || undefined,
    company_size: row.company_size || undefined,
    notes: row.notes || undefined,
    last_contact_date: row.last_activity_date || undefined,

    // Lógica de propostas
    preferred_language: (row.preferred_language as any) || 'Portuguese',
    market: (row.market as any) || 'National',

    // Audit
    created_from: 'import',
    updated_at: row.created_at || undefined,
    is_active:
      row.is_active === true ||
      row.is_active === 'TRUE' ||
      row.is_active === 'true' ||
      row.is_active === 1,

    // Métricas (podemos recalcular mais tarde, para já 0)
    metrics: {
      total_proposals_created: 0,
      total_proposals_won: 0,
      total_value_won: 0,
      total_value_pipeline: 0,
      win_rate_percent: 0,
    },
  };
}

function sheetRowToProposta(row: any): Proposta {
  return {
    proposta_id: String(row.proposal_id || ''),
    internal_id: row.internal_id || undefined,
    assunto: row.subject || '',
    data_criacao: row.created_at || new Date().toISOString(),
    data_atualizacao: row.updated_at || undefined,
    data_validade: row.valid_until || '',
    estado: (row.status as any) || 'Draft',
    resultado: (row.result as any) || 'Open',
    data_resultado: row.result_date || undefined,

    // Salesperson
    comercial_email: row.commercial_email || '',
    comercial_nome: row.commercial_name || '',
    comercial_inicial: row.commercial_initials || undefined,

    // Cliente
    cliente_id: row.client_id || '',
    cliente_nome: row.client_name || '',
    cliente_email: row.client_email || '',
    cliente_telefone: row.client_phone || '',
    nif: row.tax_id || '',

    // Condições comerciais
    moeda: row.currency || 'EUR',
    condicoes_pagamento: row.payment_terms || '',
    condicoes_entrega: row.delivery_terms || '',
    prazo_entrega_semanas: row.delivery_time_weeks
      ? Number(row.delivery_time_weeks)
      : undefined,
    tipo_embalagem: row.packaging_type as any,

    // Totais
    desconto_global_percent: 0, // Ainda não está na sheet
    subtotal: parseNumber(row.subtotal),
    iva_percent: parseNumber(row.vat_percent),
    iva_valor: parseNumber(row.vat_value),
    total: parseNumber(row.total),

    // Notas e contexto
    observacoes_para_cliente: row.customer_notes || '',
    observacoes_internas: row.internal_notes || '',
    idioma: row.language || 'Portuguese',
    mercado: (row.market as any) || 'National',

    // Documentos
    doc_id: row.doc_id || undefined,
    doc_url: row.doc_url || undefined,
    link_pdf_proposta: row.pdf_url || undefined,

    // Email tracking
    data_envio_email: row.sent_date || undefined,
    data_ultimo_followup: row.last_followup_date || undefined,
    motivo_perda: row.lost_reason || undefined,
  };
}

function sheetRowToPropostaLinha(row: any): PropostaLinha {
  const optionCodesRaw = row.options_codes || '';
  const optionCodes =
    optionCodesRaw && typeof optionCodesRaw === 'string'
      ? optionCodesRaw.split(';').map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    linha_id: String(row.line_id || ''),
    proposta_id: row.proposal_id || '',
    produto_id: row.product_id || '',
    produto_nome: row.product_name || '',
    descricao_linha: row.description || '',
    quantidade: parseNumber(row.quantity),
    preco_unitario: parseNumber(row.unit_price),
    desconto_percent: parseNumber(row.discount_percent),
    total_linha: parseNumber(row.line_total),
    variantes_escolhidas: row.options_codes || '',
    extras: row.extras || '',
    notas_linha: row.internal_notes || '',
    selectedOptionCodes: optionCodes,
    selectedOptionsDetails: row.options_description || '',
    standard_model_code: row.standard_model_code || undefined,
  };
}

// Flag para não re-hidratar em cada chamada
let sheetsHydrated = false;

/**
 * Carrega Clients / Proposals / ProposalLines a partir do Google Sheets
 * e preenche os arrays CLIENTES / PROPOSTAS / PROPOSTA_LINHAS.
 */
async function hydrateFromSheetsOnce() {
  if (sheetsHydrated) return;

  // Marcamos como true imediatamente para evitar múltiplas tentativas simultâneas 
  // que gerariam spam de erros se o serviço estiver offline ou com CORS block
  sheetsHydrated = true;

  console.log('🔄 Tentando conectar ao Google Sheets...');

  try {
    // 1) Clients
    const clientRows = await fetchSheetRows('Clients');
    if (clientRows && clientRows.length > 0) {
      CLIENTES.length = 0;
      CLIENTES.push(...clientRows.map(sheetRowToCliente));
      console.log('✅ Clientes importados do Sheets.');
    }

    // 2) Proposals
    const proposalRows = await fetchSheetRows('Proposals');
    if (proposalRows && proposalRows.length > 0) {
      PROPOSTAS.length = 0;
      PROPOSTAS.push(...proposalRows.map(sheetRowToProposta));
      console.log('✅ Propostas importadas do Sheets.');
    }

    // 3) ProposalLines
    const lineRows = await fetchSheetRows('ProposalLines');
    if (lineRows && lineRows.length > 0) {
      PROPOSTA_LINHAS.length = 0;
      PROPOSTA_LINHAS.push(...lineRows.map(sheetRowToPropostaLinha));
      console.log('✅ Linhas de propostas importadas do Sheets.');
    }

    console.log('✨ Sincronização com Sheets concluída.');
  } catch (err) {
    // Erro silencioso para o utilizador, mas reportado na consola para o dev
    console.warn('⚠️ Não foi possível sincronizar com o Google Sheets (CORS ou Rede). A usar dados locais/mock.', err);
  }
}

const updateClientMetrics = (clientId: string) => {
  const client = CLIENTES.find(c => c.cliente_id === clientId);
  if (!client) return;

  const clientProps = PROPOSTAS.filter(p => p.cliente_id === clientId);
  const wonProps = clientProps.filter(p => p.resultado === 'Won');
  const openProps = clientProps.filter(p => p.resultado === 'Open');

  client.metrics = {
    total_proposals_created: clientProps.length,
    total_proposals_won: wonProps.length,
    total_value_won: wonProps.reduce((acc, p) => acc + p.total, 0),
    total_value_pipeline: openProps.reduce((acc, p) => acc + p.total, 0),
    win_rate_percent: clientProps.length > 0 ? (wonProps.length / clientProps.length) * 100 : 0
  };
  client.data_ultima_proposta = new Date().toISOString();
  client.last_contact_date = new Date().toISOString();
};

const addTimelineEvent = (event: Partial<TimelineEvent>) => {
  TIMELINE_EVENTS.unshift({
    event_id: 'E' + Date.now() + Math.random(),
    created_by: MOCK_USER.name,
    timestamp: new Date().toISOString(),
    client_id: '',
    type: 'note_added',
    description: '',
    ...event
  } as TimelineEvent);

  // Update last contact date
  if (event.client_id) {
    const client = CLIENTES.find(c => c.cliente_id === event.client_id);
    if (client) client.last_contact_date = new Date().toISOString();
  }
};

export function clienteToSheetsRow(cliente: Cliente) {
  return {
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
  };
}

function propostaToSheetsRow(proposta: Proposta, cliente?: Cliente) {
  return {
    proposal_id: proposta.proposta_id,
    internal_id: proposta.internal_id || '',
    subject: proposta.assunto || '',
    created_at: proposta.data_criacao,
    updated_at: proposta.data_atualizacao || '',
    valid_until: proposta.data_validade,
    status: proposta.estado,
    result: proposta.resultado,
    result_date: proposta.data_resultado || '',

    commercial_email: proposta.comercial_email,
    commercial_name: proposta.comercial_nome,
    commercial_initials: proposta.comercial_inicial || '',

    client_id: cliente?.cliente_id ?? proposta.cliente_id,
    client_contact_name: cliente?.nome_contacto || '',
    client_name: cliente?.nome_empresa ?? proposta.cliente_nome,
    client_email: cliente?.email ?? proposta.cliente_email,
    client_phone: cliente?.telefone || proposta.cliente_telefone || '',
    tax_id: cliente?.nif ?? proposta.nif,

    currency: proposta.moeda,
    payment_terms: proposta.condicoes_pagamento,
    delivery_terms: proposta.condicoes_entrega,
    delivery_time_weeks: proposta.prazo_entrega_semanas ?? '',
    packaging_type: proposta.tipo_embalagem || '',

    subtotal: proposta.subtotal,
    vat_percent: proposta.iva_percent,
    vat_value: proposta.iva_valor,
    total: proposta.total,

    customer_notes: proposta.observacoes_para_cliente,
    internal_notes: proposta.observacoes_internas,
    language: proposta.idioma,
    // Fix: Proposta uses 'mercado' instead of 'market'
    market: proposta.mercado || '',

    doc_id: proposta.doc_id || '',
    doc_url: proposta.doc_url || '',
    pdf_url: proposta.link_pdf_proposta || '',
    sent_date: proposta.data_envio_email || '',
    last_followup_date: proposta.data_ultimo_followup || '',
    lost_reason: proposta.motivo_perda || '',
  };
}

function propostaLinhaToSheetsRow(linha: PropostaLinha) {
  return {
    line_id: linha.linha_id,
    proposal_id: linha.proposta_id,
    product_id: linha.produto_id,
    product_name: linha.produto_nome,
    standard_model_code: linha.standard_model_code || '',
    description: linha.descricao_linha,
    quantity: linha.quantidade,
    unit_price: linha.preco_unitario,
    discount_percent: linha.desconto_percent,
    line_total: linha.total_linha,
    options_codes: linha.selectedOptionCodes?.join(';') || '',
    options_description: linha.selectedOptionsDetails || '',
    extras: linha.extras || '',
    internal_notes: linha.notas_linha || '',
  };
}

export const api = {
  getClientes: async (): Promise<Cliente[]> => {
    await hydrateFromSheetsOnce();
    await delay(200);
    return [...CLIENTES];
  },

  getClienteById: async (id: string): Promise<Cliente | undefined> => {
    await hydrateFromSheetsOnce();
    await delay(100);
    return CLIENTES.find(c => c.cliente_id === id);
  },

  getProdutos: async (): Promise<Produto[]> => {
    await delay(200);
    return productCatalog.getModels();
  },

  getPropostas: async (): Promise<Proposta[]> => {
    await hydrateFromSheetsOnce();
    await delay(300);
    return [...PROPOSTAS];
  },

  getPropostaById: async (id: string): Promise<{ proposta: Proposta, linhas: PropostaLinha[] } | null> => {
    await hydrateFromSheetsOnce();
    await delay(200);
    const proposta = PROPOSTAS.find(p => p.proposta_id === id || p.internal_id === id);
    if (!proposta) return null;
    const linhas = PROPOSTA_LINHAS.filter(l => l.proposta_id === proposta.proposta_id);
    return { proposta, linhas };
  },

  getMetaAtual: async (email: string): Promise<MetaVenda | undefined> => {
    await delay(200);
    const today = new Date();
    const mesAno = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return METAS.find(m => m.comercial_email === email && m.mes_ano === mesAno);
  },

  getTasks: async (clientId?: string): Promise<ClientTask[]> => {
    await delay(200);
    if (clientId) return TASKS.filter(t => t.client_id === clientId);
    return [...TASKS];
  },

  addTask: async (task: Partial<ClientTask>): Promise<ClientTask> => {
    await delay(300);
    const newTask: ClientTask = {
      task_id: 'T' + Date.now(),
      created_at: new Date().toISOString(),
      created_by: MOCK_USER.name,
      is_done: false,
      description: '',
      client_id: '',
      ...task
    } as ClientTask;
    TASKS.push(newTask);

    addTimelineEvent({
      client_id: task.client_id,
      type: 'task_created',
      description: `Task created: ${task.description}`
    });

    return newTask;
  },

  toggleTask: async (taskId: string): Promise<void> => {
    await delay(100);
    const t = TASKS.find(task => task.task_id === taskId);
    if (t) {
      t.is_done = !t.is_done;
      if (t.is_done) {
        addTimelineEvent({
          client_id: t.client_id,
          type: 'note_added',
          description: `Task completed: ${t.description}`
        });
      }
    }
  },

  getTimeline: async (clientId: string): Promise<TimelineEvent[]> => {
    await delay(200);
    return TIMELINE_EVENTS.filter(e => e.client_id === clientId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addTimelineEvent: async (event: Partial<TimelineEvent>) => {
    await delay(100);
    addTimelineEvent(event);
  },

  saveClientNotes: async (clientId: string, notes: string) => {
    await delay(200);
    const c = CLIENTES.find(cl => cl.cliente_id === clientId);
    if (c) c.notes = notes;
  },

  updateClientStatus: async (clientId: string, status: any) => {
    await delay(200);
    const c = CLIENTES.find(cl => cl.cliente_id === clientId);
    if (c) {
      addTimelineEvent({
        client_id: clientId,
        type: 'status_change',
        description: `Status changed from ${c.status} to ${status}`
      });
      c.status = status;
      if (c.status === 'Inactive Client') c.is_active = false;
      else c.is_active = true;
      c.updated_at = new Date().toISOString();
    }
  },

  createCliente: async (cliente: Cliente): Promise<Cliente> => {
    await delay(500);
    const newClient: Cliente = {
      ...cliente,
      cliente_id: cliente.cliente_id || `C-${Date.now()}`,
      data_criacao: cliente.data_criacao || new Date().toISOString(),
      status: cliente.status || 'Lead',
      preferred_language: cliente.preferred_language || 'English',
      market: cliente.market || 'International',
      metrics: cliente.metrics || {
        total_proposals_created: 0,
        total_proposals_won: 0,
        total_value_won: 0,
        total_value_pipeline: 0,
        win_rate_percent: 0,
      },
    };

    newClient.updated_at = new Date().toISOString();

    if (newClient.status === 'Inactive Client') newClient.is_active = false;
    else newClient.is_active = true;

    CLIENTES.push(newClient);
    addTimelineEvent({
      client_id: newClient.cliente_id,
      type: 'note_added',
      description: 'Client created.',
    });

    // Always try to sync to Sheets in Mock mode
    try {
      const row = clienteToSheetsRow(newClient);
      await postToSheets('Clients', row);
    } catch (error) {
      console.error('Erro ao gravar cliente na sheet Clients:', error);
    }

    return newClient;
  },

  updateCliente: async (cliente: Cliente): Promise<void> => {
    await delay(500);
    const idx = CLIENTES.findIndex(c => c.cliente_id === cliente.cliente_id);
    if (idx !== -1) {
      cliente.updated_at = new Date().toISOString();
      if (cliente.status === 'Inactive Client') cliente.is_active = false;
      else cliente.is_active = true;

      CLIENTES[idx] = { ...cliente };
      addTimelineEvent({
        client_id: cliente.cliente_id,
        type: 'note_added',
        description: 'Client details updated manually.'
      });
    }
  },

  saveProposta: async (
    proposta: Proposta,
    linhas: PropostaLinha[],
    isDraft: boolean = true
  ): Promise<string> => {
    await delay(800);

    const existingIdx = PROPOSTAS.findIndex(
      (p) => p.proposta_id === proposta.proposta_id || (proposta.internal_id && p.internal_id === proposta.internal_id)
    );

    if (existingIdx !== -1 && proposta.proposta_id) {
      const previous = PROPOSTAS[existingIdx];

      const updated: Proposta = {
        ...previous,
        ...proposta,
        data_atualizacao: new Date().toISOString(),
        estado: isDraft ? 'Draft' : previous.estado,
      };

      PROPOSTAS[existingIdx] = updated;

      for (let i = PROPOSTA_LINHAS.length - 1; i >= 0; i--) {
        if (PROPOSTA_LINHAS[i].proposta_id === previous.proposta_id) {
          PROPOSTA_LINHAS.splice(i, 1);
        }
      }

      PROPOSTA_LINHAS.push(
        ...linhas.map((line) => ({
          ...line,
          proposta_id: previous.proposta_id,
        })),
      );
      updateClientMetrics(updated.cliente_id);

      return updated.internal_id || updated.proposta_id;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const userProposalsToday = PROPOSTAS.filter(
      (p) =>
        p.comercial_email === proposta.comercial_email &&
        p.data_criacao.startsWith(todayStr)
    );

    const sequenceOfDay = userProposalsToday.length + 1;

    const smartReference = ProposalReferenceEngine.generate(
      today,
      proposta.comercial_nome,
      sequenceOfDay
    );

    const newProposta: Proposta = {
      ...proposta,
      proposta_id: smartReference,
      internal_id: proposta.internal_id || `P-${Date.now()}`,
      estado: isDraft ? 'Draft' : 'Pending Approval',
      data_atualizacao: new Date().toISOString(),
    };

    PROPOSTAS.push(newProposta);

    const updatedLinhas: PropostaLinha[] = linhas.map((l) => ({
      ...l,
      proposta_id: smartReference,
    }));
    PROPOSTA_LINHAS.push(...updatedLinhas);

    addTimelineEvent({
      client_id: newProposta.cliente_id,
      type: 'proposal_created',
      description: `Proposal ${isDraft ? 'draft ' : ''
        }created: ${newProposta.assunto || 'No subject'} (${newProposta.total.toFixed(2)}€)`,
      related_proposal_id: smartReference,
    });

    updateClientMetrics(newProposta.cliente_id);

    try {
      const relatedClient = CLIENTES.find(
        (c) => c.cliente_id === newProposta.cliente_id
      );

      const headerRow = propostaToSheetsRow(newProposta, relatedClient);
      await postToSheets('Proposals', headerRow);

      for (const linha of updatedLinhas) {
        const lineRow = propostaLinhaToSheetsRow(linha);
        await postToSheets('ProposalLines', lineRow);
      }
    } catch (error) {
      console.error('Erro ao gravar proposta nas sheets:', error);
    }

    return newProposta.internal_id || smartReference;
  },

  updatePropostaEstado: async (
    propostaId: string,
    estado: string,
    resultado: string,
    extras: Partial<Proposta> = {}
  ): Promise<void> => {
    await delay(400);
    const idx = PROPOSTAS.findIndex(p => p.proposta_id === propostaId || p.internal_id === propostaId);
    if (idx !== -1) {
      const prevEstado = PROPOSTAS[idx].estado;

      PROPOSTAS[idx] = {
        ...PROPOSTAS[idx],
        estado: estado as any,
        resultado: resultado as any,
        data_atualizacao: new Date().toISOString(),
        ...extras
      };

      if (prevEstado !== estado) {
        addTimelineEvent({
          client_id: PROPOSTAS[idx].cliente_id,
          type: 'status_change',
          description: `Proposal ${propostaId} changed to ${estado}`,
          related_proposal_id: PROPOSTAS[idx].internal_id || PROPOSTAS[idx].proposta_id
        });
      }

      updateClientMetrics(PROPOSTAS[idx].cliente_id);
    }
  },

  generateProposalDocument: async (proposalId: string): Promise<{ success: boolean, docId?: string, docUrl?: string, docHtml?: string, error?: string }> => {
    await delay(2000);

    const res = await api.getPropostaById(proposalId);
    if (!res) return { success: false, error: 'Proposal not found' };

    const client = CLIENTES.find(c => c.cliente_id === res.proposta.cliente_id);
    if (!client) return { success: false, error: 'Client not found' };

    // Gerar HTML Real
    const model = mapProposalToDocModel(res.proposta, client, res.linhas, MOCK_USER);
    const html = renderProposalHtml(model);

    const docId = `doc_${proposalId}_${Date.now()}`;

    const idx = PROPOSTAS.findIndex(p => p.proposta_id === proposalId || p.internal_id === proposalId);
    if (idx !== -1) {
      PROPOSTAS[idx].doc_id = docId;
      PROPOSTAS[idx].doc_url = 'internal://' + docId; // Identificador interno
      PROPOSTAS[idx].estado = 'Doc Generated';

      addTimelineEvent({
        client_id: PROPOSTAS[idx].cliente_id,
        type: 'doc_generated',
        description: `Document generated for proposal ${proposalId}`,
        related_proposal_id: PROPOSTAS[idx].internal_id || PROPOSTAS[idx].proposta_id
      });
    }

    return { success: true, docId, docHtml: html };
  },

  sendProposalEmail: async (payload: {
    proposalId: string,
    to: string,
    cc: string,
    subject: string,
    body: string,
    attachPdf: boolean,
    includeDocLink: boolean
  }): Promise<{ success: boolean, error?: string }> => {
    await delay(1500);

    const idx = PROPOSTAS.findIndex(p => p.proposta_id === payload.proposalId || p.internal_id === payload.proposalId);
    if (idx !== -1) {
      PROPOSTAS[idx].estado = 'Sent';
      PROPOSTAS[idx].data_envio_email = new Date().toISOString();
      PROPOSTAS[idx].last_email_to = payload.to;
      PROPOSTAS[idx].last_email_cc = payload.cc;
      PROPOSTAS[idx].last_email_subject = payload.subject;

      addTimelineEvent({
        client_id: PROPOSTAS[idx].cliente_id,
        type: 'proposal_sent',
        description: `Proposal emailed to ${payload.to}`,
        related_proposal_id: PROPOSTAS[idx].internal_id || PROPOSTAS[idx].proposta_id
      });
      updateClientMetrics(PROPOSTAS[idx].cliente_id);
    }

    return { success: true };
  },

  generateEmailBodyAI: async (proposal: Proposta, lines: PropostaLinha[]): Promise<string> => {
    return generateProposalEmailBody(proposal, lines);
  },

  gerarEEnviarProposta: async (propostaId: string): Promise<string> => {
    const res = await api.generateProposalDocument(propostaId);
    if (res.success) return 'Sucesso';
    return 'Erro';
  }
};
