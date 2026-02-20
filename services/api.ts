import { api as mockApi, clienteToSheetsRow as mockMapper } from './api.mock';
import { api as supabaseApi, clienteToSheetsRow as supabaseMapper } from './api.supabase';
import { backendRuntime } from './runtimeConfig';

type ApiContract = typeof supabaseApi;

const createConfigErrorApi = (message: string): ApiContract =>
  new Proxy(
    {},
    {
      get: () => async () => {
        throw new Error(message);
      },
    },
  ) as ApiContract;

const forcedSupabaseMissingEnvMessage =
  'Backend mode is set to supabase, but required env vars are missing. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';

if (backendRuntime.configError) {
  console.error(`❌ Kozegho Sales App: ${backendRuntime.configError}`);
} else if (backendRuntime.isSupabaseMode) {
  console.log('🚀 Kozegho Sales App: Running with Supabase Backend');
} else {
  console.log('⚠️ Kozegho Sales App: Running with Mock Backend');
}

export const api: ApiContract = backendRuntime.configError
  ? createConfigErrorApi(forcedSupabaseMissingEnvMessage)
  : (backendRuntime.isSupabaseMode ? supabaseApi : mockApi);

export const clienteToSheetsRow =
  backendRuntime.isSupabaseMode && !backendRuntime.configError ? supabaseMapper : mockMapper;

export const backendInfo = backendRuntime;
