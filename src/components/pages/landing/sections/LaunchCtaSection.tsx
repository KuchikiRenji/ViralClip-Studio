import { Play, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { ViewType } from '../../../../types';
import styles from '../LandingPage.module.css';

interface LaunchCtaSectionProps {
  onNavigate: (view: ViewType) => void;
}

export const LaunchCtaSection = ({ onNavigate }: LaunchCtaSectionProps) => {
  const { t } = useTranslation();

  return (
    <section className={styles.launchCtaSection}>
      <div className={styles.launchCtaContainer}>
        <div className={styles.launchCtaCard}>
          <div className={styles.launchCtaPattern} aria-hidden="true" />
          <div className={styles.launchCtaContent}>
            <div className={styles.launchCtaLogo}>
              <div className={styles.launchCtaLogoIcon}>
                <Play size={16} fill="currentColor" />
              </div>
              <span className={styles.launchCtaLogoText}>{t('landing.launchCta.logo')}</span>
            </div>
            <h2 className={styles.launchCtaTitle}>{t('landing.launchCta.title')}</h2>
            <p className={styles.launchCtaSubtitle}>{t('landing.launchCta.subtitle')}</p>
            <button
              onClick={() => onNavigate('signup')}
              className={styles.launchCtaButton}
              type="button"
              aria-label={t('landing.launchCta.button')}
            >
              {t('landing.launchCta.button')}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

