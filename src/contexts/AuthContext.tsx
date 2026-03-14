import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

type UserRole = 'coach' | 'player';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: { display_name: string; team?: string; position?: string; age?: number; is_approved?: boolean; subscription_tier?: string; payment_status?: string } | null;
  isApproved: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, displayName: string, role: UserRole, coachId?: string, subscriptionTier?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Legacy compat for in-memory store
  auth: { role: UserRole | null; playerId: string | null };
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, role, team, position, age, is_approved, subscription_tier, payment_status')
      .eq('user_id', userId)
      .single();
    if (data) {
      setRole(data.role as UserRole);
      setIsApproved(data.is_approved ?? false);
      setProfile({
        display_name: data.display_name,
        team: data.team ?? undefined,
        position: data.position ?? undefined,
        age: data.age ?? undefined,
        is_approved: data.is_approved ?? false,
        subscription_tier: (data as any).subscription_tier ?? 'basic',
        payment_status: (data as any).payment_status ?? 'pending',
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => fetchProfile(sess.user.id), 0);
      } else {
        setRole(null);
        setProfile(null);
        setIsApproved(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        fetchProfile(sess.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signup = async (email: string, password: string, displayName: string, signupRole: UserRole, coachId?: string, subscriptionTier?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role: signupRole, coach_id: coachId || null, subscription_tier: subscriptionTier || 'basic' },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setIsApproved(false);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const auth = { role, playerId: user?.id ?? null };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, isApproved, loading, login, signup, logout, refreshProfile, auth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
