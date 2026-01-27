import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuth } from '../../../contexts/AuthContext';
import { AuthBackground } from './AuthBackground';

interface EmailVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const EmailVerification = ({ email, onBack, onSuccess, onNavigateToLogin }: EmailVerificationProps) => {
  const { t } = useTranslation();
  const { verifyOtp, resendConfirmationEmail, isAuthenticated } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [errors, setErrors] = useState<{ general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [emailResent, setEmailResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasAutoSubmittedRef = useRef(false);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-submit when all 8 digits are entered
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 8 && !isLoading && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      // Use a small delay to ensure state is updated
      setTimeout(() => {
        handleSubmit();
      }, 100);
    } else if (otpString.length < 8) {
      hasAutoSubmittedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp.join(''), isLoading]);

  // Check if user is authenticated (verification succeeded)
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        onSuccess();
      }, 500);
    }
  }, [isAuthenticated, onSuccess]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors({});

    // Auto-focus next input
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 8).split('');

    if (digits.length === 8) {
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        newOtp[index] = digit;
      });
      setOtp(newOtp);
      setErrors({});
      inputRefs.current[7]?.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const otpString = otp.join('');
    if (otpString.length !== 8) {
      setErrors({ general: t('auth.invalidVerificationCode') });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await verifyOtp(email, otpString);

      if (error) {
        setIsLoading(false);
        hasAutoSubmittedRef.current = false;
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          setErrors({ general: t('auth.invalidOrExpiredCode') });
        } else {
          setErrors({ general: error.message });
        }
            // Clear OTP on error
            setOtp(['', '', '', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        return;
      }

      // Success - user will be logged in via useEffect
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      hasAutoSubmittedRef.current = false;
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setErrors({ general: 'Network Error: Please check your internet connection or Supabase configuration.' });
      } else {
        setErrors({ general: error instanceof Error ? error.message : 'An unexpected error occurred.' });
      }
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrors({});
    setEmailResent(false);

    try {
      const { error } = await resendConfirmationEmail(email);

      if (error) {
        setIsResending(false);
        setErrors({ general: error.message });
        return;
      }

      setIsResending(false);
      setEmailResent(true);
      setTimeout(() => setEmailResent(false), 5000);
    } catch (error) {
      setIsResending(false);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to resend email.' });
    }
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
          <h1 className="text-4xl font-black mb-2 tracking-tight">{t('auth.verifyEmail')}</h1>
          <p className="text-[var(--color-text-secondary)]">
            {t('auth.enterVerificationCode8')} <span className="font-medium text-[var(--color-text-primary)]">{email}</span>
          </p>
        </header>

        <section
          className="bg-[var(--color-surface)] border border-[var(--color-border-default)] rounded-2xl p-8 md:backdrop-blur-xl"
          role="main"
          aria-label={t('auth.verifyEmail')}
        >
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {errors.general && (
              <div role="alert" className="p-3 rounded-xl bg-[var(--color-brand-error)]/10 border border-[var(--color-brand-error)]/20">
                <p className="text-sm text-[var(--color-brand-error)]">{errors.general}</p>
              </div>
            )}

            {emailResent && (
              <div role="alert" className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                <p className="text-sm text-green-500">{t('auth.resendSuccess')}</p>
              </div>
            )}

            <div className="space-y-4">
              <label htmlFor="otp-0" className="block text-sm font-medium text-[var(--color-text-primary)] text-center">
                {t('auth.verificationCode')}
              </label>
              <div className="flex justify-center gap-1.5 sm:gap-2 max-w-full mx-auto px-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-9 h-9 sm:w-11 sm:h-11 text-center text-base sm:text-lg font-bold bg-[var(--color-surface-dark)] border border-[var(--color-border-default)] rounded-lg sm:rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] transition-colors flex-shrink-0"
                    aria-label={`${t('auth.digit')} ${index + 1}`}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 8}
              className="w-full py-3 bg-[var(--color-brand-primary)] text-[var(--color-text-primary)] rounded-xl font-bold hover:brightness-110 hover:shadow-[0_12px_30px_rgba(var(--color-brand-primary-rgb),0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
              aria-busy={isLoading}
              aria-disabled={isLoading || otp.join('').length !== 8}
            >
              {isLoading ? t('auth.verifying') : t('auth.verify')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[color-mix(in-srgb,var(--color-text-primary),10%_transparent)] text-center space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('auth.didntReceiveCode')}
            </p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-[var(--color-brand-primary)] hover:brightness-110 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              {isResending ? t('auth.resendingEmail') : t('auth.resendConfirmationEmail')}
            </button>
          </div>

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

