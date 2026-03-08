import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  isLoggedIn: boolean;
  email: string;
  user: User | null;
  loading: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isLoggedIn: false,
  email: '',
  user: null,
  loading: true,
  isModerator: false,
  isAdmin: false,
  signUp: async () => ({ error: null, needsVerification: false }),
  signIn: async () => ({ error: null }),
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId) as any;
    
    const roles = (data || []).map((r: any) => r.role);
    setIsModerator(roles.includes('moderator') || roles.includes('admin'));
    setIsAdmin(roles.includes('admin'));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setTimeout(() => fetchRoles(session.user.id), 0);
      } else {
        setIsModerator(false);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) fetchRoles(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message, needsVerification: false };
    return { error: null, needsVerification: true };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Check if blocked
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('user_id', data.user.id)
        .single();
      if ((profile as any)?.is_blocked) {
        await supabase.auth.signOut();
        return { error: 'Your account has been blocked. Contact an admin.' };
      }
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn: !!user,
      email: user?.email || '',
      user,
      loading,
      isModerator,
      isAdmin,
      signUp,
      signIn,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
