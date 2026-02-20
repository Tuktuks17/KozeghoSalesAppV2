
import { Cliente, MetaVenda, Produto, Proposta, PropostaLinha, ClientTask, TimelineEvent } from '../types';
import { supabase } from './supabase';
import { productCatalog } from './productCatalog';
import { mapProposalToDocModel, renderProposalHtml } from './documentGenerator';
import { GoogleGenAI } from "@google/genai";
import { MOCK_USER } from './mockData'; // Fallback for user if needed

// --- MAPPERS ---
function dbToCliente(row: any): Cliente {
    return {
        cliente_id: row.id,
        nome_empresa: row.company_name,
        nome_contacto: row.contact_name,
        nif: row.nif || '',
        email: row.email,
        telefone: row.phone || '',
        morada_faturacao: row.billing_address || '',
        morada_entrega: row.delivery_address || '',
        pais: row.country || 'Portugal',
        segmento: row.industry || '',
        data_criacao: row.created_at,
        data_ultima_proposta: row.last_proposal_date || undefined,
        status: row.status as any || 'Lead',
        website: row.website,
        company_size: row.company_size,
        notes: row.notes,
        last_contact_date: row.last_contact_date,
        preferred_language: row.preferred_language as any || 'Portuguese',
        market: row.market as any || 'National',
        created_from: 'import',
        updated_at: row.updated_at,
        is_active: row.is_active,
        metrics: { // TODO: Implement metrics calculation or view
            total_proposals_created: 0,
            total_proposals_won: 0,
            total_value_won: 0,
            total_value_pipeline: 0,
            win_rate_percent: 0,
        }
    };
}

function clienteToDb(c: Cliente) {
    return {
        // id: c.cliente_id, // Let DB generate ID if new, or handle update
        owner_id: (supabase.auth.getUser() as any)?.data?.user?.id, // This will be handled by API call context usually
        company_name: c.nome_empresa,
        contact_name: c.nome_contacto,
        nif: c.nif,
        email: c.email,
        phone: c.telefone,
        billing_address: c.morada_faturacao,
        country: c.pais,
        industry: c.segmento,
        status: c.status,
        preferred_language: c.preferred_language,
        market: c.market,
        website: c.website,
        company_size: c.company_size,
        notes: c.notes,
        is_active: c.is_active !== false
    };
}

function dbToProposta(row: any): Proposta {
    return {
        proposta_id: row.public_id || row.id,
        internal_id: row.internal_id || row.id,
        assunto: row.subject,
        data_criacao: row.created_at,
        data_atualizacao: row.updated_at,
        data_validade: row.valid_until,
        estado: row.status as any,
        resultado: row.result as any,
        data_resultado: row.result_date,

        comercial_email: '', // Should fetch owner profile
        comercial_nome: '',

        cliente_id: row.client_id,
        cliente_nome: '', // Need join
        cliente_email: '', // Need join
        nif: '', // Need join

        moeda: row.currency || 'EUR',
        condicoes_pagamento: row.payment_terms || '',
        condicoes_entrega: row.delivery_terms || '',
        prazo_entrega_semanas: row.delivery_weeks,

        desconto_global_percent: row.discount_percent || 0,
        subtotal: row.subtotal || 0,
        iva_percent: row.tax_percent || 23,
        iva_valor: row.tax_value || 0,
        total: row.total || 0,

        idioma: 'Portuguese', // defaults
        observacoes_internas: row.internal_notes || '',
        observacoes_para_cliente: row.customer_notes || '',

        doc_id: row.doc_url, // Simplification
        doc_url: row.doc_url,
        link_pdf_proposta: row.pdf_url,

        data_envio_email: row.sent_date
    };
}

// --- API IMPLEMENTATION ---

