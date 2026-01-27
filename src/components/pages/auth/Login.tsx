import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH } from '../../../constants/validation';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { AuthBackground } from './AuthBackground';

interface LoginProps {
  onBack: () => void;
  onSuccess: () => void;
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

export const Login = ({ onBack, onSuccess, onNavigateToSignup, onNavigateToForgotPassword }: LoginProps) => {
  const { t } = useTranslation();
  const { signInWithEmail, resendConfirmationEmail, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailResent, setEmailResent] = useState(false);

  // Navigate when user becomes available after successful login
  // This is a fallback - primary navigation happens in handleSubmit
  // Don't wait for authLoading - if we have user, navigate immediately
  useEffect(() => {
    if (user && isLoading) {
      console.log('✅ User available, navigating via useEffect fallback...');
      setIsLoading(false);
      // Navigate immediately without waiting for authLoading
      setTimeout(() => {
        onSuccess();
      }, 0);
    }
  }, [user, isLoading, onSuccess]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = t('auth.passwordMinLength');
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Note: clearExistingSessions is already called inside signInWithEmail in useAuth.ts
      // So we don't need to clear here - it would cause duplicate clearing
      console.log('🔐 Attempting login...');
      const { data, error } = await signInWithEmail(email, password);

      if (error) {
        setIsLoading(false);
        const errorMessage = error.message || 'Login failed';
        console.error('❌ Login error:', errorMessage);
        console.error('❌ Full error object:', error);
        console.error('❌ Error code:', error.code || 'N/A');
        
        // Check if there's still a session or token after failed login
        const { data: { session: errorSession } } = await supabase.auth.getSession();
        const remainingKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')
        );
        console.error('❌ After login error - Session exists:', !!errorSession, 'Remaining keys:', remainingKeys);
        
        // If it's a session/token related error, suggest clearing
        if (errorMessage.includes('session') || 
            errorMessage.includes('token') || 
            errorMessage.includes('expired') ||
            errorMessage.includes('invalid token')) {
          setErrors({ 
            general: 'Session error detected. Please try clearing your browser data or contact support if the issue persists.' 
          });
        } else if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid login')) {
          setErrors({ general: t('auth.invalidCredentials') });
        } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
          setErrors({ general: t('auth.emailNotConfirmed') });
        } else {
          setErrors({ general: errorMessage });
        }
        return;
      }

      // If we have user data immediately, navigate right away - no delays
      // Don't wait for authLoading or any other state - navigate immediately
      if (data?.user && data?.session) {
        console.log('✅ Login successful, navigating immediately...');
        setIsLoading(false);
        // Navigate immediately - don't wait for profile, authLoading, or any other state
        // Use setTimeout(0) to ensure navigation happens after state update
        setTimeout(() => {
          onSuccess();
        }, 0);
      } else {
        // Wait for user state to update via useEffect (onAuthStateChange)
        // This handles cases where session is created but not immediately available
        // The useEffect will handle navigation when user becomes available
      }
    } catch (error) {
      setIsLoading(false);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setErrors({ general: 'Network Error: Please check your internet connection or Supabase configuration.' });
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'An unexpected error occurred.' });
      }
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const handleResendConfirmation = async () => {
    if (!email || !EMAIL_REGEX.test(email)) {
      setErrors({ email: t('auth.emailRequired') });
      return;
    }

    setIsResendingEmail(true);
    setEmailResent(false);
    setErrors({});

    try {
      const { error } = await resendConfirmationEmail(email);
      if (error) {
        setErrors({ general: error.message });
      } else {
        setEmailResent(true);
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to resend confirmation email' });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const isEmailNotConfirmed = errors.general?.includes('not confirmed') || errors.general?.includes('Email not confirmed');

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <AuthBackground />

      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-50 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-default)] hover:bg-[var(--color-surface-highlight)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        type="button"
        aria-label={t('common.back')}
      >
        <ArrowLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      <main className="relative z-10 w-full max-w-md">
        <header className="text-center mb-8">
          <img
            src="/678.svg"
            alt={t('landing.logoAlt')}
            className="mx-auto w-20 h-20 rounded-2xl mb-4"
            width={80}
            height={80}
            decoding="async"
          />
          <h1 className="text-4xl font-black mb-2 tracking-tight">{t('auth.welcomeBack')}</h1>
          <p className="text-[var(--color-text-secondary)]">{t('auth.loginToContinue')}</p>
        </header>

        <section
          className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-8 md:backdrop-blur-xl"
          role="main"
          aria-label={t('auth.loginToAccount')}
        >
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {errors.general && (
              <div role="alert" className="p-3 rounded-xl bg-[var(--color-brand-error)]/10 border border-[var(--color-brand-error)]/20">
                <p className="text-sm text-[var(--color-brand-error)]">{errors.general}</p>
                {isEmailNotConfirmed && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isResendingEmail || emailResent}
                      className="text-sm text-[var(--color-brand-primary)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResendingEmail ? 'Resending...' : emailResent ? 'Email sent! Check your inbox.' : 'Resend confirmation email'}
                    </button>
                  </div>
                )}
              </div>
            )}
            {emailResent && !errors.general && (
              <div role="alert" className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-500">Confirmation email sent! Please check your inbox.</p>
              </div>
            )}
            <fieldset className="space-y-6">
              <legend className="sr-only">{t('auth.accountCredentials')}</legend>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface-dark)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[color-mix(in-srgb,var(--color-text-primary),40%_transparent)] focus:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] transition-colors"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'login-email-error' : undefined}
                    aria-required="true"
                    placeholder={t('auth.enterEmailExample')}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p id="login-email-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-[var(--color-surface-dark)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[color-mix(in-srgb,var(--color-text-primary),40%_transparent)] focus:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] transition-colors"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    aria-required="true"
                    placeholder={t('auth.enterPassword')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="login-password-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
                    {errors.password}
                  </p>
                )}
              </div>
            </fieldset>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[var(--color-surface-dark)] border border-[var(--color-border-default)] checked:bg-[var(--color-brand-primary)] checked:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] transition-colors"
                  aria-describedby="remember-description"
                />
                <span id="remember-description" className="text-sm text-[var(--color-text-secondary)]">
                  {t('auth.rememberMe')}
                </span>
              </label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-sm text-[var(--color-brand-primary)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                aria-label={t('auth.forgotPassword')}
              >
                {t('auth.forgotPassword')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 hover:shadow-[0_12px_30px_rgba(var(--color-brand-primary-rgb),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              aria-busy={isLoading}
              aria-disabled={isLoading}
            >
              {isLoading ? t('auth.loggingIn') : t('auth.logIn')}
            </button>
          </form>

          <footer className="mt-6 pt-6 border-t border-[color-mix(in-srgb,var(--color-text-primary),10%_transparent)] text-center space-y-3">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('auth.noAccount')}{' '}
              <button
                onClick={onNavigateToSignup}
                className="text-[var(--color-brand-primary)] hover:brightness-110 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                type="button"
                aria-label={t('auth.switchToSignup')}
              >
                {t('auth.signUp')}
              </button>
            </p>
            <button
              onClick={async () => {
                console.log('🧹 Manual session clear requested...');
                try {
                  // Step 1: Sign out from Supabase (with timeout)
                  console.log('Step 1: Signing out from Supabase...');
                  try {
                    const signOutPromise = supabase.auth.signOut();
                    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('timeout'), 2000));
                    const result = await Promise.race([signOutPromise, timeoutPromise]);
                    if (result === 'timeout') {
                      console.warn('  ⚠️ Sign out timed out after 2s, continuing anyway...');
                    } else {
                      console.log('  ✓ Sign out completed');
                    }
                  } catch (signOutErr) {
                    console.warn('  ⚠️ Sign out error (continuing anyway):', signOutErr);
                  }
                  console.log('  → Proceeding to clear storage...');
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  // Step 2: Clear localStorage - use a more reliable method
                  console.log('Step 2: Clearing localStorage...');
                  console.log(`  → Current localStorage has ${localStorage.length} items`);
                  const keysToRemove: string[] = [];
                  
                  // Get all keys first
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                      const lowerKey = key.toLowerCase();
                      if (
                        key.startsWith('sb-') || 
                        lowerKey.includes('supabase') || 
                        lowerKey.includes('auth') ||
                        lowerKey.includes('token') ||
                        lowerKey.includes('session') ||
                        key.includes('edmmbwiifjmruhzvlgnh')
                      ) {
                        keysToRemove.push(key);
                      }
                    }
                  }
                  
                  // Also check Object.keys as backup
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('sb-') || 
                        key.toLowerCase().includes('supabase') || 
                        key.toLowerCase().includes('auth') ||
                        key.toLowerCase().includes('token') ||
                        key.toLowerCase().includes('session') ||
                        key.includes('edmmbwiifjmruhzvlgnh')) {
                      if (!keysToRemove.includes(key)) {
                        keysToRemove.push(key);
                      }
                    }
                  });
                  
                  // Force add the specific token we know exists
                  const knownTokenKey = 'sb-edmmbwiifjmruhzvlgnh-auth-token';
                  if (!keysToRemove.includes(knownTokenKey)) {
                    keysToRemove.push(knownTokenKey);
                  }
                  
                  // Remove all keys
                  let removedCount = 0;
                  keysToRemove.forEach(key => {
                    try {
                      const hadValue = localStorage.getItem(key);
                      localStorage.removeItem(key);
                      removedCount++;
                      console.log(`  ✓ Removed: ${key}${hadValue ? ' (had value)' : ''}`);
                    } catch (e) {
                      console.warn(`  ✗ Failed to remove: ${key}`, e);
                    }
                  });
                  
                  // Double-check: try to remove the known token directly
                  try {
                    if (localStorage.getItem(knownTokenKey)) {
                      localStorage.removeItem(knownTokenKey);
                      console.log(`  ✓ Force removed known token: ${knownTokenKey}`);
                    }
                  } catch (e) {
                    console.warn(`  ✗ Could not remove known token:`, e);
                  }
                  
                  console.log(`✅ Removed ${removedCount} keys from localStorage`);
                  
                  // Step 3: Clear sessionStorage
                  console.log('Step 3: Clearing sessionStorage...');
                  const sessionKeysToRemove: string[] = [];
                  for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    if (key) {
                      const lowerKey = key.toLowerCase();
                      if (
                        key.startsWith('sb-') || 
                        lowerKey.includes('auth') ||
                        lowerKey.includes('token') ||
                        lowerKey.includes('session')
                      ) {
                        sessionKeysToRemove.push(key);
                      }
                    }
                  }
                  
                  sessionKeysToRemove.forEach(key => {
                    try {
                      sessionStorage.removeItem(key);
                      console.log(`  ✓ Removed from sessionStorage: ${key}`);
                    } catch (e) {
                      // Ignore
                    }
                  });
                  console.log(`✅ Step 3 completed - Removed ${sessionKeysToRemove.length} keys from sessionStorage`);
                  
                  // Step 4: Verify and force clear if needed
                  console.log('Step 4: Verifying session is cleared...');
                  await new Promise(resolve => setTimeout(resolve, 200));
                  
                  // Add timeout to getSession to prevent hanging
                  let session = null;
                  try {
                    const sessionPromise = supabase.auth.getSession();
                    const timeoutPromise = new Promise((resolve) => {
                      setTimeout(() => {
                        resolve({ data: { session: null }, timedOut: true });
                      }, 2000);
                    });
                    const result: any = await Promise.race([sessionPromise, timeoutPromise]);
                    if (result?.timedOut) {
                      console.warn('  ⚠️ getSession timed out after 2s, assuming no session');
                      session = null;
                    } else {
                      session = result?.data?.session || null;
                      console.log('  ✓ Session check completed');
                    }
                  } catch (sessionErr) {
                    console.warn('  ⚠️ getSession error (continuing anyway):', sessionErr);
                    session = null;
                  }
                  
                  // Get all remaining keys
                  console.log('  → Checking for remaining keys...');
                  const allRemainingKeys: string[] = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('sb-') || 
                        key.toLowerCase().includes('auth') || 
                        key.toLowerCase().includes('token') ||
                        key.toLowerCase().includes('supabase'))) {
                      allRemainingKeys.push(key);
                    }
                  }
                  
                  console.log(`  → Found ${allRemainingKeys.length} remaining keys, session exists: ${!!session}`);
                  
                  if (session || allRemainingKeys.length > 0) {
                    console.warn('⚠️ Some data still remains:', { 
                      hasSession: !!session, 
                      remainingKeys: allRemainingKeys,
                      sessionUser: session?.user?.id 
                    });
                    
                    // Force clear one more time
                    if (session) {
                      console.log('  → Force signing out again...');
                      await supabase.auth.signOut();
                      await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    
                    // Clear all remaining keys multiple times
                    for (let attempt = 0; attempt < 3; attempt++) {
                      allRemainingKeys.forEach(key => {
                        try {
                          localStorage.removeItem(key);
                          console.log(`  ✓ Attempt ${attempt + 1}: Removed ${key}`);
                        } catch (e) {
                          console.warn(`  ✗ Attempt ${attempt + 1}: Failed to remove ${key}`, e);
                        }
                      });
                      await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    
                    // Final check
                    const finalCheck = Object.keys(localStorage).filter(key => 
                      key.startsWith('sb-') || key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')
                    );
                    if (finalCheck.length > 0) {
                      console.error('❌ Still have keys after clearing:', finalCheck);
                    } else {
                      console.log('✅ All keys successfully removed');
                    }
                  } else {
                    console.log('✅ All clear - no session or keys remaining');
                  }
                  
                  console.log('✅ Manual clear completed');
                  alert('Session cleared! Please refresh the page and try logging in again.');
                  // Reload the page to ensure clean state
                  window.location.reload();
                } catch (err) {
                  console.error('❌ Manual clear error:', err);
                  alert('Failed to clear session. Please clear browser data manually (F12 → Application → Clear storage).');
                }
              }}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline transition-colors cursor-pointer"
              type="button"
            >
              Clear Session Data
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
};
