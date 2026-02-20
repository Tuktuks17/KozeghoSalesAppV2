
import { supabase } from '../supabase/client';
import { ClientTask } from '../../types';

const toTask = (row: any): ClientTask => ({
    task_id: row.id,
    client_id: row.customer_id,
    client_name: row.customers?.name || undefined,
    description: row.description || row.title,
    created_by: row.created_by || 'system',
    created_at: row.created_at,
    is_done: row.is_done
});

export const tasksRepo = {
    list: async (clientId?: string): Promise<ClientTask[]> => {
        let query = supabase.from('tasks').select('*, customers(name)').order('created_at', { ascending: false });
        if (clientId) query = query.eq('customer_id', clientId);

        const { data, error } = await query;
        if (error) return [];
        return data.map(toTask);
    },

    create: async (task: Partial<ClientTask>): Promise<ClientTask | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        // Get org
        const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();

        const { data, error } = await supabase.from('tasks').insert({
            org_id: profile?.org_id,
            title: task.description?.substring(0, 50) || 'Task',
            description: task.description,
            customer_id: task.client_id,
            created_by: user.id,
            is_done: false
        }).select().single();

        if (error) return null;
        return toTask(data);
    },

    toggle: async (taskId: string): Promise<boolean> => {
        // Fetch current
        const { data: current } = await supabase.from('tasks').select('is_done').eq('id', taskId).single();
        if (!current) return false;

        const { error } = await supabase.from('tasks').update({ is_done: !current.is_done }).eq('id', taskId);
        return !error;
    }
};
