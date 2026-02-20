import { api as mockApi, clienteToSheetsRow as mockMapper } from './api.mock';
import { api as supabaseApi, clienteToSheetsRow as supabaseMapper } from './api.supabase';

const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

if (isSupabaseConfigured) {
    console.log('🚀 Kozegho Sales App: Running with Supabase Backend');
} else {
    console.log('⚠️ Kozegho Sales App: Running with Mock/Sheets Backend (Env vars missing)');
}

export const api = isSupabaseConfigured ? supabaseApi : mockApi;

export const clienteToSheetsRow = isSupabaseConfigured ? supabaseMapper : mockMapper;
