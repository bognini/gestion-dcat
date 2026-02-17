'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BoutiqueClient {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string;
  adresse: string | null;
  ville: string | null;
  isEmailVerified: boolean;
}

interface BoutiqueAuthContextType {
  client: BoutiqueClient | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; emailSent?: boolean; message?: string }>;
  refreshClient: () => Promise<void>;
}

interface RegisterData {
  nom: string;
  prenom?: string;
  email: string;
  telephone: string;
  password: string;
  adresse?: string;
  ville?: string;
  captchaToken?: string;
  captchaAnswer?: string;
}

const BoutiqueAuthContext = createContext<BoutiqueAuthContextType | undefined>(undefined);

export function BoutiqueAuthProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<BoutiqueClient | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshClient = useCallback(async () => {
    try {
      const res = await fetch('/api/boutique/auth/me');
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      } else {
        setClient(null);
      }
    } catch {
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClient();
  }, [refreshClient]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/boutique/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setClient(data.client);
        return { success: true };
      }
      return { success: false, error: data.error || 'Erreur de connexion' };
    } catch {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/boutique/auth/logout', { method: 'POST' });
    } finally {
      setClient(null);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await fetch('/api/boutique/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        return { success: true, emailSent: result.emailSent !== false, message: result.message };
      }
      return { success: false, error: result.error || 'Erreur lors de l\'inscription' };
    } catch {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  return (
    <BoutiqueAuthContext.Provider value={{ client, loading, login, logout, register, refreshClient }}>
      {children}
    </BoutiqueAuthContext.Provider>
  );
}

const defaultContext: BoutiqueAuthContextType = {
  client: null,
  loading: true,
  login: async () => ({ success: false, error: 'Not initialized' }),
  logout: async () => {},
  register: async () => ({ success: false, error: 'Not initialized' }),
  refreshClient: async () => {},
};

export function useBoutiqueAuth() {
  const context = useContext(BoutiqueAuthContext);
  return context ?? defaultContext;
}
