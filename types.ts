
export interface Cliente {
  cliente_id: string;
  nome_empresa: string; // company_name
  nome_contacto: string; // contact_name
  nif: string; // tax_id
  email: string;
  telefone: string; // phone
  morada_faturacao: string; // billing_address
  morada_entrega: string;
  pais: string; // country
  segmento: string; // industry
  data_criacao: string;
  data_ultima_proposta?: string;

  // CRM Extensions
  status: 'Lead' | 'Prospect' | 'Active Client' | 'Inactive Client';
  website?: string;
  company_size?: string;
  notes?: string; // internal_notes
  last_contact_date?: string;
  
  // New fields for Proposal Logic
  preferred_language: 'Portuguese' | 'English' | 'Spanish' | 'French';
  market: 'National' | 'International';

  // New Audit fields
  created_from?: 'clients_screen' | 'new_proposal_flow' | 'import';
  updated_at?: string;
  is_active?: boolean;

  metrics?: {
    total_proposals_created: number;
    total_proposals_won: number;
    total_value_won: number;
    total_value_pipeline: number;
    win_rate_percent: number;
  };
}

export type ProductFamily = 'CS' | 'CL-D' | 'CSL' | 'PD' | 'BS' | 'BL' | 'KDC' | 'TCP' | 'TCI' | 'TCC' | 'TPP' | 'DEP' | 'AMR-S' | 'AMR-T' | 'AMR' | 'APL' | 'ATL' | 'AFL' | 'KSENSE' | 'CNP' | 'BETA' | 'GAMMA' | 'VAM' | 'S1' | 'S2' | 'S3' | 'GENERAL';

// Maps to StandardModel in the new catalog
export interface Produto {
  produto_id: string; // Maps to id
  referencia: string; // Maps to code
  nome_produto: string; // Maps to name
  descricao_curta: string; // Maps to description
  descricao_detalhada: string; // Maps to technicalSummary
  preco_base: number; // Maps to basePriceEUR
  moeda: string;
  iva_percent: number;
  tipo: string;
  variantes_possiveis: string[]; // kept for compatibility, though used differently now
  ativo: boolean;
  
  // New fields for catalog
  family: ProductFamily;
  optionCodes: string[];
}

export interface StandardModel {
    model_id: string;
    family_code: ProductFamily;
    standard_model_code: string;
    display_name: string;
    base_price_eur: number;
    bund_price_eur?: number; // Specific for DEP models
}

export interface AvailableOption {
    code: string;
    label: string;
    priceEUR: number;
    families: ProductFamily[];
    is_default_selected?: boolean;
}

export type EstadoProposta = 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Won' | 'Lost' | 'Doc Generated';
export type ResultadoProposta = 'Open' | 'Won' | 'Lost';

export interface Proposta {
  proposta_id: string; // The human-readable reference (e.g., 1122BMK/25)
  internal_id?: string; // Technical UUID
  assunto?: string;
  data_criacao: string;
  data_atualizacao?: string;
  data_validade: string;
  estado: EstadoProposta;
  resultado: ResultadoProposta;
  data_resultado?: string;
  
  // Salesperson Info
  comercial_email: string;
  comercial_nome: string;
  comercial_inicial?: string; // Single char (M, A, etc.)

  // Client Info
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefone?: string;
  nif: string;
  
  moeda: string;
  
  // Commercial Conditions
  condicoes_pagamento: string;
  condicoes_entrega: string;
  prazo_entrega_semanas?: number;
  tipo_embalagem?: 'Standard' | 'Ocean freight';
  
  // Financials
  desconto_global_percent: number;
  subtotal: number;
  iva_percent: number;
  iva_valor: number;
  total: number;
  
  // Metadata
  idioma: 'Portuguese' | 'English' | 'Spanish' | 'French'; // updated to match client
  mercado?: 'National' | 'International'; // Snapshot of client market
  observacoes_internas: string;
  observacoes_para_cliente: string;
  
  // Approvals & Docs
  aprovado_por?: string;
  data_aprovacao?: string;
  
  // Document Integration
  doc_id?: string;
  doc_url?: string;
  
  // Email Tracking
  data_envio_email?: string;
  last_email_to?: string;
  last_email_cc?: string;
  last_email_subject?: string;
  
  data_ultimo_followup?: string;
  link_pdf_proposta?: string; // Legacy field, keep for now
  motivo_perda?: string; // Reason lost
}

export interface PropostaLinha {
  linha_id: string;
  proposta_id: string;
  produto_id: string;
  produto_nome: string;
  descricao_linha: string;
  quantidade: number;
  preco_unitario: number; // Base price of model + options
  base_price_eur?: number; // Base price of just the model (no options)
  desconto_percent: number;
  total_linha: number;
  variantes_escolhidas?: string;
  extras?: string;
  notas_linha?: string;

  // New fields for options
  selectedOptionCodes?: string[];
  selectedOptionsDetails?: string; // JSON string or formatted text of selected options
  standard_model_code?: string;
}

export interface MetaVenda {
  comercial_email: string;
  mes_ano: string;
  objetivo_valor: number;
}

// CRM: Timeline & Tasks
export interface TimelineEvent {
  event_id: string;
  client_id: string;
  timestamp: string;
  type: 'proposal_created' | 'proposal_sent' | 'proposal_won' | 'proposal_lost' | 'email_sent' | 'note_added' | 'call_logged' | 'meeting_logged' | 'task_created' | 'status_change' | 'doc_generated';
  description: string;
  related_proposal_id?: string;
  created_by: string;
}

export interface ClientTask {
  task_id: string;
  client_id: string;
  client_name?: string; // Denormalized for easier dashboard display
  description: string;
  created_by: string;
  created_at: string;
  is_done: boolean;
}

export interface User {
  email: string;
  name: string;
  photoUrl?: string;
}

// Activity Engine Types
export type SuggestionType = 'SEND' | 'FOLLOW_UP' | 'EXPIRING_SOON' | 'RECONNECT' | 'TASK';

export interface SuggestedAction {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  related_proposal_id?: string;
  related_client_id?: string;
  created_for_user: string;
  origin: 'system' | 'manual';
  created_at: string;
  urgency_score: number; // Helper for sorting
}