export const api = {
    getClientes: async (): Promise<Cliente[]> => {
        const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data.map(dbToCliente);
    },

    getClienteById: async (id: string): Promise<Cliente | undefined> => {
        const { data, error } = await supabase.from('clients').select('*').eq('id', id).single(); // Assuming internal ID use
        // Fallback: search by ID if it's not UUID?
        if (error) {
            // try fetching by internal logic?
            return undefined;
        }
        return dbToCliente(data);
    },

    getProdutos: async (): Promise<Produto[]> => {
        // For now, return static catalog. 
        // Ideally sync static catalog to DB 'products' table, but preserving parity first.
        return productCatalog.getModels();
    },

    getPropostas: async (): Promise<Proposta[]> => {
        const { data, error } = await supabase.from('proposals').select(`
        *,
        clients (company_name, email, nif, contact_name, phone),
        profiles:owner_id (email, full_name)
    `).order('created_at', { ascending: false });

        if (error) return [];

        return data.map((row: any) => {
            const p = dbToProposta(row);
            // Enrich
            p.cliente_nome = row.clients?.company_name || '';
            p.cliente_email = row.clients?.email || '';
            p.nif = row.clients?.nif || '';
            p.cliente_telefone = row.clients?.phone || '';
            p.comercial_email = row.profiles?.email || '';
            p.comercial_nome = row.profiles?.full_name || '';
            return p;
        });
    },

    getPropostaById: async (id: string): Promise<{ proposta: Proposta, linhas: PropostaLinha[] } | null> => {
        // Try by public_id first
        const { data, error } = await supabase.from('proposals').select(`
        *,
        clients (*),
        profiles:owner_id (*)
    `).eq('public_id', id).single();

        let proposalData = data;

        if (error || !data) {
            // Try UUID
            const { data: dataUuid } = await supabase.from('proposals').select(`*, clients (*), profiles:owner_id (*)`).eq('id', id).single();
            proposalData = dataUuid;
        }

        if (!proposalData) return null;

        const p = dbToProposta(proposalData);
        p.cliente_nome = proposalData.clients?.company_name || '';
        p.cliente_email = proposalData.clients?.email || '';
        p.cliente_telefone = proposalData.clients?.phone || '';
        p.cliente_id = proposalData.clients?.id || proposalData.client_id; // UUID
        p.comercial_email = proposalData.profiles?.email || '';
        p.comercial_nome = proposalData.profiles?.full_name || '';


        // Fetch Items
        const { data: linesData } = await supabase.from('proposal_items').select('*').eq('proposal_id', proposalData.id);
        const linhas: PropostaLinha[] = (linesData || []).map((l: any) => ({
            linha_id: l.id,
            proposta_id: p.proposta_id,
            produto_id: l.product_id,
            produto_nome: l.product_name,
            descricao_linha: l.description,
            quantidade: Number(l.quantity),
            preco_unitario: Number(l.unit_price),
            desconto_percent: Number(l.discount_percent),
            total_linha: Number(l.line_total),
            selectedOptionsDetails: l.configuration_json ? JSON.stringify(l.configuration_json) : '',
            // Extras not in schema but needed?
            extras: '',
            selectedOptionCodes: [] // Would need parsing
        }));

        return { proposta: p, linhas };
    },

    getMetaAtual: async (email: string): Promise<MetaVenda | undefined> => {
        // Mock response for now
        await new Promise(r => setTimeout(r, 100));
        const today = new Date();
        return {
            comercial_email: email,
            mes_ano: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
            objetivo_valor: 25000 // Default
        };
    },

    getTasks: async (clientId?: string): Promise<ClientTask[]> => {
        // Return empty or fetch from future 'tasks' table
        return [];
    },

    addTask: async (task: Partial<ClientTask>): Promise<ClientTask> => {
        return { ...task, task_id: 'temp', created_at: new Date().toISOString(), is_done: false } as ClientTask;
    },

    toggleTask: async (taskId: string): Promise<void> => { },

    getTimeline: async (clientId: string): Promise<TimelineEvent[]> => {
        const { data } = await supabase.from('timeline_events').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
        if (!data) return [];
        return data.map((e: any) => ({
            event_id: e.id,
            client_id: e.client_id,
            timestamp: e.created_at,
            type: e.type,
            description: e.description,
            created_by: 'System' // could join user
        }));
    },

    addTimelineEvent: async (event: Partial<TimelineEvent>) => {
        const { data: session } = await supabase.auth.getSession();
        await supabase.from('timeline_events').insert({
            client_id: event.client_id,
            proposal_id: event.related_proposal_id, // ensure key match
            type: event.type || 'info',
            description: event.description,
            user_id: session?.session?.user.id
        });
    },

    saveClientNotes: async (clientId: string, notes: string) => {
        await supabase.from('clients').update({ notes }).eq('id', clientId);
    },

    updateClientStatus: async (clientId: string, status: any) => {
        await supabase.from('clients').update({ status }).eq('id', clientId);
    },

    createCliente: async (cliente: Cliente): Promise<void> => {
        const { data: session } = await supabase.auth.getSession();
        const payload = {
            ...clienteToDb(cliente),
            owner_id: session?.session?.user.id
        };
        await supabase.from('clients').insert(payload);
    },

    updateCliente: async (cliente: Cliente): Promise<void> => {
        await supabase.from('clients').update(clienteToDb(cliente)).eq('id', cliente.cliente_id);
    },

    saveProposta: async (
        proposta: Proposta,
        linhas: PropostaLinha[],
        isDraft: boolean = true
    ): Promise<string> => {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user.id;

        // 1. Identify if update or insert
        // If proposta.proposta_id exists in DB (public_id), update.
        // NOTE: Application uses 'proposta_id' as the Ref String. internal_id is transparent.
        // But for creation we generate one.

        let proposalUUID = '';

        // Check if exists
        const { data: existing } = await supabase.from('proposals').select('id, public_id').eq('public_id', proposta.proposta_id).single();

        if (existing) {
            proposalUUID = existing.id;
            // Update
            await supabase.from('proposals').update({
                subject: proposta.assunto,
                status: isDraft ? 'Draft' : proposta.estado,
                currency: proposta.moeda,
                subtotal: proposta.subtotal,
                tax_percent: proposta.iva_percent,
                tax_value: proposta.iva_valor,
                total: proposta.total,
                updated_at: new Date().toISOString(),
                internal_notes: proposta.observacoes_internas,
                customer_notes: proposta.observacoes_para_cliente,
                // ... other fields
            }).eq('id', proposalUUID);

            // Replace items
            await supabase.from('proposal_items').delete().eq('proposal_id', proposalUUID);
        } else {
            // Insert
            // Generate REF logic needed here? ProposalReferenceEngine? 
            // For now trusting the ID passed or generating one?
            // Mock API generated it. 'saveProposta' in mock generated it.
            // We should replicate that logic.

            // If ID is empty or temp, generate new.
            // Assuming Logic is:
            const { data: userProps } = await supabase.from('proposals').select('id').eq('owner_id', userId).like('created_at', `${new Date().toISOString().split('T')[0]}%`);
            const seq = (userProps?.length || 0) + 1;
            // ... Reuse ProposalReferenceEngine if possible, or simplified:
            const ref = proposta.proposta_id || `REF-${Date.now()}`; // IMPROVE THIS

            const { data: newProp, error } = await supabase.from('proposals').insert({
                public_id: ref,
                owner_id: userId,
                client_id: proposta.cliente_id, // UUID expected
                subject: proposta.assunto,
                status: isDraft ? 'Draft' : 'Pending Approval',
                subtotal: proposta.subtotal,
                total: proposta.total,
                // ...
            }).select().single();

            if (error) throw error;
            proposalUUID = newProp.id;
        }

        // Insert Items
        const items = linhas.map(l => ({
            proposal_id: proposalUUID,
            product_name: l.produto_nome,
            quantity: l.quantidade,
            unit_price: l.preco_unitario,
            line_total: l.total_linha,
            // ...
        }));

        if (items.length > 0) {
            await supabase.from('proposal_items').insert(items);
        }

        return existing ? existing.public_id : (await supabase.from('proposals').select('public_id').eq('id', proposalUUID).single()).data?.public_id || '';
    },

    updatePropostaEstado: async (propostaId: string, estado: string, resultado: string, extras: Partial<Proposta> = {}): Promise<void> => {
        await supabase.from('proposals').update({
            status: estado,
            result: resultado,
            updated_at: new Date().toISOString()
        }).eq('public_id', propostaId);
    },

    generateProposalDocument: async (proposalId: string): Promise<{ success: boolean, docId?: string, docUrl?: string, docHtml?: string, error?: string }> => {
        // Re-use API logic but fetching from DB
        const res = await api.getPropostaById(proposalId);
        if (!res) return { success: false };

        // Same generation logic
        const client = await api.getClienteById(res.proposta.cliente_id);
        const model = mapProposalToDocModel(res.proposta, client!, res.linhas, MOCK_USER);
        const html = renderProposalHtml(model);

        // Upload to Storage
        const blob = new Blob([html], { type: 'text/html' });
        const fileName = `proposals/${proposalId}.html`;
        const { error } = await supabase.storage.from('proposals').upload(fileName, blob, { upsert: true });

        if (error) return { success: false, error: error.message };

        // Get URL
        const { data } = supabase.storage.from('proposals').getPublicUrl(fileName);

        // Update Proposal with URL
        await supabase.from('proposals').update({
            doc_url: data.publicUrl
        }).eq('public_id', proposalId);

        return { success: true, docUrl: data.publicUrl, docHtml: html };
    },

    sendProposalEmail: async (payload: any): Promise<{ success: boolean, error?: string }> => {
        // Mock for now, or use Edge Function
        await supabase.from('proposals').update({ status: 'Sent', sent_date: new Date().toISOString() }).eq('public_id', payload.proposalId);
        return { success: true };
    },

    generateEmailBodyAI: async (proposal: Proposta, lines: PropostaLinha[]): Promise<string> => {
        // Same implementation as Mock
        try {
            if (!process.env.API_KEY) return "No API Key";
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const itemsList = lines.map(l => `- ${l.produto_nome}`).join('\n');
            const prompt = `Write sales email...`; // Shortened for brevity
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            return response.text || "";
        } catch (e) { return "Error"; }
    },

    gerarEEnviarProposta: async (propostaId: string): Promise<string> => {
        return (await api.generateProposalDocument(propostaId)).success ? 'Sucesso' : 'Erro';
    }
};

export const clienteToSheetsRow = (c: Cliente) => { return {}; } // No-op for Supabase
