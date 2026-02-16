'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Unified user object combining Supabase auth and profiles table
interface Profile {
  id: string;
  name: string; // Mapped from full_name for compatibility
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  tokens?: number; // Added tokens for marketplace
  email: string;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  recipient_address?: string | null;
  role?: string;
  invite_code?: string | null;
}

interface AuthContextType {
  user: Profile | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // If profile不存在，很可能是資料被清空，強制登出回登入頁
          await supabase.auth.signOut();
          setSupabaseUser(null);
          setUser(null);
          router.refresh();
          router.push('/login');
          return null;
        }

        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          name: data.name || email.split('@')[0], // Fallback to email prefix
          full_name: data.name,
          avatar_url: null, // users table currently doesn't have avatar_url
          points: data.tokens || 0,
          tokens: data.tokens || 0,
          email: email,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          recipient_address: data.address,
          role: data.role || 'user',
          invite_code: data.invite_code,
        } as Profile;
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const {
          data: userResult,
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !userResult?.user) {
          await supabase.auth.signOut();
          setSupabaseUser(null);
          setUser(null);
          setIsLoading(false);
          router.refresh();
          router.push('/login');
          return;
        }

        setSupabaseUser(session.user);
        const profile = await fetchProfile(session.user.id, session.user.email!);
        setUser(profile);
      } else {
        setSupabaseUser(null);
        setUser(null);
        setIsLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            setSupabaseUser(session.user);
            // Only fetch profile if user ID changed or we don't have it
            // Or if the session was just updated (e.g. after login)
            if (!user || user.id !== session.user.id || event === 'SIGNED_IN') {
               const profile = await fetchProfile(session.user.id, session.user.email!);
               setUser(profile);
            }
          } else {
            setSupabaseUser(null);
            setUser(null);
          }
          setIsLoading(false);
          router.refresh(); // Refresh Server Components
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase]); 

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    router.refresh();
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (supabaseUser) {
      const profile = await fetchProfile(supabaseUser.id, supabaseUser.email!);
      setUser(profile);
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser, 
      isLoading, 
      logout, 
      refreshProfile,
      isAuthenticated: !!supabaseUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
