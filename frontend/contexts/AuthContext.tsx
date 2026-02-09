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
  email: string;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  recipient_address?: string | null;
  role?: string;
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
  const supabase = createClient();

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (data) {
        return {
          id: data.id,
          name: data.full_name || email.split('@')[0], // Fallback to email prefix
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          points: data.points,
          email: email,
          recipient_name: data.recipient_name,
          recipient_phone: data.recipient_phone,
          recipient_address: data.recipient_address,
          role: data.role,
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
        setSupabaseUser(session.user);
        const profile = await fetchProfile(session.user.id, session.user.email!);
        setUser(profile);
      } else {
        setSupabaseUser(null);
        setUser(null);
      }
      setIsLoading(false);

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
      isAuthenticated: !!user 
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
