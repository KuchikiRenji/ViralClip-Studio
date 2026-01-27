import { useTranslation } from '../../../../hooks/useTranslation';
import styles from '../LandingPage.module.css';

export const ViralClipsSection = () => {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleWhite}>{t('landing.viralClips.title1')}</span>
          <br />
          <span className={styles.sectionTitleGradient}>{t('landing.viralClips.title2')}</span>
        </h2>
        <p className={styles.sectionSubtitle}>{t('landing.viralClips.subtitle')}</p>
        <div className={styles.thumbnailsWrapper}>
          <div className={`${styles.thumbnailsFade} ${styles.thumbnailsFadeLeft}`} />
          <div className={`${styles.thumbnailsFade} ${styles.thumbnailsFadeRight}`} />
          <div className={styles.thumbnailsScroll}>
            <div className={styles.thumbnailCard}>
              <img
                src="/screen-1.png"
                alt={t('landing.thumbnailAlt', { id: 'APP' })}
                className={styles.thumbnailImage}
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

