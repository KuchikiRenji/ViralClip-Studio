import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { APP_URL } from '../constants/apiKeys';

// Module-level flag to prevent duplicate initialization in React StrictMode
let authInitialized = false;

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
  });
  
  // Track if login is in progress to prevent initializeAuth from interfering
  const loginInProgressRef = useRef(false);

  // Helper to add timeout to async operations
  const withTimeout = useCallback(
    <T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
        ),
      ]);
    },
    []
  );

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log("👤 Fetching profile for user:", userId);

      // Try to fetch existing profile with timeout
      const fetchPromise = supabase
        .from("users_profile")
        .select("*")
        .eq("id", userId)
        .single();

      // Use Promise.race with timeout
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timeout")), 10000) // Increased to 10s
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]).catch((err) => {
        // Handle timeout or abort errors gracefully
        if (err instanceof Error && (err.message.includes('timeout') || err.message.includes('aborted'))) {
          console.warn("⏰ Profile fetch timeout/aborted - will retry later");
          return { data: null, error: { message: err.message, code: 'TIMEOUT' } };
        }
        throw err;
      }) as { data: any; error: any };

      if (error) {
        // Don't log AbortError as error - it's expected behavior
        if (error.message && !error.message.includes('aborted') && !error.message.includes('timeout')) {
          console.error("❌ Profile fetch error:", error.message);
        }
        
        // If profile doesn't exist (PGRST116), don't try to create - let trigger handle it
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          console.log("⚠️ Profile not found - trigger should create it, will retry later");
          return null;
        }
        
        // For other errors, return null and let retry logic handle it
        return null;
      }

      if (data && !error) {
        console.log("✅ Profile loaded successfully:", data.display_name);
        return data as UserProfile;
      }

      // Profile doesn't exist - don't try to create manually
      // The database trigger should handle profile creation automatically
      // If it doesn't exist, it will be created on next retry
      console.log("⚠️ Profile not found - trigger should create it automatically");
      return null;
    } catch (err) {
      // Handle AbortError and timeout errors silently
      if (err instanceof Error && (err.message.includes('timeout') || err.message.includes('aborted'))) {
        console.warn("⏰ Profile fetch was aborted/timed out");
        return null;
      }
      console.error("❌ fetchProfile exception:", err);
      return null;
    }
  }, []);

  // Helper to retry profile fetch with exponential backoff
  const fetchProfileWithRetry = useCallback(
    async (userId: string, maxRetries: number = 3): Promise<UserProfile | null> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Ensure session is available in Supabase client
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            if (attempt < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            return null;
          }
          
          const profile = await fetchProfile(userId);
          if (profile) {
            return profile;
          }
          
          // Wait before retry (longer delay for profile creation by trigger)
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } catch (error) {
          // Only log non-timeout errors
          if (error instanceof Error && !error.message.includes('timeout') && !error.message.includes('aborted')) {
            console.error(`❌ Profile fetch attempt ${attempt} failed:`, error);
          }
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      return null;
    },
    [fetchProfile]
  );

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    // Listen for auth state changes FIRST - this handles session restoration
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('🔄 Auth state change:', event, { hasSession: !!session, userId: session?.user?.id });

        // Handle INITIAL_SESSION - fires when Supabase restores session from storage
        if (event === 'INITIAL_SESSION' && session?.user) {
          console.log('✅ Initial session restored from storage');
          
          // Set loading to false immediately - don't wait for profile
          setState({
            user: session.user,
            profile: null, // Will be fetched in background
            session,
            loading: false,
            error: null,
          });
          
          // Fetch profile in background - don't block
          if (!isMounted) return;
          fetchProfileWithRetry(session.user.id, 2).then(profile => {
            if (!isMounted) return;
            setState(prev => {
              if (prev.user?.id === session.user.id && prev.session?.access_token === session.access_token) {
                return { ...prev, profile };
              }
              return prev;
            });
          }).catch(() => {
            // Profile fetch failed - user is still logged in, will retry later
          });
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          // Update state immediately with user and session - don't wait for profile
          setState(prev => {
            // Check if this is the same user and session to avoid unnecessary updates
            if (prev.user?.id === session.user.id && prev.session?.access_token === session.access_token && prev.profile) {
              return prev; // No change needed
            }
            
            // Update immediately with user and session
            return {
              user: session.user,
              profile: prev.profile || null, // Keep existing profile if available
              session,
              loading: false,
              error: null,
            };
          });

          // Fetch profile in background - don't block
          if (!isMounted) return;
          fetchProfileWithRetry(session.user.id, 2).then(profile => {
            if (!isMounted) return;
            setState(prev => {
              // Only update if this is still the current session
              if (prev.session?.access_token === session.access_token && prev.user?.id === session.user.id) {
                return {
                  ...prev,
                  profile,
                };
              }
              return prev;
            });
          }).catch(() => {
            // Profile fetch failed - user is still logged in, will retry later
          });
        } else if (event === 'SIGNED_OUT') {
          setState(prev => {
            // Only clear if we don't have a valid session
            if (!prev.session || prev.session.access_token === session?.access_token) {
              return {
                user: null,
                profile: null,
                session: null,
                loading: false,
                error: null,
              };
            }
            return prev;
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => {
            // Only update if this is the current session
            if (prev.session && prev.user?.id === session.user?.id) {
              return { ...prev, session };
            }
            return prev;
          });
        } else if (event === 'USER_UPDATED' && session?.user) {
          setState(prev => {
            // Only update if this is the current user
            if (prev.user?.id === session.user.id) {
              return { 
                ...prev, 
                user: session.user,
                session 
              };
            }
            return prev;
          });
        }
      }
    );

    // Also check for existing session on mount (fallback if INITIAL_SESSION doesn't fire)
    const initializeAuth = async () => {
      // Prevent duplicate initialization in React StrictMode
      if (authInitialized) {
        console.log('⏭️ Auth initialization skipped - already initialized');
        setState(prev => {
          if (prev.loading) {
            return { ...prev, loading: false };
          }
          return prev;
        });
        return;
      }
      
      // Skip initialization if login is in progress - don't interfere
      if (loginInProgressRef.current) {
        console.log('⏭️ Auth initialization skipped - login in progress');
        return;
      }
      
      authInitialized = true;
      
      try {
        // Check if there's a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.log('⚠️ Session check error on init:', error.message);
          // Don't sign out on error - let Supabase handle it
          setState({ user: null, profile: null, session: null, loading: false, error });
          return;
        }

        if (session?.user) {
          // Validate the session by calling getUser() WITHOUT token parameter
          // This lets Supabase use the stored session and handle token refresh automatically
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            // If getUser fails, it might be a network issue, not necessarily invalid session
            // Only clear if it's a clear authentication error
            if (userError) {
              // Check if it's a real auth error or just network/refresh issue
              if (userError.message?.includes('JWT') || userError.message?.includes('expired')) {
                console.log('⚠️ Session token invalid, clearing...');
                await supabase.auth.signOut();
                setState({ user: null, profile: null, session: null, loading: false, error: null });
                return;
              }
              // For other errors, keep the session and let Supabase retry
              console.warn('⚠️ getUser error (non-fatal):', userError.message);
            }
            
            if (user) {
              // Session is valid - set loading to false immediately, don't wait for profile
              setState({
                user: user,
                profile: null, // Will be fetched in background
                session,
                loading: false,
                error: null,
              });
              
              // Fetch profile in background - don't block
              if (!isMounted) return;
              fetchProfileWithRetry(user.id, 2).then(profile => {
                if (!isMounted) return;
                setState(prev => {
                  if (prev.user?.id === user.id) {
                    return { ...prev, profile };
                  }
                  return prev;
                });
              }).catch(() => {
                // Profile fetch failed - user is still logged in, will retry later
              });
            } else {
              // No user but have session - wait for onAuthStateChange to handle it
              setState(prev => ({ ...prev, loading: false }));
            }
          } catch (validateErr) {
            console.warn('⚠️ Session validation error:', validateErr);
            // Don't sign out on validation errors - might be temporary
            setState(prev => ({ ...prev, loading: false }));
          }
        } else {
          setState({ user: null, profile: null, session: null, loading: false, error: null });
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('❌ Auth initialization error:', err);
        setState(prev => ({ 
          ...prev,
          loading: false,
          error: err instanceof Error ? { message: err.message } as AuthError : null 
        }));
      }
    };

    // Initialize immediately - onAuthStateChange will handle INITIAL_SESSION
    // This is just a fallback
    // But skip if we already have a user to avoid interfering with login
    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    console.log('🔐 signInWithEmail called with email:', email);
    
    // Mark login as in progress to prevent initializeAuth from interfering
    loginInProgressRef.current = true;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Don't clear sessions before login - it's unnecessary and can cause delays
      // Supabase will handle session management automatically
      
      console.log('📡 Attempting Supabase signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error.message, error);
        loginInProgressRef.current = false; // Reset flag on error
        setState(prev => ({ ...prev, error, loading: false }));
        return { error };
      }

      if (data?.user && data?.session) {
        console.log('✅ Sign in successful, user:', data.user.id);
        
        // Update state immediately with user and session - don't wait for profile
        setState({
          user: data.user,
          profile: null, // Will be fetched in background
          session: data.session,
          loading: false,
          error: null,
        });
        
        // Reset login in progress flag after successful login
        loginInProgressRef.current = false;
        
        // Fetch profile in background - don't block login
        const userId = data.user.id;
        fetchProfileWithRetry(userId, 2).then(profile => {
          setState(prev => {
            // Only update if still the same user
            if (prev.user?.id === userId) {
              return { ...prev, profile };
            }
            return prev;
          });
        }).catch(() => {
          // Profile fetch failed - user is still logged in, will retry later
        });
        
        console.log('✅ State updated with user and session');
      } else {
        console.warn('⚠️ Sign in response missing user or session');
        loginInProgressRef.current = false; // Reset flag
        setState(prev => ({ ...prev, loading: false }));
      }

      return { data };
    } catch (err) {
      console.error('❌ Sign in exception:', err);
      loginInProgressRef.current = false; // Reset flag on exception
      const error = err instanceof Error ? { message: err.message } as AuthError : { message: 'Sign in failed' } as AuthError;
      setState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }
  }, [fetchProfile]);

  const signUpWithEmail = useCallback(async (
    email: string, 
    password: string,
    metadata?: { full_name?: string; locale?: string }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Don't clear sessions before signup - Supabase handles it automatically
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${APP_URL}/auth/callback`,
        },
      });

      if (error) {
        // Enhance error messages for SMTP issues
        if (error.code === 'unexpected_failure' || error.message?.includes('500')) {
          error.message = 'Unable to send confirmation email. Please configure SMTP in Supabase Dashboard → Settings → Auth → SMTP Settings.';
        }
        setState(prev => ({ ...prev, error, loading: false }));
        return { error };
      }

      // If session exists, user is logged in immediately - don't wait for profile
      if (data?.session && data?.user) {
        setState({
          user: data.user,
          profile: null, // Will be fetched in background
          session: data.session,
          loading: false,
          error: null,
        });
        
        // Fetch profile in background
        const userId = data.user.id;
        fetchProfileWithRetry(userId, 2).then(profile => {
          setState(prev => {
            if (prev.user?.id === userId) {
              return { ...prev, profile };
            }
            return prev;
          });
        }).catch(() => {
          // Profile fetch failed - user is still signed up, will retry later
        });
      } else {
        setState(prev => ({ ...prev, error: null, loading: false }));
      }

      return { data };
    } catch (err: any) {
      let errorMessage = 'Signup failed';
      if (err instanceof Error) {
        errorMessage = err.message.includes('Failed to fetch') 
          ? 'Network error: Unable to connect to authentication service.'
          : err.message;
      }
      const error = { message: errorMessage } as AuthError;
      setState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }
  }, [fetchProfile]);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github' | 'discord') => {
    // Don't clear sessions before OAuth - Supabase handles it automatically
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    if (error) {
      setState(prev => ({ ...prev, error }));
    }
    return error ? { error } : { data };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    
    // Clear localStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      // Ignore errors
    }

    // Clear sessionStorage
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (e) {
      // Ignore errors
    }

    setState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: error || null,
    });

    return error ? { error } : {};
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return { error: new Error('Not authenticated') as AuthError };

    const { data, error } = await supabase
      .from('users_profile')
      .update(updates)
      .eq('id', state.user.id)
      .select()
      .single();

    if (error) return { error };

    setState(prev => ({ ...prev, profile: data as UserProfile }));
    return { data };
  }, [state.user]);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_URL}/auth/callback`,
      });

      if (error) {
        if (error.code === 'unexpected_failure' || error.message?.includes('500')) {
          error.message = 'Unable to send password reset email. Please configure SMTP in Supabase Dashboard → Settings → Auth → SMTP Settings.';
        }
        setState(prev => ({ ...prev, error, loading: false }));
        return { error };
      }

      setState(prev => ({ ...prev, error: null, loading: false }));
      return { data: { success: true } };
    } catch (err: any) {
      const error = { message: err instanceof Error ? err.message : 'Failed to send password reset email' } as AuthError;
      setState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        return { error };
      }

      setState(prev => ({ ...prev, error: null, loading: false }));
      return { data: { success: true } };
    } catch (err: any) {
      const error = { message: err instanceof Error ? err.message : 'Failed to update password' } as AuthError;
      setState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }
  }, []);

  const resendConfirmationEmail = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${APP_URL}/auth/callback`,
        },
      });

      if (error) {
        if (error.code === 'unexpected_failure' || error.message?.includes('500')) {
          error.message = 'Unable to send confirmation email. Please configure SMTP in Supabase Dashboard → Settings → Auth → SMTP Settings.';
        }
        setState(prev => ({ ...prev, error, loading: false }));
        return { error };
      }

      setState(prev => ({ ...prev, error: null, loading: false }));
      return { data: { success: true } };
    } catch (err: any) {
      const error = { message: err instanceof Error ? err.message : 'Failed to resend confirmation email' } as AuthError;
      setState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        setState(prev => ({ ...prev, error, loading: false }));
        return { error };
      }

      // If session exists, user is verified and logged in
      if (data?.session && data?.user) {
        setState({
          user: data.user,
          profile: null, // Will be fetched in background
          session: data.session,
          loading: false,
          error: null,
        });
        // Fetch profile in background
        fetchProfileWithRetry(data.user.id, 2).then(profile => {
          setState(prev => {
            if (prev.user?.id === data.user.id) {
              return { ...prev, profile };
            }
            return prev;
          });
        }).catch(() => {
          // Profile fetch failed - user is still verified
        });
      } else {
        setState(prev => ({ ...prev, error: null, loading: false }));
      }

      return { data };
    } catch (err: any) {
      const error = { message: err instanceof Error ? err.message : 'Failed to verify code' } as AuthError;
      setState(prev => ({ ...prev, error, loading: false }));
      return { error };
    }
  }, [fetchProfile]);

  const validateSession = useCallback(async (_silent = false) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setState(prev => {
          if (prev.user && prev.session) {
            return { ...prev, error: sessionError };
          }
          return { 
            ...prev, 
            user: null, 
            profile: null, 
            session: null, 
            error: sessionError 
          };
        });
        return false;
      }

      if (!session?.user) {
        setState(prev => {
          if (prev.user && prev.session) {
            return { ...prev, session: null, error: null };
          }
          return { 
            ...prev, 
            user: null, 
            profile: null, 
            session: null, 
            error: null 
          };
        });
        return false;
      }

      // Validate token - call getUser() without token parameter to let Supabase handle refresh
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Only sign out on clear authentication errors, not network or refresh issues
      if (userError) {
        const isAuthError = userError.message?.includes('JWT') || 
                           userError.message?.includes('expired') ||
                           userError.message?.includes('Invalid') ||
                           userError.status === 401;
        
        if (isAuthError) {
          console.log('⚠️ Invalid session token, clearing...');
          await supabase.auth.signOut();
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            error: userError,
          });
          return false;
        }
        // For other errors (network, etc), keep the session
        console.warn('⚠️ getUser error (non-fatal):', userError.message);
      }
      
      if (!user) {
        // No user but have session - might be refreshing, don't clear
        return false;
      }

      // Check if state needs updating
      setState(prev => {
        if (prev.user?.id === user.id && 
            prev.session?.access_token === session.access_token &&
            prev.profile) {
          return prev; // No update needed
        }

        // Need to update - fetch profile if user changed
        if (prev.user?.id !== user.id || !prev.profile) {
          fetchProfileWithRetry(user.id, 2).then(profile => {
            setState(prevState => {
              if (prevState.user?.id === user.id) {
                return {
                  ...prevState,
                  user,
                  profile,
                  session,
                  loading: false,
                  error: null,
                };
              }
              return prevState;
            });
          }).catch(() => {
            setState(prevState => {
              if (prevState.user?.id === user.id) {
                return {
                  ...prevState,
                  user,
                  profile: null,
                  session,
                  loading: false,
                  error: null,
                };
              }
              return prevState;
            });
          });
        }

        // Return updated state immediately
        return {
          ...prev,
          user: prev.user || user,
          session,
          loading: false,
          error: null,
        };
      });

      return true;
    } catch (err) {
      const error = err instanceof Error 
        ? ({ message: err.message } as AuthError)
        : ({ message: 'Session validation failed' } as AuthError);
      setState(prev => ({ ...prev, error }));
      return false;
    }
  }, [fetchProfile]);

  return {
    ...state,
    isAuthenticated: !!state.user,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    updateProfile,
    resetPasswordForEmail,
    updatePassword,
    resendConfirmationEmail,
    verifyOtp,
    validateSession,
  };
}
