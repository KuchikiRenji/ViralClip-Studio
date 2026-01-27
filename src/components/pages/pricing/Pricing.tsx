import { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, ChevronRight, Loader2, User, Star, Crown, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { useSubscription } from '../../../hooks/useSubscription';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, SUPABASE_CONFIGURED, invokeEdgeFunction } from '../../../lib/supabase';
import { SUPABASE_CONFIG } from '../../../constants/apiKeys';
import { FeaturesComparisonSection } from '../landing/sections/FeaturesComparisonSection';
import styles from './Pricing.module.css';

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number | null;
  credits_monthly: number;
  features: {
    aiVideos?: number;
    exportMinutes?: number;
    voiceMinutes?: number;
    aiImages?: number;
  } | null;
}

interface PricingProps {
  onBack?: () => void;
}

const getPlanIcon = (name: string): 'user' | 'star' | 'crown' => {
  const lower = name.toLowerCase();
  if (lower.includes('pro')) return 'star';
  if (lower.includes('premium') || lower.includes('enterprise')) return 'crown';
  return 'user';
};

const getPlanId = (name: string): 'beginner' | 'pro' | 'premium' => {
  const lower = name.toLowerCase();
  if (lower.includes('pro')) return 'pro';
  if (lower.includes('premium') || lower.includes('enterprise')) return 'premium';
  return 'beginner';
};

