import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { EMAIL_REGEX } from '../../../constants/validation';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthBackground } from './AuthBackground';

interface ForgotPasswordProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

export const ForgotPassword = ({ onBack, onNavigateToLogin }: ForgotPasswordProps) => {
  const { t } = useTranslation();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const emailErrorId = errors.email ? 'forgot-password-email-error' : undefined;

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    setErrors(newErrors);
    return !newErrors.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setEmailSent(false);

    try {
      const { error } = await resetPasswordForEmail(email);

      if (error) {
        setIsLoading(false);
        setErrors({ general: error.message });
        return;
      }

      setIsLoading(false);
      setEmailSent(true);
      setErrors({});
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
          <h1 className="text-4xl font-black mb-2 tracking-tight">{t('auth.forgotPasswordTitle')}</h1>
          <p className="text-[var(--color-text-secondary)]">{t('auth.forgotPasswordSubtitle')}</p>
        </header>

        <section
          className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-8 md:backdrop-blur-xl"
          role="main"
          aria-label={t('auth.forgotPasswordTitle')}
        >
          {emailSent ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-500" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('auth.resetLinkSent')}</h2>
                <p className="text-[var(--color-text-secondary)]">{t('auth.resetLinkSentMessage')}</p>
              </div>
              <button
                onClick={onNavigateToLogin}
                className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 hover:shadow-[0_12px_30px_rgba(var(--color-brand-primary-rgb),0.25)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                type="button"
              >
                {t('auth.backToLogin')}
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
                <legend className="sr-only">{t('auth.forgotPasswordTitle')}</legend>

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
                      aria-describedby={emailErrorId}
                      aria-required="true"
                      placeholder={t('auth.enterEmailExample')}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p id="forgot-password-email-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
                      {errors.email}
                    </p>
                  )}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 hover:shadow-[0_12px_30px_rgba(var(--color-brand-primary-rgb),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                aria-busy={isLoading}
                aria-disabled={isLoading}
              >
                {isLoading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
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

