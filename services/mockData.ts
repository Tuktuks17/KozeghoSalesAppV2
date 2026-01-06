
import { Cliente, Proposta, PropostaLinha, MetaVenda, ClientTask, TimelineEvent } from '../types';

export const MOCK_USER = {
  email: 'joao.silva@kozegho.com',
  name: 'João Silva',
  photoUrl: 'https://ui-avatars.com/api/?name=Joao+Silva&background=0ea5e9&color=fff'
};

export const CLIENTES: Cliente[] = [
  {
    cliente_id: 'C001',
    nome_empresa: 'TechSolutions Lda',
    nome_contacto: 'Ana Pereira',
    nif: '501234567',
    email: 'ana@techsolutions.pt',
    telefone: '+351 912345678',
    morada_faturacao: 'Rua da Inovação 12, Lisboa',
    morada_entrega: 'Rua da Inovação 12, Lisboa',
    pais: 'Portugal',
    segmento: 'IT',
    data_criacao: '2024-01-10T10:00:00Z',
    data_ultima_proposta: '',
    status: 'Active Client',
    website: 'www.techsolutions.pt',
    metrics: {
        total_proposals_created: 0,
        total_proposals_won: 0,
        total_value_won: 0,
        total_value_pipeline: 0,
        win_rate_percent: 0
    },
    last_contact_date: new Date().toISOString(),
    preferred_language: 'Portuguese',
    market: 'National',
    is_active: true
  },
  {
    cliente_id: 'C002',
    nome_empresa: 'Construções Norte SA',
    nome_contacto: 'Carlos Sousa',
    nif: '509876543',
    email: 'compras@construcoesnorte.pt',
    telefone: '+351 223344556',
    morada_faturacao: 'Av. dos Aliados 50, Porto',
    morada_entrega: 'Estaleiro A, Gaia',
    pais: 'Portugal',
    segmento: 'Construction',
    data_criacao: '2024-02-01T09:00:00Z',
    status: 'Prospect',
    metrics: {
        total_proposals_created: 0,
        total_proposals_won: 0,
        total_value_won: 0,
        total_value_pipeline: 0,
        win_rate_percent: 0
    },
    last_contact_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    preferred_language: 'Portuguese',
    market: 'National',
    is_active: true
  },
  {
    cliente_id: 'C003',
    nome_empresa: 'Grupo Hoteleiro Sol',
    nome_contacto: 'Marta Lima',
    nif: '505555555',
    email: 'marta@gruposol.pt',
    telefone: '+351 933333333',
    morada_faturacao: 'Algarve, PT',
    morada_entrega: 'Algarve, PT',
    pais: 'Portugal',
    segmento: 'Hospitality',
    data_criacao: '2024-01-05T09:00:00Z',
    status: 'Active Client',
    metrics: {
        total_proposals_created: 0,
        total_proposals_won: 0,
        total_value_won: 0,
        total_value_pipeline: 0,
        win_rate_percent: 0
    },
    last_contact_date: new Date(Date.now() - 86400000).toISOString(),
    preferred_language: 'English',
    market: 'International',
    is_active: true
  }
];

export const TASKS: ClientTask[] = [
    {
        task_id: 'T1',
        client_id: 'C002',
        client_name: 'Construções Norte SA',
        description: 'Call to check budget approval status',
        created_by: MOCK_USER.name,
        created_at: new Date().toISOString(),
        is_done: false
    }
];

export const TIMELINE_EVENTS: TimelineEvent[] = [
    {
        event_id: 'E2',
        client_id: 'C001',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'call_logged',
        description: 'Discussed requirements for new server rack.',
        created_by: MOCK_USER.name
    }
];

// Helper for dates relative to today
const now = new Date();

export const PROPOSTAS: Proposta[] = [];

export const PROPOSTA_LINHAS: PropostaLinha[] = [];

export const METAS: MetaVenda[] = [
  {
    comercial_email: MOCK_USER.email,
    mes_ano: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    objetivo_valor: 50000
  }
];
