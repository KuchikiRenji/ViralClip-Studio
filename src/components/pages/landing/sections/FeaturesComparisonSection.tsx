import { Check } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import styles from '../LandingPage.module.css';

export const FeaturesComparisonSection = () => {
  const { t } = useTranslation();

  const workflowsFeatures = [
    { key: 'workflowCredits', beginner: '40', pro: '120', premium: '180' },
    { key: 'fakeTextsVideo', beginner: false, pro: true, premium: false },
    { key: 'redditVideo', beginner: false, pro: true, premium: false },
    { key: 'splitScreenVideo', beginner: false, pro: true, premium: false },
    { key: 'quickSubtitlesVideo', beginner: false, pro: true, premium: false },
  ];

  const toolsFeatures = [
    { key: 'aiVoiceovers', beginner: '30', pro: '120', premium: '180' },
    { key: 'aiImages', beginner: '100', pro: '300', premium: '500' },
    { key: 'veo3Credits', beginner: 'requiresTopup', pro: 'requiresTopup', premium: 'requiresTopup' },
    { key: 'vocalInstrumentalRemover', beginner: false, pro: true, premium: false },
    { key: 'aiBrainstorm', beginner: false, pro: true, premium: false },
    { key: 'youtubeDownloader', beginner: false, pro: true, premium: false },
    { key: 'tiktokDownloader', beginner: false, pro: true, premium: false },
  ];

  const renderFeatureValue = (feature: typeof workflowsFeatures[0] | typeof toolsFeatures[0], plan: 'beginner' | 'pro' | 'premium') => {
    const value = feature[plan];
    
    if (value === true) {
      // Show checkmark - solid green for Pro, outline for others
      const isPro = plan === 'pro';
      return (
        <div className={styles.featureCheckmark}>
          {isPro ? (
            <Check size={20} className={styles.featureCheckmarkSolid} />
          ) : (
            <div className={styles.featureCheckmarkOutline}>
              <Check size={16} />
            </div>
          )}
        </div>
      );
    }
    
    if (value === false) {
      // Show empty circle outline for not included
      return (
        <div className={styles.featureCheckmark}>
          <div className={styles.featureCheckmarkEmpty} />
        </div>
      );
    }
    
    if (typeof value === 'string') {
      if (value === 'requiresTopup') {
        const topupText = t('landing.features.requiresTopup');
        return <span className={styles.featureText}>{topupText !== 'landing.features.requiresTopup' ? topupText : 'Requires topup purchase'}</span>;
      }
      // For numeric values like '40', '120', '180', '30', '100', '300', '500'
      // Check if it's a number string and format accordingly
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        // Format based on feature type
        if (feature.key === 'workflowCredits') {
          return <span className={styles.featureText}>{value} credits</span>;
        } else if (feature.key === 'aiVoiceovers') {
          return <span className={styles.featureText}>{value} minutes</span>;
        } else if (feature.key === 'aiImages') {
          return <span className={styles.featureText}>{value} credits</span>;
        }
        return <span className={styles.featureText}>{value}</span>;
      }
      // Try to get translation, but fallback to value if translation returns the key
      const translated = t(`landing.features.${feature.key}.${plan}`);
      return <span className={styles.featureText}>{translated !== `landing.features.${feature.key}.${plan}` ? translated : value}</span>;
    }
    
    return null;
  };

  return (
    <div className={styles.featuresComparisonContainer}>
      {/* Crayo Workflows Section */}
      <div className={styles.featuresTable}>
        <div className={styles.featuresTableHeader}>
          <div className={styles.featuresTableHeaderCell}>{t('landing.features.workflows.title')}</div>
          <div className={styles.featuresTableHeaderCell}>{t('landing.pricing.names.beginner')}</div>
          <div className={`${styles.featuresTableHeaderCell} ${styles.featuresTableHeaderCellPopular}`}>
            {t('landing.pricing.names.pro')}
          </div>
          <div className={styles.featuresTableHeaderCell}>{t('landing.pricing.names.premium')}</div>
        </div>
        <div className={styles.featuresTableBody}>
          {workflowsFeatures.map((feature, index) => (
            <div key={feature.key} className={styles.featuresTableRow}>
              <div className={styles.featuresTableRowLabel}>{t(`landing.features.${feature.key}`)}</div>
              <div className={styles.featuresTableRowCell}>{renderFeatureValue(feature, 'beginner')}</div>
              <div className={`${styles.featuresTableRowCell} ${styles.featuresTableRowCellPopular}`}>
                {renderFeatureValue(feature, 'pro')}
              </div>
              <div className={styles.featuresTableRowCell}>{renderFeatureValue(feature, 'premium')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Crayo Tools Section */}
      <div className={styles.featuresTable}>
        <div className={styles.featuresTableHeader}>
          <div className={styles.featuresTableHeaderCell}>{t('landing.features.tools.title')}</div>
          <div className={styles.featuresTableHeaderCell}>{t('landing.pricing.names.beginner')}</div>
          <div className={`${styles.featuresTableHeaderCell} ${styles.featuresTableHeaderCellPopular}`}>
            {t('landing.pricing.names.pro')}
          </div>
          <div className={styles.featuresTableHeaderCell}>{t('landing.pricing.names.premium')}</div>
        </div>
        <div className={styles.featuresTableBody}>
          {toolsFeatures.map((feature, index) => (
            <div key={feature.key} className={styles.featuresTableRow}>
              <div className={styles.featuresTableRowLabel}>{t(`landing.features.${feature.key}`)}</div>
              <div className={styles.featuresTableRowCell}>{renderFeatureValue(feature, 'beginner')}</div>
              <div className={`${styles.featuresTableRowCell} ${styles.featuresTableRowCellPopular}`}>
                {renderFeatureValue(feature, 'pro')}
              </div>
              <div className={styles.featuresTableRowCell}>{renderFeatureValue(feature, 'premium')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

