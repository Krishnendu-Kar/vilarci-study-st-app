import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** The person, mirrored from their Vilarci account. */
export interface AccountProfile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
}

export type StudyAccountType = 'parent' | 'student';

interface AuthValue {
  session: Session | null;
  profile: AccountProfile | null;
  /** Parent or student in this app; null until onboarding is done. */
  accountType: StudyAccountType | null;
  /** True until the stored session (and its account rows) have been read. */
  loading: boolean;
  /** Signed in with Vilarci but hasn't chosen parent / student yet. */
  needsOnboarding: boolean;
  /** Browsing the sample data without an account (not persisted). */
  demo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [accountType, setAccountType] = useState<StudyAccountType | null>(null);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [demo, setDemo] = useState(false);
  const enterDemo = useCallback(() => setDemo(true), []);
  const exitDemo = useCallback(() => setDemo(false), []);

  useEffect(() => {
    let mounted = true;
    // getSession reads local storage, so a network blip never looks like a logout.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next);
      if (next) setDemo(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;

  const refreshAccount = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setAccountType(null);
      setAccountLoaded(true);
      return;
    }
    const [profileRes, accountRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, phone, email, avatar_url').eq('id', userId).maybeSingle(),
      supabase.from('study_accounts').select('account_type').eq('id', userId).maybeSingle(),
    ]);
    setProfile((profileRes.data as AccountProfile | null) ?? null);
    setAccountType((accountRes.data?.account_type as StudyAccountType | undefined) ?? null);
    setAccountLoaded(true);
  }, [userId]);

  useEffect(() => {
    setAccountLoaded(false);
    refreshAccount();
  }, [refreshAccount]);

  const loading = !sessionLoaded || (Boolean(session) && !accountLoaded);
  const needsOnboarding = Boolean(session) && accountLoaded && accountType === null;

  const value = useMemo<AuthValue>(
    () => ({ session, profile, accountType, loading, needsOnboarding, demo, enterDemo, exitDemo, refreshAccount }),
    [session, profile, accountType, loading, needsOnboarding, demo, enterDemo, exitDemo, refreshAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Display name for the signed-in person. */
export function accountName(profile: AccountProfile | null, session: Session | null): string {
  if (profile?.full_name) return profile.full_name;
  const meta = session?.user.user_metadata ?? {};
  return meta.name || meta.full_name || 'Vilarci member';
}

/** Best phone number we know for the person. */
export function accountPhone(profile: AccountProfile | null, session: Session | null): string | null {
  return profile?.phone || session?.user.phone || session?.user.user_metadata?.phone_number || null;
}
