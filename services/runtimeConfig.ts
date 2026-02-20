export type BackendMode = 'auto' | 'supabase' | 'mock';
type ResolvedBackendMode = Exclude<BackendMode, 'auto'>;

const parseBackendMode = (rawMode: string | undefined): BackendMode => {
  const normalized = (rawMode || 'auto').trim().toLowerCase();
  if (normalized === 'supabase' || normalized === 'mock' || normalized === 'auto') {
    return normalized;
  }
  return 'auto';
};

export const resolveBackendRuntime = ({
  mode,
  supabaseUrl,
  supabaseAnonKey,
}: {
  mode?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}) => {
  const hasSupabaseEnv = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);
  const requestedMode = parseBackendMode(mode);

  const resolvedMode: ResolvedBackendMode =
    requestedMode === 'auto'
      ? (hasSupabaseEnv ? 'supabase' : 'mock')
      : requestedMode;

  const configError =
    requestedMode === 'supabase' && !hasSupabaseEnv
      ? 'Supabase mode is forced but VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing.'
      : undefined;

  return {
    requestedMode,
    resolvedMode,
    hasSupabaseEnv,
    configError,
    isMockMode: resolvedMode === 'mock',
    isSupabaseMode: resolvedMode === 'supabase',
  } as const;
};

export const backendRuntime = resolveBackendRuntime({
  mode: import.meta.env.VITE_BACKEND_MODE,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
