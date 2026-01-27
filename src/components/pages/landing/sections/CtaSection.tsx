import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { ViewType } from '../../../../types';
import styles from '../LandingPage.module.css';

interface CtaSectionProps {
  onNavigate: (view: ViewType) => void;
}

export const CtaSection = ({ onNavigate }: CtaSectionProps) => {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.ctaCard}>
          <div className={`${styles.ctaGlow} ${styles.ctaGlow1}`} />
          <div className={`${styles.ctaGlow} ${styles.ctaGlow2}`} />
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>
              <span className={styles.sectionTitleGradient}>{t('landing.contact.moreQuestions')}</span>
            </h3>
            <p className={styles.ctaSubtitle}>{t('landing.contact.subtitle')}</p>
            <button onClick={() => onNavigate('signup')} className={styles.primaryButton} type="button" aria-label={t('landing.contact.cta')}>
              <span>{t('landing.contact.cta')}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

