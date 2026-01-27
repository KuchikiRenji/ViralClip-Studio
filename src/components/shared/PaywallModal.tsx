import React from 'react';
import { X, Check, Sparkles, Zap, Shield, Star, Crown, User } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { usePaywallContext } from '../../contexts/PaywallContext';
import { useAuth } from '../../contexts/AuthContext';
import styles from './PaywallModal.module.css';

export const PaywallModal: React.FC = () => {
  const { t } = useTranslation();
  const { isOpen, hidePaywall, featureName, isForced } = usePaywallContext();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleAction = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('app:navigate', { 
        detail: { view: 'login', search: '?reason=paywall' } 
      }));
    } else {
      window.dispatchEvent(new CustomEvent('app:navigate', { 
        detail: { view: 'pricing', search: '?reason=paywall' } 
      }));
    }
  };

  const getFeatureBenefits = () => {
    const defaultFeatures = [
      { icon: <Zap size={18} className="text-yellow-400" />, text: t('paywall.feature.unlimited') },
      { icon: <Sparkles size={18} className="text-blue-400" />, text: t('paywall.feature.hd') },
      { icon: <Shield size={18} className="text-emerald-400" />, text: t('paywall.feature.watermark') },
      { icon: <Star size={18} className="text-purple-400" />, text: t('paywall.feature.priority') },
    ];

    if (!featureName) return defaultFeatures;

    const featureKeyMap: Record<string, string> = {
      'Quick Subtitles': 'quickSubtitles',
      'Background Remover': 'backgroundRemover',
      'Vocal Remover': 'vocalRemover',
      'MP3 Converter': 'mp3Converter',
      'Video Compressor': 'videoCompressor',
      'Audio Balancer': 'audioBalancer',
      'Speech Enhancer': 'speechEnhancer',
      'AI Story': 'aiStory',
      'Split Screen': 'splitScreen',
      'Export': 'export',
      'Transcriber': 'transcriber',
      'Text Story': 'textStory',
      'Voice Clone': 'voiceClone',
      'Auto Clipping': 'autoClipping',
      'Video Ranking': 'videoRanking',
      'Story Video': 'storyVideo',
      'Reddit Video': 'redditVideo',
      'Downloaders': 'downloaders',
      'AI Video': 'aiVideo',
      'AI Images': 'aiImages',
      'Voiceover': 'voiceover',
    };

    const key = featureKeyMap[featureName];
    if (!key) return defaultFeatures;

    return [
      { icon: <Sparkles size={18} className="text-blue-400" />, text: t(`paywall.feature.${key}.benefit`) },
      ...defaultFeatures.slice(0, 3)
    ];
  };

  const features = getFeatureBenefits();

  return (
    <div className={styles.overlay} onClick={isForced ? undefined : hidePaywall}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!isForced && (
          <button className={styles.closeButton} onClick={hidePaywall}>
            <X size={24} />
          </button>
        )}

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <Crown size={40} className={styles.crownIcon} />
            </div>
            <h2 className={styles.title}>
              {featureName ? t('paywall.titleWithFeature', { feature: featureName }) : t('paywall.title')}
            </h2>
            <p className={styles.subtitle}>{t('paywall.subtitle')}</p>
          </div>

          <div className={styles.featuresList}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <span className={styles.featureText}>{feature.text}</span>
                <Check size={16} className={styles.checkIcon} />
              </div>
            ))}
          </div>

          {!user ? (
            <div className={styles.authPrompt}>
              <p className="text-sm text-zinc-400 mb-4">{t('paywall.loginRequired')}</p>
              <button className={styles.upgradeButton} onClick={handleAction}>
                <User size={20} />
                <span>{t('auth.logIn')}</span>
              </button>
            </div>
          ) : (
            <>
              <div className={styles.pricingPreview}>
                <div className={styles.priceCard}>
                  <span className={styles.priceLabel}>{t('paywall.startingAt')}</span>
                  <div className={styles.priceValue}>
                    <span className={styles.currency}>CA$</span>
                    <span className={styles.amount}>24.99</span>
                    <span className={styles.period}>/{t('common.month')}</span>
                  </div>
                </div>
              </div>

              <button className={styles.upgradeButton} onClick={handleAction}>
                <Sparkles size={20} />
                <span>{t('paywall.upgradeNow')}</span>
              </button>
            </>
          )}

          <p className={styles.footerNote}>
            {t('paywall.cancelAnytime')}
          </p>
        </div>
      </div>
    </div>
  );
};

