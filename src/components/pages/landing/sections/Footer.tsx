import { useTranslation } from '../../../../hooks/useTranslation';
import styles from '../LandingPage.module.css';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <img src="/678.svg" alt={t('landing.logoAlt')} className={styles.footerLogo} width={224} height={224} decoding="async" />
        <div className={styles.footerLinks}>
          <button className={styles.footerLink} type="button" aria-label={t('landing.footer.terms')}>{t('landing.footer.terms')}</button>
          <span className={styles.footerDot} aria-hidden="true">•</span>
          <button className={styles.footerLink} type="button" aria-label={t('landing.footer.privacy')}>{t('landing.footer.privacy')}</button>
          <span className={styles.footerDot} aria-hidden="true">•</span>
          <button className={styles.footerLink} type="button" aria-label={t('landing.footer.support')}>{t('landing.footer.support')}</button>
        </div>
        <div className={styles.footerCommunity}>{t('landing.footer.community')}</div>
        <div className={styles.footerDivider} />
        <div className={styles.footerCopyright}>{t('landing.footer.copyright')}</div>
      </div>
      <div className={styles.footerGlow} />
    </footer>
  );
};

