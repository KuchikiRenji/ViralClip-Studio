import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { ViewType } from '../../../types';
import { PageContainer } from '../../common/layout';
import styles from './ServicePage.module.css';

interface ServicePageProps {
  onNavigate: (view: ViewType) => void;
}

type CheckoutAddOnId = 'nicheVault' | 'monetizationBlueprint' | 'shortsOpsCourse';

type AddOn = {
  id: CheckoutAddOnId;
  normalPriceUsd: number;
  todayPriceUsd: number;
  title: string;
  description: string;
  toggleLabel: string;
};

const ADD_ONS: AddOn[] = [
  {
    id: 'nicheVault',
    normalPriceUsd: 99,
    todayPriceUsd: 27,
    title: 'Creator Niche Vault',
    description:
      'A curated set of niche lanes + hook patterns engineered for Shorts. Stop guessing—ship inside proven demand.',
    toggleLabel: 'Yes, add Niche Vault to my order for $27',
  },
  {
    id: 'monetizationBlueprint',
    normalPriceUsd: 197,
    todayPriceUsd: 47,
    title: 'Monetization Blueprint',
    description:
      'Turn output into income with a practical monetization map: ads, sponsors, affiliate flows, and posting cadence.',
    toggleLabel: 'Yes, add Blueprint to my order for $47',
  },
  {
    id: 'shortsOpsCourse',
    normalPriceUsd: 497,
    todayPriceUsd: 97,
    title: 'Shorts Operating System',
    description:
      'An A–Z system: ideation → scripting → clipping → export → iteration. Build a repeatable engine, not a one-off win.',
    toggleLabel: 'Yes, add the course to my order for $97',
  },
];

const BUNDLE = {
  normalTotalUsd: 99 + 197 + 497,
  todayTotalUsd: 119,
  title: 'VIP Accelerator Pack',
  subtitle: 'Grab all 3 accelerators today for $119 (save $52).',
  toggleLabel: 'Yes, add the full Accelerator Bundle — one-time offer',
} as const;

const formatUsd = (amount: number) => `$${amount}`;
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const ServicePage = ({ onNavigate }: ServicePageProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [bundleSelected, setBundleSelected] = useState(false);
  const [selected, setSelected] = useState<Record<CheckoutAddOnId, boolean>>({
    nicheVault: false,
    monetizationBlueprint: false,
    shortsOpsCourse: false,
  });

  const selectedAddOns = useMemo(() => {
    if (bundleSelected) return ADD_ONS;
    return ADD_ONS.filter((addOn) => selected[addOn.id]);
  }, [bundleSelected, selected]);

  const totalTodayUsd = useMemo(() => {
    if (bundleSelected) return BUNDLE.todayTotalUsd;
    return selectedAddOns.reduce((sum, item) => sum + item.todayPriceUsd, 0);
  }, [bundleSelected, selectedAddOns]);

  const handleToggleAddOn = (id: CheckoutAddOnId) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleBundle = () => {
    setBundleSelected((prev) => !prev);
  };

  return (
    <PageContainer className={styles.pageShell}>
      <div className={styles.page}>
        <div className={styles.layout}>
          <section aria-label="Service checkout">
            <div className={styles.topBar}>
              <button
                className={styles.backButton}
                type="button"
                onClick={() => onNavigate('home')}
                aria-label={t('common.back')}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                {t('common.back')}
              </button>
            </div>

            <header className={styles.hero}>
              <div className={styles.badge}>
                <Sparkles size={14} aria-hidden="true" />
                <span>{t('nav.services')}</span>
              </div>
              <h1 className={styles.heroTitle}>
                Want to scale 3× faster with Shorts?
              </h1>
              <p className={styles.heroSubtitle}>
                Subscribe to Zitro AI+ and unlock one-click accelerators to ship better clips, faster—without burning creative energy.
              </p>
            </header>

            <div className={styles.offers} aria-label="One-time add-ons">
              {ADD_ONS.map((addOn) => {
                const checkboxId = `addon-${addOn.id}`;
                const checked = bundleSelected || selected[addOn.id];
                return (
                  <article key={addOn.id} className={styles.offerCard}>
                    <div className={styles.offerHeader}>
                      <div className={styles.offerPriceLine}>
                        Normally {formatUsd(addOn.normalPriceUsd)} → Today {formatUsd(addOn.todayPriceUsd)}
                      </div>
                      <h3 className={styles.offerTitle}>{addOn.title}</h3>
                      <p className={styles.offerDesc}>{addOn.description}</p>
                    </div>
                    <div className={styles.toggleRow}>
                      <input
                        id={checkboxId}
                        className={styles.checkbox}
                        type="checkbox"
                        checked={checked}
                        disabled={bundleSelected}
                        onChange={() => handleToggleAddOn(addOn.id)}
                        aria-label={addOn.toggleLabel}
                      />
                      <label htmlFor={checkboxId} className={styles.toggleLabel}>
                        {addOn.toggleLabel}
                      </label>
                    </div>
                  </article>
                );
              })}

              <article className={`${styles.offerCard} ${styles.bundleCard}`}>
                <div className={styles.offerHeader}>
                  <h3 className={styles.bundleTitle}>
                    {BUNDLE.title}: {BUNDLE.subtitle}
                  </h3>
                  <ul className={styles.bundleList}>
                    {ADD_ONS.map((a) => (
                      <li key={a.id}>
                        <Check size={14} aria-hidden="true" /> {a.title}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.toggleRow}>
                  <input
                    id="bundle"
                    className={styles.checkbox}
                    type="checkbox"
                    checked={bundleSelected}
                    onChange={handleToggleBundle}
                    aria-label={BUNDLE.toggleLabel}
                  />
                  <label htmlFor="bundle" className={styles.toggleLabel}>
                    {BUNDLE.toggleLabel}
                  </label>
                </div>
              </article>

              <p className={styles.finePrint}>
                These one-time prices are only available here. Once you leave this page, they won’t appear again.
              </p>
            </div>
          </section>

          <aside className={styles.summary} aria-label="Order summary">
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <label className={styles.fieldLabel} htmlFor="account-email">
              Account Email
            </label>
            <input
              id="account-email"
              className={styles.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />

            <div className={styles.lineItems} aria-label="Selected items">
              {selectedAddOns.length === 0 && !bundleSelected && (
                <div className={styles.lineItem}>
                  <span>No add-ons selected</span>
                  <span>{formatUsd(0)}</span>
                </div>
              )}

              {bundleSelected && (
                <div className={styles.lineItem}>
                  <span>{BUNDLE.title}</span>
                  <span>{formatUsd(BUNDLE.todayTotalUsd)}</span>
                </div>
              )}

              {!bundleSelected &&
                selectedAddOns.map((item) => (
                  <div key={item.id} className={styles.lineItem}>
                    <span>{item.title}</span>
                    <span>{formatUsd(item.todayPriceUsd)}</span>
                  </div>
                ))}
            </div>

            <div className={styles.total} aria-label="Total">
              <span>Total</span>
              <span>{formatUsd(totalTodayUsd)}</span>
            </div>

            <p className={styles.terms}>
              By continuing, you agree to our{' '}
              <a className={styles.termsLink} href="#" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>
              .
            </p>

            <button
              type="button"
              className={styles.checkout}
              disabled={!isValidEmail(email)}
              onClick={() => onNavigate('signup')}
              aria-label="Checkout now"
            >
              Checkout Now
            </button>
          </aside>
        </div>
      </div>
    </PageContainer>
  );
};
