import { useTranslation } from '../../../../hooks/useTranslation';
import styles from '../LandingPage.module.css';

export const SimpleStepsSection = () => {
  const { t, currentLanguage } = useTranslation();
  const screenshotLanguage = currentLanguage.toLowerCase().startsWith('fr') ? 'fr' : 'en';

  return (
    <section id="process" className={`${styles.section} ${styles.simpleStepsSection}`}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleWhite}>{t('landing.simpleSteps.title1')}</span>
          <br />
          <span className={styles.sectionTitleGradient}>{t('landing.simpleSteps.title2')}</span>
        </h2>
        <p className={styles.sectionSubtitle}>{t('landing.simpleSteps.subtitle')}</p>
        <div className={styles.stepsHeader} role="list">
          {[1, 2, 3].map((step) => (
            <article key={step} className={styles.stepHeaderCard} role="listitem">
              <div className={styles.stepHeaderLabel} aria-label={`${t('landing.step')} ${step}`}>{t('landing.step')} {step}</div>
              <h3 className={styles.stepHeaderTitle}>{t(`landing.process.step${step}.title`)}</h3>
              <p className={styles.stepHeaderDescription}>{t(`landing.process.step${step}.description`)}</p>
            </article>
          ))}
        </div>
        <div className={styles.appShowcaseCard}>
          <div className={styles.appShowcaseInner}>
            <div className={styles.appScreenshot}>
              <img
                src={screenshotLanguage === 'fr' ? '/French.png' : '/English.png'}
                alt={t('landing.thumbnailAlt', { id: screenshotLanguage.toUpperCase() })}
                className={styles.appScreenshotImage}
                width={1152}
                height={648}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

