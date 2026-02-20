
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase/client';
import { backendRuntime } from '../services/runtimeConfig';

const MOCK_AUTH_STORAGE_KEY = 'kozegho.mock.user';

interface AuthResponse {
  success: boolean;
  error?: string;
  requiresConfirmation?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signupWithEmail: (email: string, password: string, firstName: string, lastName: string) => Promise<AuthResponse>;
  loginWithEmail: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signupWithEmail: async () => ({ success: false }),
  loginWithEmail: async () => ({ success: false }),
  logout: () => { }
});

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isMockAuth = backendRuntime.isMockMode;

  // Debug helper
  const debugLog = (msg: string, data?: any) => {
    if (import.meta.env.VITE_DEBUG_AUTH === 'true') {
      console.log(`[AuthDebug] ${msg}`, data || '');
    }
  };

  const ensureProfile = async (sessionUser: any) => {
    if (!sessionUser) return null;

    try {
      debugLog('Ensuring profile for:', sessionUser.id);

      // Wrapper para timeout
      const fetchProfileWithTimeout = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();
        return { data, error };
      };

      const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      let existingProfile = null;

      try {
        // Race entre fetch e timeout de 5s
        const result = await Promise.race([fetchProfileWithTimeout(), timeoutPromise]);

        if (result.error) {
          console.error("Error fetching profile:", result.error);
        } else {
          existingProfile = result.data;
        }
      } catch (err) {
        console.warn("Profile fetch timed out or failed:", err);
        // Se falhou por timeout ou erro, assumimos que DB está inacessível.
        // Retornar fallback IMEDIATO para desbloquear a UI.
        return {
          email: sessionUser.email || '',
          name: sessionUser.user_metadata?.full_name || 'User',
          photoUrl: ''
        };
      }

      if (existingProfile) {
        debugLog('Profile found:', existingProfile);
        return {
          email: sessionUser.email || '',
          name: existingProfile.full_name || 'User',
          photoUrl: `https://ui-avatars.com/api/?name=${existingProfile.full_name || 'User'}&background=0f172a&color=fff`
        };
      }

      // 2. Se não existe, criar (Upsert para segurança conforrente)
      debugLog('Profile missing, creating default...');

      // Garantir organização (exemplo simplificado: cria ou usa existente)
      // NOTA: Idealmente isto devia ser num trigger, mas fazemos aqui como fallback
      let orgId = null;

      // Tentar encontrar uma organização default ou criar
      const { data: newOrg } = await supabase.from('organizations').insert({ name: 'My Organization' }).select().single();
      if (newOrg) orgId = newOrg.id;

      const newProfileData = {
        id: sessionUser.id,
        // Se não conseguimos criar org, deixamos null (depende da constraint na DB)
        org_id: orgId,
        full_name: sessionUser.user_metadata?.full_name || 'New User',
        role: 'admin',
        email: sessionUser.email // Guardar email no profile também se útil
      };

      const { data: createdProfile, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfileData, { onConflict: 'id' })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        // Fallback visual apenas com dados da sessão
        return {
          email: sessionUser.email || '',
          name: sessionUser.user_metadata?.full_name || 'User',
          photoUrl: ''
        };
      }

      debugLog('Profile created:', createdProfile);
      return {
        email: sessionUser.email || '',
        name: createdProfile.full_name,
        photoUrl: `https://ui-avatars.com/api/?name=${createdProfile.full_name}&background=0f172a&color=fff`
      };

    } catch (e) {
      console.error("Critical error in ensureProfile:", e);
      return {
        email: sessionUser.email || '',
        name: 'Error User',
        photoUrl: ''
      };
    }
  };

  useEffect(() => {
    let mounted = true;

    if (backendRuntime.configError) {
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    if (isMockAuth) {
      const stored = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
      if (stored && mounted) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        }
      }
      if (mounted) setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const initSession = async () => {
      debugLog('Initializing session check...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) setUser(null);
        } else if (session?.user) {
          debugLog('Session found for:', session.user.email);
          if (mounted) {
            // Ensure we handle the profile fetch safely
            try {
              const userData = await ensureProfile(session.user);
              if (mounted) setUser(userData);
            } catch (profileErr) {
              console.error("Critical: Failed to ensure profile", profileErr);
              // Fallback to basic user if profile fails completely
              if (mounted) setUser({
                email: session.user.email || '',
                name: 'User',
                photoUrl: ''
              });
            }
          }
        } else {
          debugLog('No active session.');
          if (mounted) setUser(null);
        }
      } catch (err) {
        console.error("Unexpected auth initialization error:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          debugLog('Session check complete. Loading: false');
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog(`Auth Event: ${event}`, session?.user?.id);

      if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
        if (mounted) setLoading(false);
      } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        // Apenas recarregar se user mudou ou se for login explicito
        // Para evitar rewrites desnecessários, podíamos comparar ID, mas ensureProfile é seguro
        const userData = await ensureProfile(session.user);
        if (mounted) setUser(userData);
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isMockAuth]);

  const signupWithEmail = async (email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> => {
    if (backendRuntime.configError) {
      return { success: false, error: backendRuntime.configError };
    }

    const cleanEmail = email.trim().toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();

    if (isMockAuth) {
      const mockUser: User = {
        email: cleanEmail,
        name: fullName || cleanEmail.split('@')[0] || 'Mock User',
        photoUrl: ''
      };
      localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName },
        // IMPORTANTE: Redirecionar para evitar perda de contexto no switch de abas/apps
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }

    if (data.session) {
      return { success: true };
    }

    if (data.user && !data.session) {
      // Tentar login automático imediato caso o servidor permita (algumas configs de dev permitem)
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });
      if (signInData.session) return { success: true };

      return { success: true, requiresConfirmation: true };
    }

    return { success: false, error: "Estado desconhecido após registo." };
  };

  const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
    if (backendRuntime.configError) {
      return { success: false, error: backendRuntime.configError };
    }

    const cleanEmail = email.trim().toLowerCase();

    if (isMockAuth) {
      if (!cleanEmail) {
        return { success: false, error: 'Email is required in mock mode.' };
      }
      const mockUser: User = {
        email: cleanEmail,
        name: cleanEmail.split('@')[0] || 'Mock User',
        photoUrl: ''
      };
      localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
      return { success: true };
    }

    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    if (isMockAuth) {
      localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
      setUser(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading: loading, signupWithEmail, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
