import { useTranslation } from '../../../../hooks/useTranslation';
import { TESTIMONIAL_AUTHORS, duplicateArray } from '../../../../constants/landing';
import styles from '../LandingPage.module.css';

const testimonialSplitIndex = Math.ceil(TESTIMONIAL_AUTHORS.length / 2);
const FIRST_TESTIMONIAL_ROW = duplicateArray(TESTIMONIAL_AUTHORS.slice(0, testimonialSplitIndex));
const SECOND_TESTIMONIAL_ROW = duplicateArray(TESTIMONIAL_AUTHORS.slice(testimonialSplitIndex));

export const TestimonialsSection = () => {
  const { t } = useTranslation();

  return (
    <section id="testimonials" className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleWhite}>{t('landing.testimonials.title1')}</span>
          <br />
          <span className={styles.sectionTitleGradient}>{t('landing.testimonials.title2')}</span>
        </h2>
        <p className={styles.sectionSubtitle}>{t('landing.testimonials.subtitle')}</p>
        <div className={styles.testimonialsWrapper}>
          <div className={`${styles.testimonialsFade} ${styles.testimonialsFadeLeft}`} />
          <div className={`${styles.testimonialsFade} ${styles.testimonialsFadeRight}`} />
          <div className={styles.testimonialsRows}>
            <div className={`${styles.testimonialRow} ${styles.testimonialRowLeft}`}>
              {FIRST_TESTIMONIAL_ROW.map((author, idx) => (
                <article key={`${author.key}-${idx}`} className={styles.testimonialCard} aria-label={`Testimonial from ${author.name}`}>
                  <div className={styles.testimonialQuote} aria-hidden="true"><span className={styles.testimonialQuoteText}>"</span></div>
                  <blockquote className={styles.testimonialText}>
                    {t(`testimonials.${author.key}`)}
                  </blockquote>
                  <footer className={styles.testimonialAuthor}>
                    <img
                      src={author.avatar}
                      alt={`${author.name} avatar`}
                      className={styles.testimonialAvatar}
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <p className={styles.testimonialName}>{author.name}</p>
                      <p className={styles.testimonialRole}>{t('landing.creator')}</p>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
            <div className={`${styles.testimonialRow} ${styles.testimonialRowRight}`}>
              {SECOND_TESTIMONIAL_ROW.map((author, idx) => (
                <article key={`${author.key}-${idx}`} className={styles.testimonialCard} aria-label={`Testimonial from ${author.name}`}>
                  <div className={styles.testimonialQuote} aria-hidden="true"><span className={styles.testimonialQuoteText}>"</span></div>
                  <blockquote className={styles.testimonialText}>
                    {t(`testimonials.${author.key}`)}
                  </blockquote>
                  <footer className={styles.testimonialAuthor}>
                    <img
                      src={author.avatar}
                      alt={`${author.name} avatar`}
                      className={styles.testimonialAvatar}
                      width={40}
                      height={40}
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <p className={styles.testimonialName}>{author.name}</p>
                      <p className={styles.testimonialRole}>{t('landing.creator')}</p>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

