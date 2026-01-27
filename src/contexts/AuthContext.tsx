import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';
import type { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;

  // Actions
  signInWithEmail: (email: string, password: string) => Promise<{ data?: any; error?: AuthError }>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: { full_name?: string; locale?: string }
  ) => Promise<{ data?: any; error?: AuthError }>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ data?: any; error?: AuthError }>;
  signOut: () => Promise<{ error?: AuthError }>;
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{
    data?: UserProfile | {
      avatar_url: string | null;
      created_at: string;
      display_name: string | null;
      id: string;
      locale: string | null;
      updated_at: string;
    };
    error?: AuthError | PostgrestError;
  }>;
  resetPasswordForEmail: (email: string) => Promise<{ data?: { success: boolean }; error?: AuthError }>;
  updatePassword: (newPassword: string) => Promise<{ data?: { success: boolean }; error?: AuthError }>;
  resendConfirmationEmail: (email: string) => Promise<{ data?: { success: boolean }; error?: AuthError }>;
  verifyOtp: (email: string, token: string) => Promise<{ data?: any; error?: AuthError }>;
  validateSession: (silent?: boolean) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthHook();

  const value = useMemo<AuthContextType>(() => ({
    // State
    user: auth.user,
    profile: auth.profile,
    session: auth.session,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,

    // Actions
    signInWithEmail: auth.signInWithEmail,
    signUpWithEmail: auth.signUpWithEmail,
    signInWithOAuth: auth.signInWithOAuth,
    signOut: auth.signOut,
    updateProfile: auth.updateProfile,
    resetPasswordForEmail: auth.resetPasswordForEmail,
    updatePassword: auth.updatePassword,
    resendConfirmationEmail: auth.resendConfirmationEmail,
    verifyOtp: auth.verifyOtp,
    validateSession: auth.validateSession,
  }), [
    auth.user,
    auth.profile,
    auth.session,
    auth.loading,
    auth.error,
    auth.isAuthenticated,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
