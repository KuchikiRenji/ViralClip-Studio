import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from '../../../hooks/useTranslation';
import { buildUrl } from '../../../constants/routes';

export const AuthCallback = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL (contains tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Handle errors
        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('app:navigate', { 
              detail: { view: 'login' } 
            }));
          }, 3000);
          return;
        }

        // If we have tokens, exchange them for a session
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setStatus('error');
            setMessage(sessionError.message);
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app:navigate', { 
                detail: { view: 'login' } 
              }));
            }, 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            // Check if this is a password reset flow
            if (type === 'recovery') {
              setMessage('Redirecting to password reset...');
              setTimeout(() => {
                // Redirect to reset-password - the session is already set, so ResetPassword component will detect it
                window.dispatchEvent(new CustomEvent('app:navigate', { 
                  detail: { view: 'reset-password' } 
                }));
              }, 1000);
            } else {
              setMessage('Email confirmed! Redirecting...');
              // Redirect to home after 2 seconds
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('app:navigate', { 
                  detail: { view: 'home' } 
                }));
              }, 2000);
            }
            return;
          }
        }

        // Check if there's a code in the URL (alternative flow)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setStatus('error');
            setMessage(exchangeError.message);
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app:navigate', { 
                detail: { view: 'login' } 
              }));
            }, 3000);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Email confirmed! Redirecting...');
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('app:navigate', { 
                detail: { view: 'home' } 
              }));
            }, 2000);
            return;
          }
        }

        // No tokens or code found
        setStatus('error');
        setMessage('Invalid confirmation link');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app:navigate', { 
            detail: { view: 'login' } 
          }));
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('app:navigate', { 
            detail: { view: 'login' } 
          }));
        }, 3000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold mb-2 text-[var(--color-text-primary)]">Confirming your email...</h2>
            <p className="text-[var(--color-text-secondary)]">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-500">Email Confirmed!</h2>
            <p className="text-[var(--color-text-secondary)]">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-500">Confirmation Failed</h2>
            <p className="text-[var(--color-text-secondary)] mb-4">{message}</p>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('app:navigate', { 
                  detail: { view: 'login' } 
                }));
              }}
              className="px-6 py-2 bg-[var(--color-brand-primary)] text-white rounded-lg hover:brightness-110 transition-all"
            >
              {t('auth.backToLogin')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

