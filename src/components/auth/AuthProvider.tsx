'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires an INITIAL_SESSION event on subscribe, so a
    // separate getSession() call is unnecessary. Track the last user id we
    // fetched a profile for so repeated events (INITIAL_SESSION, SIGNED_IN,
    // TOKEN_REFRESHED) don't trigger duplicate profile round-trips.
    let lastUserId: string | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: { user?: User } | null) => {
        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        if (sessionUser) {
          if (sessionUser.id !== lastUserId) {
            lastUserId = sessionUser.id;
            await fetchProfile(sessionUser.id);
          }
        } else {
          lastUserId = null;
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to check user permissions
export function usePermissions() {
  const { profile } = useAuth();

  const hasPermission = (requiredRole: 'admin' | 'manager' | 'staff' | 'receptionist') => {
    if (!profile) return false;

    const roleHierarchy = {
      admin: 4,
      manager: 3,
      staff: 2,
      receptionist: 1,
    };

    const userLevel = roleHierarchy[profile.role];
    const requiredLevel = roleHierarchy[requiredRole];

    return userLevel >= requiredLevel;
  };

  const isAdmin = () => hasPermission('admin');
  const isManager = () => hasPermission('manager');
  const isStaff = () => hasPermission('staff');
  const isReceptionist = () => hasPermission('receptionist');

  return {
    hasPermission,
    isAdmin,
    isManager,
    isStaff,
    isReceptionist,
    role: profile?.role,
  };
} 
