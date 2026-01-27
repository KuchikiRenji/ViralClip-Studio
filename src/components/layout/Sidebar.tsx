import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { Home, FolderOpen, User, ChevronRight, HelpCircle, Gift, Globe, Sparkles } from 'lucide-react';
import { SidebarProps, ViewType } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useCredits } from '../../hooks/useCredits';
import { useSubscription } from '../../hooks/useSubscription';
import { DESIGN_TOKENS } from '../../constants';
import { NavItem } from './NavItem';
import { UsageBar } from './UsageBar';
import { DiscordIcon } from '../shared/SocialIcons';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { icon: Home, labelKey: 'nav.home', view: 'home' as const },
  { icon: Sparkles, labelKey: 'nav.services', view: 'services' as const },
  { icon: FolderOpen, labelKey: 'nav.library', view: 'library' as const },
  { icon: User, labelKey: 'nav.profile', view: 'profile' as const },
];

const DISCORD_INVITE_URL = 'https://discord.gg/zitroai';

const EDITOR_VIEWS: ViewType[] = [
  'edit-video',
  'video-ranking',
  'text-story',
  'story-video',
  'split-screen',
  'auto-clipping',
  'voice-clone',
  'create-story',
  'create-image',
  'video-transcriber',
  'quick-subtitles',
  'reddit-video',
  'background-remover',
  'vocal-remover',
  'mp3-converter',
  'video-compressor',
  'audio-balancer',
  'speech-enhancer',
  'veo3-video',
  'video-downloader',
  'download-instagram',
  'download-tiktok',
  'download-youtube',
];

const { width: sidebarWidth } = DESIGN_TOKENS.layout.sidebar;

const SAFE_INSET_PADDING = DESIGN_TOKENS.spacing.xs;
const HEADER_TOP_PADDING = DESIGN_TOKENS.spacing.lg;
const FOOTER_BOTTOM_PADDING = DESIGN_TOKENS.spacing.md;

const resetBodyStyles = () => {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
};

const ZitroLogo = () => (
  <div className={styles.logo}>
    <img src="/678.svg" alt="" width="56" height="56" className={styles.logoMark} aria-hidden="true" decoding="async" />
  </div>
);

export const Sidebar = ({ currentView, onNavigate }: SidebarProps) => {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const { balance } = useCredits();
  const { plan } = useSubscription();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const isEditorView = EDITOR_VIEWS.includes(currentView);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Logic to derive usage from credits balance and plan
  const maxCredits = plan?.credits_monthly || 100;
  
  // These represent available usage based on total credits
  // In a real app, you might want to fetch these from a 'user_stats' view or similar
  const usageStats = {
    clips: { current: Math.floor(balance / 5), max: Math.floor(maxCredits / 5) }, // 5 credits per clip
    voiceover: { current: Math.floor(balance / 2), max: Math.floor(maxCredits / 2) }, // 2 credits per minute
    images: { current: Math.floor(balance / 1), max: Math.floor(maxCredits / 1) }, // 1 credit per image
    exports: { current: Math.floor(balance / 10), max: Math.floor(maxCredits / 10) } // 10 credits per minute
  };
  const sidebarVars = {
    '--sidebar-width': sidebarWidth,
    '--sidebar-safe-inset': SAFE_INSET_PADDING,
    '--sidebar-header-top': HEADER_TOP_PADDING,
    '--sidebar-footer-bottom': FOOTER_BOTTOM_PADDING,
    '--sidebar-offset': DESIGN_TOKENS.layout.sidebar.offset,
  } as CSSProperties;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentView]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      resetBodyStyles();
      return;
    }

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        return;
      }
      if (e.key !== 'Tab' || !sidebarRef.current) return;

      const focusableElements = sidebarRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      resetBodyStyles();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {!isEditorView && !isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={styles.mobileOpenButton}
          style={sidebarVars}
          aria-label="Open navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="sidebar-nav"
          type="button"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}

      <div
        className={`${styles.backdrop} ${isMobileMenuOpen ? styles.backdropOpen : styles.backdropClosed}`}
        onClick={(e) => e.target === e.currentTarget && closeMobileMenu()}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        id="sidebar-nav"
        role="navigation"
        aria-label="Main navigation"
        className={`${styles.aside} ${styles.root} ${isMobileMenuOpen ? styles.asideOpen : styles.asideClosed}`}
        style={sidebarVars}
      >
        <div className={styles.asideContent}>
          <header className={styles.header}>
            <button
              onClick={() => {
                onNavigate('home');
                closeMobileMenu();
              }}
              className={styles.homeButton}
              aria-label="Go to home"
              type="button"
            >
              <ZitroLogo />
            </button>
          </header>

          <nav className={styles.nav} aria-label="Primary navigation">
            {NAV_ITEMS.map(({ icon, labelKey, view }) => (
              <NavItem
                key={view}
                icon={icon}
                labelKey={labelKey}
                view={view}
                isActive={currentView === view}
                onClick={() => {
                  onNavigate(view);
                  closeMobileMenu();
                }}
              />
            ))}
          </nav>

          <section className={styles.usageSection} aria-label="Usage statistics">
            <h3 className={styles.usageTitle}>{t('sidebar.usageLeft')}</h3>
            <div className="space-y-1">
              <UsageBar label={t('sidebar.aiClips')} current={usageStats.clips.current} max={usageStats.clips.max} />
              <UsageBar label={t('sidebar.voiceoverMins')} current={usageStats.voiceover.current} max={usageStats.voiceover.max} />
              <UsageBar label={t('sidebar.aiImages')} current={usageStats.images.current} max={usageStats.images.max} />
              <UsageBar label={t('sidebar.exportMins')} current={usageStats.exports.current} max={usageStats.exports.max} />
            </div>
            <button
              onClick={() => {
                onNavigate('pricing');
                closeMobileMenu();
              }}
              className={styles.upgradeButton}
              type="button"
            >
              {t('sidebar.upgrade')}
            </button>
          </section>

          <footer className={styles.footer} aria-label="Quick actions">
            <button
              onClick={() => changeLanguage(currentLanguage === 'fr' ? 'en' : 'fr')}
              className={styles.footerButton}
              type="button"
              aria-label={`Switch to ${currentLanguage === 'fr' ? 'English' : 'Français'}`}
            >
              <Globe size={16} aria-hidden="true" />
              <span className={styles.footerButtonText}>{currentLanguage === 'fr' ? 'EN' : 'FR'}</span>
            </button>

            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerButton}
            >
              <HelpCircle size={16} aria-hidden="true" />
              <span className={styles.footerButtonText}>{t('sidebar.support')}</span>
            </a>

            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.footerButton} ${styles.footerAccent}`}
              aria-label="Join Discord community"
            >
              <DiscordIcon size={18} className={styles.discordIcon} />
              <span className={styles.footerButtonText}>Discord</span>
            </a>

            <button
              className={`${styles.footerButton} ${styles.footerAccent}`}
              type="button"
              aria-label={t('sidebar.affiliateProgram')}
            >
              <Gift size={18} aria-hidden="true" />
              <span className={styles.footerButtonText}>{t('sidebar.affiliateProgram')}</span>
            </button>
          </footer>
        </div>
      </aside>
    </>
  );
};
