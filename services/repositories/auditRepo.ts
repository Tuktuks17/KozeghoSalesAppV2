
import { supabase } from '../supabase/client';

export const auditRepo = {
    log: async (action: string, entityType: string, entityId: string, metadata: any = {}) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Should not happen usually

        const { data: profile } = await supabase.from('profiles').select('id, org_id').eq('id', user.id).single();
        if (!profile) return;

        await supabase.from('audit_logs').insert({
            org_id: profile.org_id,
            actor_id: profile.id,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata
        });
    }
};
