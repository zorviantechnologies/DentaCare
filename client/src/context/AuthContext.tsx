import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import api from '../utils/api';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'DOCTOR' | 'ASSISTANT';
  clinicId: string;
  clinicName: string;
  subscription: 'FREE' | 'BASIC' | 'PRO';
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: UserSession) => void;
  logout: () => void;
  updateUserSubscription: (newPlan: 'FREE' | 'BASIC' | 'PRO') => void;
  updateClinicName: (name: string) => void;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Modules list: 'dashboard', 'patients', 'appointments', 'chart', 'visits', 'prescriptions', 'billing', 'inventory', 'tasks', 'recalls', 'reports', 'settings', 'treatments', 'treatment-plans'
const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    'dashboard', 'patients', 'appointments', 'chart', 'visits', 'prescriptions',
    'billing', 'inventory', 'tasks', 'recalls', 'reports', 'settings', 'treatments', 'treatment-plans'
  ],
  DOCTOR: [
    'dashboard', 'patients', 'appointments', 'chart', 'visits', 'prescriptions',
    'inventory', 'tasks', 'recalls', 'treatments', 'treatment-plans'
  ],
  ASSISTANT: [
    'dashboard', 'patients', 'appointments', 'inventory', 'tasks', 'recalls'
  ]
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  // Token is kept in memory only — never stored in localStorage — to avoid quota issues.
  // Supabase manages its own session in its internal storage (much smaller footprint).
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check if Supabase already has an active session (handles page refresh).
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await api.post('/auth/login', { token: session.access_token });
          setToken(session.access_token);
          setUser(response.data.user);
        }
      } catch {
        // No active session or profile retrieval failed — start logged out.
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Listen for Supabase auth changes (sign-in / sign-out / token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setToken(null);
        setUser(null);
      }
      // Silently update the in-memory token when Supabase refreshes it.
      if (event === 'TOKEN_REFRESHED' && session?.access_token) {
        setToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (newToken: string, newUser: UserSession) => {
    // JWT lives in Supabase's own session storage — we only keep lightweight user profile.
    setToken(newToken);
    setUser(newUser);
    try {
      localStorage.removeItem('dentacare_token'); // clear any old oversized token entry
      localStorage.setItem('dentacare_user', JSON.stringify(newUser));
    } catch {
      // Ignore storage errors — session restores via Supabase on next refresh anyway.
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUser(null);
    localStorage.removeItem('dentacare_user');
    localStorage.removeItem('dentacare_token');
  };

  const updateUserSubscription = (newPlan: 'FREE' | 'BASIC' | 'PRO') => {
    if (user) {
      const updated = { ...user, subscription: newPlan };
      setUser(updated);
      try { localStorage.setItem('dentacare_user', JSON.stringify(updated)); } catch { /* ignore */ }
    }
  };

  const updateClinicName = (name: string) => {
    if (user) {
      const updated = { ...user, clinicName: name };
      setUser(updated);
      try { localStorage.setItem('dentacare_user', JSON.stringify(updated)); } catch { /* ignore */ }
    }
  };

  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const allowed = ROLE_PERMISSIONS[user.role] || [];
    return allowed.includes(module.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUserSubscription,
        updateClinicName,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
