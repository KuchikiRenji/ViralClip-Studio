import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { LanguageToggle } from '../../../common';
import { ViewType } from '../../../../types';
import styles from '../LandingPage.module.css';

interface NavbarProps {
  onNavigate: (view: ViewType) => void;
}

const NAV_ITEMS = [
  { id: 'hero', labelKey: 'nav.home' },
  { id: 'process', labelKey: 'nav.features' },
  { id: 'testimonials', labelKey: 'nav.reviews' },
  { id: 'pricing', labelKey: 'nav.pricing' },
] as const;

export const Navbar = ({ onNavigate }: NavbarProps) => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuId = 'landing-mobile-menu';

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
      <div className={styles.navContainer}>
        <img 
          src="/678.svg" 
          alt={t('landing.logoAlt')} 
          className={styles.logo} 
          width={128} 
          height={128} 
          decoding="async" 
        />
        <div className={styles.navLinks}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={styles.navLink}
              type="button"
              aria-label={t(item.labelKey)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
        <div className={styles.navActions}>
          <LanguageToggle />
          <button onClick={() => onNavigate('services')} className={styles.navLink} type="button" aria-label={t('nav.services')}>{t('nav.services')}</button>
          <button onClick={() => onNavigate('login')} className={styles.loginButton} type="button" aria-label={t('auth.logIn')}>{t('auth.logIn')}</button>
          <button onClick={() => onNavigate('home')} className={styles.ctaButton} type="button" aria-label={t('home.tryZitroAI')}>
            <span>{t('home.tryZitroAI')}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.mobileActions}>
          <button onClick={() => onNavigate('home')} className={styles.mobileCtaButton} type="button" aria-label={t('landing.hero.cta')}>
            {t('landing.hero.cta')}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={styles.menuButton}
            aria-label={t('landing.menu.toggle')}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuId}
            type="button"
          >
            {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className={styles.mobileMenu} id={mobileMenuId}>
          <div className={styles.mobileMenuHeader}>
            <img src="/678.svg" alt={t('landing.logoAlt')} className={styles.logo} width={128} height={128} decoding="async" />
            <button onClick={() => setMobileMenuOpen(false)} className={styles.menuButton} aria-label={t('landing.menu.close')} type="button">
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.mobileMenuContainer}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={styles.mobileNavLink}
                type="button"
                aria-label={t(item.labelKey)}
              >
                {t(item.labelKey)}
              </button>
            ))}
            <button
              onClick={() => { onNavigate('services'); setMobileMenuOpen(false); }}
              className={styles.mobileNavLink}
              type="button"
              aria-label={t('nav.services')}
            >
              {t('nav.services')}
            </button>
            <div className={styles.mobileMenuDivider}>
              <LanguageToggle />
              <button onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }} className={styles.mobileNavLink} type="button" aria-label={t('auth.logIn')}>
                {t('auth.logIn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

