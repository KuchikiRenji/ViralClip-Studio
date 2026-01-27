import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import styles from '../LandingPage.module.css';

export const FaqSection = () => {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionTitleWhite}>{t('landing.faq.questions')}</span>
          <br />
          <span className={styles.sectionTitleGradient}>{t('landing.faq.frequentlyAsked')}</span>
        </h2>
        <p className={styles.sectionSubtitle}>{t('landing.faq.subtitle')}</p>
        <div className={styles.faqContainer}>
          {[1, 2, 3, 4, 5].map((index) => {
            const isOpen = openFaq === index;
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;
            return (
              <div key={index} className={styles.faqItem}>
                <button 
                  onClick={() => setOpenFaq(isOpen ? null : index)} 
                  className={styles.faqQuestion}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  id={questionId}
                  type="button"
                >
                  <span className={styles.faqQuestionText}>{t(`faq.q${index}.question`)}</span>
                  <div className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`} aria-hidden="true">
                    <ChevronDown size={16} className={styles.faqChevron} />
                  </div>
                </button>
                <div 
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : styles.faqAnswerClosed}`}
                >
                  <div className={styles.faqAnswerContent}>{t(`faq.q${index}.answer`)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

