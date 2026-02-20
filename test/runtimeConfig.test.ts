import { describe, expect, it } from 'vitest';
import { resolveBackendRuntime } from '../services/runtimeConfig';

describe('runtime backend selection', () => {
  it('uses mock when mode=auto and supabase env is missing', () => {
    const runtime = resolveBackendRuntime({
      mode: 'auto',
      supabaseUrl: '',
      supabaseAnonKey: '',
    });

    expect(runtime.resolvedMode).toBe('mock');
    expect(runtime.configError).toBeUndefined();
  });

  it('uses supabase when mode=auto and env is present', () => {
    const runtime = resolveBackendRuntime({
      mode: 'auto',
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon',
    });

    expect(runtime.resolvedMode).toBe('supabase');
    expect(runtime.configError).toBeUndefined();
  });

  it('fails with clear config error when mode=supabase and env is missing', () => {
    const runtime = resolveBackendRuntime({
      mode: 'supabase',
      supabaseUrl: '',
      supabaseAnonKey: '',
    });

    expect(runtime.resolvedMode).toBe('supabase');
    expect(runtime.configError).toBeDefined();
  });
});
