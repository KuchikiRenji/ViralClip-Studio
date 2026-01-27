import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Check } from 'lucide-react';
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH, MIN_NAME_LENGTH } from '../../../constants/validation';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { AuthBackground } from './AuthBackground';
import { EmailVerification } from './EmailVerification';

interface SignupProps {
  onBack: () => void;
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

const PASSWORD_REQUIREMENTS = [
  { labelKey: 'auth.atLeast8Chars', test: (pwd: string) => pwd.length >= MIN_PASSWORD_LENGTH },
  { labelKey: 'auth.oneUppercase', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { labelKey: 'auth.oneLowercase', test: (pwd: string) => /[a-z]/.test(pwd) },
  { labelKey: 'auth.oneNumber', test: (pwd: string) => /\d/.test(pwd) }
] as const;

export const Signup = ({ onBack, onSuccess, onNavigateToLogin }: SignupProps) => {
  const { t } = useTranslation();
  const { signUpWithEmail } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = t('auth.nameRequired');
    } else if (trimmedName.length < MIN_NAME_LENGTH) {
      newErrors.name = t('auth.nameMinLength');
    }

    if (!email) {
      newErrors.email = t('auth.emailRequired');
    } else if (!EMAIL_REGEX.test(email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (!PASSWORD_REQUIREMENTS.every(req => req.test(password))) {
      newErrors.password = t('auth.passwordRequirements');
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    if (!validateForm() || !agreedToTerms) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await signUpWithEmail(email, password, {
        full_name: name.trim(),
      });

      setIsLoading(false);

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrors({ general: t('auth.userAlreadyExists') });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setErrors({ general: t('auth.userAlreadyExists') });
        return;
      }

      // If user needs email confirmation
      if (data?.user && !data.session) {
        setSignupSuccess(true);
        return;
      }

      // If session exists, user is logged in immediately
      if (data?.user && data?.session) {
        setTimeout(() => {
          onSuccess();
        }, 200);
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

  const handleNameChange = (value: string) => {
    setName(value);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
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
          <h1 className="text-4xl font-black mb-2 tracking-tight">{t('auth.createAccount')}</h1>
          <p className="text-[var(--color-text-secondary)]">{t('auth.startJourney')}</p>
        </header>

        {signupSuccess ? (
          <EmailVerification
            email={email}
            onBack={onBack}
            onSuccess={onSuccess}
            onNavigateToLogin={onNavigateToLogin}
          />
        ) : (
          <section
            className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-8 md:backdrop-blur-xl"
            role="main"
            aria-label={t('auth.createAccount')}
          >
            <>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {errors.general && (
                <div role="alert" className="p-3 rounded-xl bg-[var(--color-brand-error)]/10 border border-[var(--color-brand-error)]/20">
                  <p className="text-sm text-[var(--color-brand-error)]">{errors.general}</p>
                </div>
              )}
              <fieldset className="space-y-5">
                <legend className="sr-only">{t('auth.accountDetails')}</legend>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">
                    {t('auth.fullName')}
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface-dark)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[color-mix(in-srgb,var(--color-text-primary),40%_transparent)] focus:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] transition-colors"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'signup-name-error' : undefined}
                      aria-required="true"
                      placeholder={t('auth.enterNameExample')}
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <p id="signup-name-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
                      {errors.name}
                    </p>
                  )}
                </div>

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
                      aria-describedby={errors.email ? 'signup-email-error' : undefined}
                      aria-required="true"
                      placeholder={t('auth.enterEmailExample')}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p id="signup-email-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
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
                      aria-describedby={errors.password ? 'signup-password-error' : undefined}
                      aria-required="true"
                      placeholder={t('auth.createStrongPassword')}
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
                    <p id="signup-password-error" role="alert" className="mt-2 text-sm text-[var(--color-brand-error)]">
                      {errors.password}
                    </p>
                  )}
                  {password && (
                    <div className="mt-3 space-y-2" role="list" aria-label={t('auth.passwordRequirements')}>
                      {PASSWORD_REQUIREMENTS.map((req) => {
                        const isValid = req.test(password);
                        return (
                          <div key={req.labelKey} className="flex items-center gap-2 text-xs" role="listitem">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{
                                background: isValid
                                  ? 'color-mix(in srgb, var(--color-brand-primary) 25%, transparent)'
                                  : 'color-mix(in srgb, var(--color-text-primary) 10%, transparent)',
                                color: isValid ? 'var(--color-brand-primary)' : 'color-mix(in srgb, var(--color-text-primary) 40%, transparent)',
                              }}
                              aria-hidden="true"
                            >
                              {isValid && <Check className="w-3 h-3" aria-hidden="true" />}
                            </div>
                            <span
                              className="transition-colors"
                              style={{
                                color: isValid ? 'var(--color-text-secondary)' : 'color-mix(in srgb, var(--color-text-primary) 55%, transparent)'
                              }}
                            >
                              {t(req.labelKey)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </fieldset>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-[var(--color-surface-dark)] border border-[var(--color-border-default)] checked:bg-[var(--color-brand-primary)] checked:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] transition-colors"
                    aria-required="true"
                    aria-describedby="terms-description"
                  />
                  <span id="terms-description" className="text-sm text-[var(--color-text-secondary)]">
                    {t('auth.agreeToTerms')}{' '}
                    <button
                      type="button"
                      className="text-[var(--color-brand-primary)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                      aria-label={t('auth.viewTermsOfService')}
                    >
                      {t('auth.termsOfService')}
                    </button>
                    {' '}{t('auth.and')}{' '}
                    <button
                      type="button"
                      className="text-[var(--color-brand-primary)] hover:brightness-110 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                      aria-label={t('auth.viewPrivacyPolicy')}
                    >
                      {t('auth.privacyPolicy')}
                    </button>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 hover:shadow-[0_12px_30px_rgba(var(--color-brand-primary-rgb),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                aria-busy={isLoading}
                aria-disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
              </button>
            </form>

            <footer className="mt-6 pt-6 border-t border-[color-mix(in-srgb,var(--color-text-primary),10%_transparent)] text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('auth.haveAccount')}{' '}
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
            </>
          </section>
        )}
      </main>
    </div>
  );
};