export const Pricing = ({ onBack }: PricingProps) => {
  const { t } = useTranslation();
  const { user, session, loading: authLoading } = useAuth();
  const { plan: currentPlan, loading: subscriptionLoading } = useSubscription();
  const [isAnnual, setIsAnnual] = useState(false); // Only monthly plans available for now
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const isPaywallReason = searchParams.get('reason') === 'paywall';
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle success parameter from payment redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('success') === 'true') {
        setSuccessMessage('Payment successful! Your subscription is being activated.');
        // Clean up URL without reloading
        urlParams.delete('success');
        const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
        window.history.replaceState({}, '', newUrl);
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    }
  }, []);

  // Monitor auth state changes for debugging and auto-clear wait messages
  useEffect(() => {
    console.log('🔍 Auth state changed in Pricing component:', {
      hasUser: !!user,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      authLoading,
      userId: user?.id,
      sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A',
      timestamp: new Date().toISOString()
    });
    
    // Auto-clear "waiting" error message when session becomes available
    if (errorMessage && errorMessage.includes('wait') && !authLoading) {
      // Check both hook state and direct session
      const hasSessionFromHook = !!session?.access_token;
      
      // Use centralized auth state - no need for direct session check
      if (hasSessionFromHook) {
        console.log('✅ Session detected from auth context, clearing wait message');
        setErrorMessage(null);
      }
    }
  }, [user, session, authLoading, errorMessage]);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!SUPABASE_CONFIGURED) {
        console.warn('⚠️ Supabase not configured - pricing plans cannot be loaded');
        setLoading(false);
        setErrorMessage('Configuration error: Supabase is not configured');
        return;
      }

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('❌ Timeout: Failed to fetch pricing plans after 10 seconds');
        console.error('🔍 Debug info:', {
          supabaseUrl: SUPABASE_CONFIG.URL,
          supabaseConfigured: SUPABASE_CONFIGURED,
          timestamp: new Date().toISOString()
        });
        setLoading(false);
        setErrorMessage('Failed to load pricing plans. Please refresh the page.');
      }, 10000); // 10 second timeout

      try {
        console.log('📡 Fetching pricing plans from Supabase...');
        console.log('🔍 Supabase config:', {
          url: SUPABASE_CONFIG.URL,
          configured: SUPABASE_CONFIGURED,
          timestamp: new Date().toISOString()
        });
        
        // Direct fetch fallback for public data (bypasses Supabase client auth delays)
        const directFetch = async () => {
          const url = `${SUPABASE_CONFIG.URL}/rest/v1/subscription_plans?is_active=eq.true&select=*&order=price_monthly.asc`;
          console.log('🌐 Direct fetch URL:', url);
          
          const response = await fetch(url, {
            headers: {
              'apikey': SUPABASE_CONFIG.ANON_KEY,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const data = await response.json();
          return { data, error: null };
        };
        
        // Try Supabase client first, with direct fetch fallback
        let data, error;
        
        try {
          console.log('⏳ Trying Supabase client...');
          
          // Create timeout promise
          const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
            setTimeout(() => {
              resolve({ 
                data: null, 
                error: { message: 'Supabase client timeout - using direct fetch fallback' } 
              });
            }, 5000); // 5 second timeout for client
          });
          
          const queryPromise = supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price_monthly', { ascending: true });
          
          const result = await Promise.race([queryPromise, timeoutPromise]);
          
          if (result.error && result.error.message.includes('timeout')) {
            console.warn('⚠️ Supabase client timed out, using direct fetch...');
            const fallbackResult = await directFetch();
            data = fallbackResult.data;
            error = fallbackResult.error;
          } else {
            data = result.data;
            error = result.error;
          }
        } catch (clientError) {
          console.warn('⚠️ Supabase client error, using direct fetch fallback:', clientError);
          const fallbackResult = await directFetch();
          data = fallbackResult.data;
          error = fallbackResult.error;
        }
        
        console.log('📦 Query result received:', { hasData: !!data, hasError: !!error });

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Error fetching pricing plans:', error);
          setErrorMessage(error.message || t('common.error'));
          setLoading(false);
          return;
        }

        if (data) {
          console.log('✅ Successfully fetched pricing plans:', data.length);
          const parsedPlans: SubscriptionPlan[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price_monthly: item.price_monthly !== null ? Number(item.price_monthly) : 0,
            credits_monthly: item.credits_monthly,
            features: typeof item.features === 'object' && item.features !== null ? item.features as SubscriptionPlan['features'] : null,
          }));
          setPlans(parsedPlans);
        } else {
          console.warn('⚠️ No pricing plans data returned');
        }
        setLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('❌ Exception fetching pricing plans:', err);
        setErrorMessage(err instanceof Error ? err.message : t('common.error'));
        setLoading(false);
      }
    };

    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - remove 't' dependency to prevent re-renders

  const handleSubscribe = async (planId: string) => {
    console.log('🔘 handleSubscribe called with planId:', planId);
    
    // Prevent any navigation or page reload - stay on pricing page
    console.log('🔍 Checking saved login information...');
    
    // Wait for auth to finish loading if it's still loading
    let waitCount = 0;
    while (authLoading && waitCount < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }
    
    // Check auth state from centralized context - stay on same page
    const hasUser = !!user;
    const hasValidSession = !!session?.access_token;
    const hasValidToken = hasUser && hasValidSession;
    
    console.log('🔐 Login status from auth context:', {
      hasUser,
      hasValidSession,
      hasValidToken,
      authLoading,
      userId: user?.id
    });
    
    // If user is not logged in, show error and stop - DO NOT NAVIGATE
    if (!hasValidToken) {
      if (!hasUser) {
        console.warn('⚠️ No user found - login required (staying on pricing page)');
        setErrorMessage(t('paywall.loginRequired'));
      } else if (!hasValidSession) {
        console.warn('⚠️ No valid session found - session may have expired (staying on pricing page)');
        setErrorMessage('Your session has expired. Please log out and log back in, then try again.');
      } else {
        console.warn('⚠️ Invalid token state (staying on pricing page)');
        setErrorMessage(t('paywall.loginRequired'));
      }
      return;
    }
    
    // User is logged in - proceed with subscription on same page
    console.log('✅ Login information verified - proceeding with subscription (staying on pricing page)');
    proceedWithSubscription(planId);
  };

  const proceedWithSubscription = useCallback(async (planId: string) => {
    console.log('🛒 Proceeding with subscription for plan:', planId);
    
    // Find the plan to log details
    const selectedPlan = plans.find(p => p.id === planId);
    console.log('🛒 Subscribing to plan:', {
      planId,
      planName: selectedPlan?.name,
      priceMonthly: selectedPlan?.price_monthly ? `$${(selectedPlan.price_monthly / 100).toFixed(2)}` : 'N/A',
      priceInCents: selectedPlan?.price_monthly
    });
    
    setProcessingPlanId(planId);
    setErrorMessage(null);
    
    try {
      // Create subscription and send invoice email - stays on same page
      // No windows opened, no redirects - user stays on pricing page with auth preserved
      await invokeEdgeFunction<{ url?: string }>('square-create-subscription-checkout', {
        plan_id: planId,
        interval: isAnnual ? 'annual' : 'monthly'
      }); 

      // Subscription created and invoice email sent successfully
      console.log('✅ Subscription created - invoice sent to email');
      setProcessingPlanId(null);
      setSuccessMessage('Subscription request received! Please check your email for the invoice and payment instructions.');
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 10000);
    } catch (err) {
      // Improve error message handling to avoid confusion with user registration
      let errorMessage = err instanceof Error ? err.message : t('common.error');
      
      // Check if error mentions "registration" - this is likely about Square customer creation, not user registration
      if (errorMessage.toLowerCase().includes('registration') || 
          errorMessage.toLowerCase().includes('register')) {
        // Replace confusing "registration" errors with clearer subscription error messages
        if (errorMessage.toLowerCase().includes('customer')) {
          errorMessage = 'Failed to create payment account. Please try again or contact support.';
        } else {
          errorMessage = 'Failed to start subscription. Please try again or contact support.';
        }
      }
      
      // Check for Square plan enablement errors
      if (errorMessage.toLowerCase().includes('not enabled') || 
          errorMessage.toLowerCase().includes('is not enabled')) {
        errorMessage = 'This subscription plan is not currently available. Please contact support or try a different plan.';
      }
      
      // Check for plan-related errors
      if (errorMessage.toLowerCase().includes('plan') && 
          (errorMessage.toLowerCase().includes('not found') || 
           errorMessage.toLowerCase().includes('invalid'))) {
        errorMessage = 'The selected subscription plan is not available. Please refresh the page and try again.';
      }
      
      // Log the original error for debugging
      console.error('❌ Subscription checkout error:', err);
      setErrorMessage(errorMessage);
    } finally {
      setProcessingPlanId(null);
    }
  }, [plans, isAnnual, t]);


  const sortedPlans = useMemo(() => 
    [...plans].sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0)),
    [plans]
  );
  
  const popularPlanIndex = Math.floor(sortedPlans.length / 2);
  const currentPlanId = currentPlan?.id;

  if (loading || subscriptionLoading) {
    return (
      <div className={styles.pricingContainer}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pricingContainer}>
      {onBack && (
        <button 
          onClick={onBack}
          className={styles.backButton}
          type="button"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>
      )}

      {isPaywallReason && (
        <div className={styles.paywallAlert}>
          <Crown className={styles.paywallIcon} size={24} />
          <div className={styles.paywallText}>
            <h2>{t('pricing.subscriptionRequired.title')}</h2>
            <p>{t('pricing.subscriptionRequired.description')}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className={styles.paywallAlert} role="alert" aria-live="polite">
          <div className={styles.paywallText}>
            <h2>{t('common.error')}</h2>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className={styles.paywallAlert} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }} role="alert" aria-live="polite">
          <div className={styles.paywallText}>
            <h2 style={{ color: '#22c55e' }}>Success!</h2>
            <p style={{ color: '#86efac' }}>{successMessage}</p>
          </div>
        </div>
      )}
      
      <div className={styles.header}>
        <h1 className={styles.title}>{t('pricing.title')}</h1>
        <p className={styles.subtitle}>{t('pricing.subtitle')}</p>
      </div>

      {/* Show annual toggle if annual plans are configured */}
      {plans.some(plan => plan.price_monthly && plan.price_monthly > 0) && (
        <div className={styles.toggleWrapper}>
          <div className={styles.toggleContainer}>
            <button 
              onClick={() => setIsAnnual(false)} 
              className={`${styles.toggleButton} ${!isAnnual ? styles.toggleButtonActive : ''}`}
              type="button"
              aria-pressed={!isAnnual}
            >
              {t('pricing.monthly')}
            </button>
            <button 
              onClick={() => setIsAnnual(true)} 
              className={`${styles.toggleButton} ${isAnnual ? styles.toggleButtonActive : ''}`}
              type="button"
              aria-pressed={isAnnual}
            >
              {t('pricing.annual')}
              <span className={styles.discountBadge}>{t('pricing.save')}</span>
            </button>
          </div>
        </div>
      )}

      <div className={styles.plansGrid}>
        {sortedPlans.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>{t('pricing.noPlansAvailable') || 'Pricing plans are currently unavailable. Please try again later.'}</p>
          </div>
        ) : (
          sortedPlans.map((plan, index) => {
            const planId = getPlanId(plan.name);
            const icon = getPlanIcon(plan.name);
            const isPopular = index === popularPlanIndex;
            const isCurrent = plan.id === currentPlanId;
            // Convert from cents to dollars
            const monthlyPriceInCents = plan.price_monthly ?? 0;
            const monthlyPrice = monthlyPriceInCents / 100;
            const monthlyEquivalent = monthlyPrice * 0.5;
            const yearlyTotal = monthlyPrice * 12 * 0.5;
            const displayPrice = isAnnual ? monthlyEquivalent : monthlyPrice;
            const features = plan.features || {};
            const isProcessing = processingPlanId === plan.id;

            return (
              <div key={plan.id} className={styles.planCard}>
                {isPopular && (
                  <div className={styles.popularBadge}>
                    <Sparkles size={14} />
                    {t('landing.pricing.mostPopular')}
                  </div>
                )}
                <div className={`${styles.planCardBackground} ${isPopular ? styles.planCardBackgroundPopular : ''}`}>
                  <div className={`${styles.planCardGlow} ${styles.planCardGlowTop} ${isPopular ? styles.planCardGlowPopular : ''}`} />
                  <div className={`${styles.planCardGlow} ${styles.planCardGlowBottom} ${isPopular ? styles.planCardGlowPopular : ''}`} />
                </div>

                <div className={styles.planCardContent}>
                  <div className={`${styles.planIcon} ${isPopular ? styles.planIconPopular : styles.planIconDefault}`}>
                    {icon === 'user' && <User size={20} style={{ color: 'var(--color-brand-primary)' }} />}
                    {icon === 'star' && <Star size={20} style={{ color: 'var(--color-brand-primary)' }} />}
                    {icon === 'crown' && <Crown size={20} style={{ color: 'var(--color-brand-primary)' }} />}
                  </div>

                  <h3 className={styles.planName}>
                    {t(`landing.pricing.names.${planId}`)}
                    {isAnnual && monthlyPrice !== 0 && (
                      <span className={styles.cardDiscountBadge}>{t('pricing.save')}</span>
                    )}
                  </h3>

                  <div className={styles.priceContainer}>
                    <div className={styles.priceRow}>
                      <span className={styles.priceAmount}>CA${displayPrice.toFixed(2)}</span>
                      <span className={styles.pricePeriod}>/{t('landing.pricing.period.month')}</span>
                    </div>
                    {isAnnual && monthlyPrice !== 0 && (
                      <div className={styles.billedAnnually}>
                        {t('pricing.billedAnnually', { amount: `CA$${yearlyTotal.toFixed(2)}` })}
                      </div>
                    )}
                  </div>

                  <p className={styles.planDescription}>
                    {t(`pricing.plans.${planId}.description`)}
                  </p>

                  <ul className={styles.featuresList}>
                    {[
                      { key: 'aiVideos', count: features.aiVideos },
                      { key: 'exportMinutes', count: features.exportMinutes },
                      { key: 'voiceMinutes', count: features.voiceMinutes },
                      { key: 'aiImages', count: features.aiImages },
                    ].filter(f => f.count !== undefined).map((feature) => (
                      <li key={feature.key} className={styles.featureItem}>
                        <div className={`${styles.featureIcon} ${isPopular ? styles.featureIconPopular : styles.featureIconDefault}`}>
                          <div className={`${styles.featureDot} ${isPopular ? styles.featureDotPopular : styles.featureDotDefault}`} />
                        </div>
                        <span className={styles.featureText}>{t(`landing.pricing.features.${feature.key}`, { count: feature.count })}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`${styles.planButton} ${isCurrent ? styles.planButtonCurrent : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔘 Button clicked for plan:', plan.id, plan.name);
                      handleSubscribe(plan.id);
                    }}
                    disabled={isProcessing || isCurrent}
                  >
                    {isProcessing ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <>
                        <span className={styles.buttonText}>
                          {isCurrent ? t('pricing.viewCurrent') : t('pricing.getStarted')}
                        </span>
                        {!isCurrent && <ChevronRight className={styles.buttonIcon} />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <FeaturesComparisonSection />
    </div>
  );
};
