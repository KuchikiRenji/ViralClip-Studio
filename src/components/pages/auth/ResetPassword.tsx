import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '../../../constants/validation';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthBackground } from './AuthBackground';
import { supabase } from '../../../lib/supabase';

interface ResetPasswordProps {
  onBack: () => void;
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const ResetPassword = ({ onBack, onSuccess, onNavigateToLogin }: ResetPasswordProps) => {
  const { t } = useTranslation();
  const { updatePassword, loading, session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  // Check if user has a valid password reset session using centralized auth
  useEffect(() => {
    const checkSession = async () => {
      // Use centralized auth state instead of direct session check
      if (session) {
        setIsValidSession(true);
      } else {
        // Check URL hash for password reset token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
          // Try to set the session with the recovery token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          if (!error) {
            setIsValidSession(true);
          } else {
            setErrors({ general: 'Invalid or expired password reset link. Please request a new one.' });
          }
        } else {
          setErrors({ general: 'Invalid password reset link. Please request a new one.' });
        }
      }
    };

    checkSession();
  }, []);

  const passwordErrorId = errors.password ? 'reset-password-password-error' : undefined;
  const confirmPasswordErrorId = errors.confirmPassword ? 'reset-password-confirm-password-error' : undefined;

  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = t('auth.passwordMinLength');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await updatePassword(password);

      if (error) {
        setIsLoading(false);
        setErrors({ general: error.message });
        return;
      }

      setIsLoading(false);
      setPasswordResetSuccess(true);
      setErrors({});
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setErrors({ general: 'Network Error: Please check your internet connection or Supabase configuration.' });
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'An unexpected error occurred.' });
      }
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
    if (errors.confirmPassword && confirmPassword && value === confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
  };

  if (!isValidSession && !passwordResetSuccess) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex items-center justify-center px-6 py-12 relative overflow-hidden">
        <AuthBackground />
        <main className="relative z-10 w-full max-w-md">
          <section className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-8 md:backdrop-blur-xl">
            {errors.general && (
              <div role="alert" className="p-3 rounded-xl bg-[var(--color-brand-error)]/10 border border-[var(--color-brand-error)]/20 mb-6">
                <p className="text-sm text-[var(--color-brand-error)]">{errors.general}</p>
              </div>
            )}
            <button
              onClick={onNavigateToLogin}
              className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              type="button"
            >
              {t('auth.backToLogin')}
            </button>
          </section>
        </main>
      </div>
    );
  }

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
          <h1 className="text-4xl font-black mb-2 tracking-tight">{t('auth.resetPasswordTitle')}</h1>
          <p className="text-[var(--color-text-secondary)]">{t('auth.resetPasswordSubtitle')}</p>
        </header>

        <section
          className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-8 md:backdrop-blur-xl"
          role="main"
          aria-label={t('auth.resetPasswordTitle')}
        >
          {passwordResetSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-green-500" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('auth.passwordResetSuccess')}</h2>
                <p className="text-[var(--color-text-secondary)]">{t('auth.passwordResetSuccessMessage')}</p>
              </div>
              <button
                onClick={onNavigateToLogin}
                className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 hover:shadow-[0_12px_30px_rgba(var(--color-brand-primary-rgb),0.25)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                type="button"
              >
                {t('auth.logIn')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {errors.general && (
                <div role="alert" className="p-3 rounded-xl bg-[var(--color-brand-error)]/10 border border-[var(--color-brand-error)]/20">
                  <p className="text-sm text-[var(--color-brand-error)]">{errors.general}</p>
                </div>
              )}

              <fieldset className="space-y-6">
                <legend className="sr-only">{t('auth.resetPasswordTitle')}</legend>

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
                      aria-describedby={passwordErrorId}
                      aria-required="true"
                      placeholder={t('auth.enterPassword')}
                      autoComplete="new-password"
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
                    <p id="reset-password-password-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                    {t('auth.confirmPassword')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-[var(--color-surface-dark)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[color-mix(in-srgb,var(--color-text-primary),40%_transparent)] focus:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] transition-colors"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={confirmPasswordErrorId}
                      aria-required="true"
                      placeholder={t('auth.confirmPassword')}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] rounded"
                      aria-pressed={showConfirmPassword}
                      aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="reset-password-confirm-password-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isLoading || loading}
                className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 hover:shadow-[0_12px_30px_rgba(var(--color-brand-primary-rgb),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                aria-busy={isLoading || loading}
                aria-disabled={isLoading || loading}
              >
                {isLoading || loading ? t('auth.resettingPassword') : t('auth.resetPassword')}
              </button>
            </form>
          )}

          <footer className="mt-6 pt-6 border-t border-[color-mix(in-srgb,var(--color-text-primary),10%_transparent)] text-center">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('auth.backToLogin')}{' '}
              <button
                onClick={onNavigateToLogin}
                className="text-[var(--color-brand-primary)] hover:brightness-110 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                type="button"
                aria-label={t('auth.switchToLogin')}
              >
                {t('auth.logIn')}
              </button>
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
};

