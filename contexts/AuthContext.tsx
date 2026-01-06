import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { MOCK_USER } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => false,
  logout: () => {}
});

const SESSION_KEY = 'kozegho_session';

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession));
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const loginWithGoogle = async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const googleUser = {
        ...MOCK_USER,
        name: 'João Silva (Google)',
        email: 'joao.google@kozegho.com'
    };
    setUser(googleUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(googleUser));
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    if (email && password) {
        const namePart = email.split('@')[0];
        const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const emailUser = {
            email,
            name,
            photoUrl: `https://ui-avatars.com/api/?name=${name}&background=0f172a&color=fff`
        };
        setUser(emailUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(emailUser));
        return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginWithGoogle, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);