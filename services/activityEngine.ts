
import { api } from './api';
import { SuggestedAction, User, Proposta } from '../types';

const ONE_DAY_MS = 86400000;

const calculateDaysDiff = (dateString?: string) => {
    if (!dateString) return 9999;
    const date = new Date(dateString);
    const now = new Date();
    return (now.getTime() - date.getTime()) / ONE_DAY_MS;
};

const FILLER_ACTIONS: SuggestedAction[] = [
    {
        id: 'SEED-1', type: 'FOLLOW_UP', title: 'Follow up on renewal with TechSolutions Lda',
        description: 'Contract renewal worth €8,900', created_for_user: 'system', origin: 'system',
        created_at: new Date().toISOString(), urgency_score: 10, related_client_id: 'C001'
    },
    {
        id: 'SEED-2', type: 'FOLLOW_UP', title: 'Send final proposal to Construções Norte SA',
        description: 'Closing phase – IT infrastructure upgrade', created_for_user: 'system', origin: 'system',
        created_at: new Date().toISOString(), urgency_score: 9, related_client_id: 'C002'
    },
    {
        id: 'SEED-3', type: 'TASK', title: 'Schedule implementation kickoff with Grupo Hoteleiro Sol',
        description: 'Won project – align delivery dates', created_for_user: 'system', origin: 'system',
        created_at: new Date().toISOString(), urgency_score: 8, related_client_id: 'C003'
    },
    {
        id: 'SEED-4', type: 'RECONNECT', title: 'Reconnect with Construções Norte SA',
        description: 'No contact for 45 days – check new needs', created_for_user: 'system', origin: 'system',
        created_at: new Date().toISOString(), urgency_score: 7, related_client_id: 'C002'
    },
    {
        id: 'SEED-5', type: 'TASK', title: 'Upsell maintenance package to TechSolutions Lda',
        description: 'Present 24/7 support option', created_for_user: 'system', origin: 'system',
        created_at: new Date().toISOString(), urgency_score: 6, related_client_id: 'C001'
    },
    {
        id: 'SEED-6', type: 'FOLLOW_UP', title: 'Confirm payment terms with Grupo Hoteleiro Sol',
        description: 'Align invoicing schedule for new deal', created_for_user: 'system', origin: 'system',
        created_at: new Date().toISOString(), urgency_score: 5, related_client_id: 'C003'
    }
];

export const activityEngine = {
    generateSuggestions: async (user: User): Promise<SuggestedAction[]> => {
        const [proposals, clients, tasks] = await Promise.all([
            api.getPropostas(),
            api.getClientes(),
            api.getTasks()
        ]);

        const myProposals = proposals.filter(p => p.comercial_email === user.email);
        const myTasks = tasks.filter(t => !t.is_done); // Filter only open tasks
        
        const suggestions: SuggestedAction[] = [];

        // 1) FOLLOW_UP: Sent > 3 days ago, still Open
        myProposals.forEach(p => {
            if (p.estado === 'Sent' && p.resultado === 'Open' && p.data_envio_email) {
                const daysSinceSent = calculateDaysDiff(p.data_envio_email);
                if (daysSinceSent >= 3) {
                    suggestions.push({
                        id: `FOLLOW-${p.proposta_id}`,
                        type: 'FOLLOW_UP',
                        title: `Follow up with ${p.cliente_nome}`,
                        description: `Sent ${daysSinceSent.toFixed(0)} days ago • ${p.total.toFixed(0)}€`,
                        related_proposal_id: p.internal_id || p.proposta_id,
                        related_client_id: p.cliente_id,
                        created_for_user: user.email,
                        origin: 'system',
                        created_at: new Date().toISOString(),
                        urgency_score: 20
                    });
                }
            }
        });

        // 2) RECONNECT: No contact > 30 days
        clients.forEach(c => {
            if (['Lead', 'Prospect', 'Active Client'].includes(c.status)) {
                const daysSinceContact = calculateDaysDiff(c.last_contact_date);
                if (daysSinceContact > 30) {
                    suggestions.push({
                        id: `RECONNECT-${c.cliente_id}`,
                        type: 'RECONNECT',
                        title: `Reconnect with ${c.nome_empresa}`,
                        description: `No contact for ${daysSinceContact.toFixed(0)} days`,
                        related_client_id: c.cliente_id,
                        created_for_user: user.email,
                        origin: 'system',
                        created_at: new Date().toISOString(),
                        urgency_score: 10
                    });
                }
            }
        });

        // 3) TASK: Manual tasks
        myTasks.forEach(t => {
            suggestions.push({
                id: t.task_id,
                type: 'TASK',
                title: t.description,
                description: `Task for ${t.client_name || 'Client'}`,
                related_client_id: t.client_id,
                created_for_user: t.created_by,
                origin: 'manual',
                created_at: t.created_at,
                urgency_score: 15
            });
        });

        suggestions.sort((a, b) => b.urgency_score - a.urgency_score);

        // Ensure exactly 6 items by filling with seed data if needed
        const needed = 6 - suggestions.length;
        if (needed > 0) {
            // Use seeds to fill, recycling if necessary but since we have 6 seeds and need max 6 total, 
            // we just take the first N seeds.
            for (let i = 0; i < needed && i < FILLER_ACTIONS.length; i++) {
                // Use spread to create a new object to avoid reference issues and update timestamp
                suggestions.push({
                    ...FILLER_ACTIONS[i],
                    created_at: new Date().toISOString()
                });
            }
        }

        return suggestions.slice(0, 6);
    },

    getTodaysFocus: () => [],
    getAchievements: () => []
};
