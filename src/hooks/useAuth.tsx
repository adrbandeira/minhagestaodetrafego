import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface Profile {
  name: string;
  email: string;
  hasPessoal: boolean;
  hasAgenciado: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (data: { email: string; password: string; name: string; hasPessoal: boolean; hasAgenciado: boolean; inviteToken: string }) => Promise<{ error: any; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (data) {
      setProfile({
        name: (data as any).name || '',
        email: (data as any).email || '',
        hasPessoal: (data as any).has_pessoal ?? true,
        hasAgenciado: (data as any).has_agenciado ?? true,
      });
    }
  }, []);

  const checkAdmin = useCallback(async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    const roles = (data || []).map((r: any) => r.role);
    setIsAdmin(roles.includes('admin'));
  }, []);

  const ensureProfile = useCallback(async (u: User) => {
    const meta = u.user_metadata || {};
    await (supabase.rpc as any)('ensure_profile', {
      _user_id: u.id,
      _name: meta.name || '',
      _email: u.email || '',
      _has_pessoal: meta.has_pessoal ?? true,
      _has_agenciado: meta.has_agenciado ?? true,
    });

    if (meta.invite_token) {
      await (supabase.rpc as any)('claim_invite', {
        _token: meta.invite_token,
        _user_id: u.id,
      });
    }

    await (supabase.rpc as any)('maybe_promote_first_admin', {
      _user_id: u.id,
    });
  }, []);

  const initUser = useCallback(async (u: User) => {
    await ensureProfile(u);
    await loadProfile(u.id);
    await checkAdmin(u.id);
  }, [ensureProfile, loadProfile, checkAdmin]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setTimeout(async () => {
          await initUser(currentUser);
          setLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [initUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async ({ email, password, name, hasPessoal, hasAgenciado, inviteToken }: { email: string; password: string; name: string; hasPessoal: boolean; hasAgenciado: boolean; inviteToken: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, has_pessoal: hasPessoal, has_agenciado: hasAgenciado, invite_token: inviteToken },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error };

    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
      await checkAdmin(user.id);
    }
  }, [user, loadProfile, checkAdmin]);

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
