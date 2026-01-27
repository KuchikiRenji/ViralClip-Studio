import { Globe } from 'lucide-react';
import i18n from '../../i18n';
import { useTranslation } from '../../hooks/useTranslation';

export const LanguageToggle = () => {
  const { t } = useTranslation();

  const toggleLanguage = () => {
    const nextLanguage = i18n.language === 'en' ? 'fr' : 'en';
    const nextTranslator = i18n.getFixedT(nextLanguage);
    i18n.changeLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.title = nextTranslator('seo.title');
    localStorage.setItem('preferred-language', nextLanguage);
  };

  const isFrench = i18n.language === 'fr';
  const accessibilityLabel = isFrench ? t('language.toggle.switchToEnglish') : t('language.toggle.switchToFrench');
  const badgeLabel = isFrench ? t('language.code.short.fr') : t('language.code.short.en');
  const badgeFlag = isFrench ? t('language.flag.fr') : t('language.flag.en');

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 group active:scale-95"
      aria-label={accessibilityLabel}
      title={accessibilityLabel}
      type="button"
    >
      <Globe size={16} className="text-white/70 group-hover:text-white transition-colors" />
      <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
        {badgeLabel}
      </span>
      <div className="w-6 h-4 rounded-sm border border-white/20 flex items-center justify-center overflow-hidden bg-white/5">
        <span className="text-[10px] font-bold text-white/80 leading-none">
          {badgeFlag}
        </span>
      </div>
    </button>
  );
};
