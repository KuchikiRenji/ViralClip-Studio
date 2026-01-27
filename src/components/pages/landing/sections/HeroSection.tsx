import { ChevronRight, Play, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { ViewType } from '../../../../types';
import styles from '../LandingPage.module.css';

interface HeroSectionProps {
  onNavigate: (view: ViewType) => void;
}

export const HeroSection = ({ onNavigate }: HeroSectionProps) => {
  const { t } = useTranslation();

  return (
    <section id="hero" className={`${styles.section} ${styles.heroSection}`}>
      <div className={styles.container}>
        <div className={styles.heroContainer}>
          <div className={`${styles.animateFadeIn} ${styles.animateDelay1} ${styles.flexCenter}`}>
            <button className={styles.limitedOfferBadge} type="button" aria-label={t('landing.limitedOffer')}>
              <Zap size={14} className={styles.limitedOfferIcon} aria-hidden="true" />
              <span className={styles.limitedOfferText}>{t('landing.limitedOffer')}</span>
              <ChevronRight size={14} className={styles.limitedOfferArrow} aria-hidden="true" />
            </button>
          </div>
          <div className={`${styles.animateFadeIn} ${styles.animateDelay2} ${styles.flexCenter}`}>
            <span className={styles.aiToolBadge}>
              <Sparkles size={14} aria-hidden="true" />
              {t('landing.aiTool')}
            </span>
          </div>
          <h1 className={`${styles.heroTitle} ${styles.animateFadeIn} ${styles.animateDelay3}`}>
            <span className={styles.heroTitleGradient}>{t('landing.hero.title')}</span>
            <br />
            <span className={styles.heroTitleBlue}>{t('landing.hero.title2')}</span>
            <br />
            <span className={styles.heroTitleFaded}>{t('landing.hero.title3')}</span>
          </h1>
          <p className={`${styles.heroSubtitle} ${styles.animateFadeIn} ${styles.animateDelay4}`}>{t('landing.hero.subtitle')}</p>
          <div className={`${styles.heroButtons} ${styles.animateFadeIn} ${styles.animateDelay5}`}>
            <button onClick={() => onNavigate('home')} className={styles.primaryButton} type="button" aria-label={t('landing.hero.cta')}>
              <span>{t('landing.hero.cta')}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

