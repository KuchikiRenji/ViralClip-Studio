import { useState, useEffect } from 'react';
import { Sparkles, User, Star, Crown, ChevronRight, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { supabase, SUPABASE_CONFIGURED } from '../../../../lib/supabase';
import { SUPABASE_CONFIG } from '../../../../constants/apiKeys';
import { ViewType } from '../../../../types';
import { FeaturesComparisonSection } from './FeaturesComparisonSection';
import styles from '../LandingPage.module.css';

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

interface PricingSectionProps {
  onNavigate: (view: ViewType) => void;
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

export const PricingSection = ({ onNavigate }: PricingSectionProps) => {
  const { t } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!SUPABASE_CONFIGURED) {
        console.warn('Supabase not configured for PricingSection');
        setLoading(false);
        return;
      }

      try {
        console.log('📡 Fetching pricing plans from Supabase...');
        
        // Direct fetch fallback for public data (bypasses Supabase client auth delays)
        const directFetch = async () => {
          const url = `${SUPABASE_CONFIG.URL}/rest/v1/subscription_plans?is_active=eq.true&select=*&order=price_monthly.asc`;
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
        
        let data, error;
        
        try {
          // Try Supabase client first with timeout
          const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
            setTimeout(() => {
              resolve({ 
                data: null, 
                error: { message: 'Timeout - using direct fetch' } 
              });
            }, 5000);
          });
          
          const queryPromise = supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price_monthly', { ascending: true });
          
          const result = await Promise.race([queryPromise, timeoutPromise]);
          
          if (result.error && result.error.message.includes('Timeout')) {
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

        if (error) {
          console.error('❌ Error fetching plans:', error);
          setLoading(false);
          return;
        }

        if (data) {
          console.log('✅ Successfully fetched pricing plans:', data.length);
          const parsedPlans: SubscriptionPlan[] = data.map(item => ({
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
        console.error('❌ Exception fetching plans:', err);
        setLoading(false);
      }
    };

    // Add timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('PricingSection fetch timeout - stopping loading state');
      setLoading(false);
    }, 10000); // 10 second timeout

    fetchPlans().finally(() => clearTimeout(timeoutId));

    return () => clearTimeout(timeoutId);
  }, []);

  if (loading) {
    return (
      <section id="pricing" className={styles.section}>
        <div className={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        </div>
      </section>
    );
  }

  const sortedPlans = [...plans].sort((a, b) => (a.price_monthly ?? 0) - (b.price_monthly ?? 0));
  const popularPlanIndex = Math.floor(sortedPlans.length / 2);

  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleWhite}>{t('landing.pricing.startWith')}</span>
          <br />
          <span className={styles.sectionTitleGradient}>{t('landing.pricing.today')}</span>
        </h2>
        <p className={styles.sectionSubtitle}>{t('landing.pricing.cancelAnytime')}</p>
        <div className={styles.toggleContainer}>
          <button 
            onClick={() => setIsAnnual(false)} 
            className={`${styles.toggleButton} ${!isAnnual ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
            type="button"
            aria-pressed={!isAnnual}
            aria-label={t('landing.pricing.monthly')}
          >
            {t('landing.pricing.monthly')}
          </button>
          <button 
            onClick={() => setIsAnnual(true)} 
            className={`${styles.toggleButton} ${isAnnual ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
            type="button"
            aria-pressed={isAnnual}
            aria-label={`${t('landing.pricing.annual')} - ${t('pricing.save')}`}
          >
            {t('landing.pricing.annual')}
            <span className={styles.discountBadge} aria-label={t('pricing.save')}>{t('pricing.save')}</span>
          </button>
        </div>
        <div className={styles.pricingGrid} role="list">
          {sortedPlans.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary, rgba(255, 255, 255, 0.6))' }}>
              <p>{t('pricing.noPlansAvailable') || 'Pricing plans are currently unavailable. Please try again later.'}</p>
            </div>
          ) : (
            sortedPlans.map((plan, index) => {
              const planId = getPlanId(plan.name);
              const icon = getPlanIcon(plan.name);
              const isPopular = index === popularPlanIndex;
              // Convert from cents to dollars
              const monthlyPriceInCents = plan.price_monthly ?? 0;
              const monthlyPrice = monthlyPriceInCents / 100;
              const monthlyEquivalent = monthlyPrice * 0.5;
              const yearlyTotal = monthlyPrice * 12 * 0.5;
              const displayPrice = isAnnual ? monthlyEquivalent : monthlyPrice;
              const features = plan.features || {};

              return (
                <article key={plan.id} className={`${styles.pricingCard} ${isPopular ? styles.pricingCardPopular : ''}`} role="listitem">
                  {isPopular && (
                    <div className={styles.popularBadge} aria-label={t('landing.pricing.mostPopular')}>
                      <Sparkles size={14} aria-hidden="true" />
                      {t('landing.pricing.mostPopular')}
                    </div>
                  )}
                  <div className={`${styles.pricingIcon} ${isPopular ? styles.pricingIconPopular : styles.pricingIconDefault}`} aria-hidden="true">
                    {icon === 'user' && <User size={24} className={styles.iconOrange} />}
                    {icon === 'star' && <Star size={24} className={styles.iconBlue} />}
                    {icon === 'crown' && <Crown size={24} className={styles.iconPink} />}
                  </div>
                  <h3 className={styles.pricingPlanName}>
                    {t(`landing.pricing.names.${planId}`)}
                    {isAnnual && plan.price_monthly !== 0 && (
                      <span className={styles.cardDiscountBadge}>{t('pricing.save')}</span>
                    )}
                  </h3>
                  <div className={styles.priceContainer}>
                    <div className={styles.pricingPrice}>
                      <span className={styles.priceAmount} aria-label={`CA$${displayPrice.toFixed(2)} per ${isAnnual ? t('pricing.perMonthEquivalent') : t('landing.pricing.period.month')}`}>
                        CA${displayPrice.toFixed(2)}
                      </span>
                      <span className={styles.pricePeriod}>
                        /{t('landing.pricing.period.month')}
                      </span>
                    </div>
                    {isAnnual && plan.price_monthly !== 0 && (
                      <div className={styles.billedAnnually}>
                        {t('pricing.billedAnnually', { amount: `CA$${yearlyTotal.toFixed(2)}` })}
                      </div>
                    )}
                  </div>
                  <p className={styles.planDescription}>{t(`pricing.plans.${planId}.description`)}</p>
                  <ul className={styles.featuresList} role="list">
                    {[
                      { key: 'aiVideos', count: features.aiVideos },
                      { key: 'exportMinutes', count: features.exportMinutes },
                      { key: 'voiceMinutes', count: features.voiceMinutes },
                      { key: 'aiImages', count: features.aiImages },
                    ].filter(f => f.count !== undefined).map((feature) => (
                      <li key={feature.key} className={styles.featureItem} role="listitem">
                        <div className={`${styles.featureIcon} ${isPopular ? styles.featureIconPopular : styles.featureIconDefault}`} aria-hidden="true">
                          <div className={`${styles.featureDot} ${isPopular ? styles.featureDotPopular : styles.featureDotDefault}`} />
                        </div>
                        <span className={styles.featureText}>{t(`landing.pricing.features.${feature.key}`, { count: feature.count })}</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    onClick={() => onNavigate('signup')} 
                    className={`${styles.pricingButton} ${isPopular ? styles.pricingButtonPopular : styles.pricingButtonDefault}`}
                    aria-label={`${t('landing.pricing.getStarted')} - ${t(`landing.pricing.names.${planId}`)}`}
                    type="button"
                  >
                    {t('landing.pricing.getStarted')}
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </article>
              );
            })
          )}
        </div>
        <FeaturesComparisonSection />
      </div>
    </section>
  );
};

