import { Home, FolderOpen, User, Plus, Settings } from 'lucide-react';
import { ViewType } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface MobileBottomNavProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  onCreateClick?: () => void;
}

const NAV_ITEMS: { icon: typeof Home; labelKey: string; view: ViewType }[] = [
  { icon: Home, labelKey: 'nav.home', view: 'home' },
  { icon: FolderOpen, labelKey: 'nav.library', view: 'library' },
  { icon: User, labelKey: 'nav.profile', view: 'profile' },
];

export const MobileBottomNav = ({
  currentView,
  onNavigate,
  onCreateClick,
}: MobileBottomNavProps) => {
  const { t } = useTranslation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.labelKey}
              onClick={() => onNavigate(item.view)}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all touch-target ${
                isActive
                  ? 'text-blue-500'
                  : 'text-zinc-400 active:text-white active:scale-95'
              }`}
              aria-current={isActive ? 'page' : undefined}
              type="button"
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{t(item.labelKey)}</span>
            </button>
          );
        })}

        <button
          onClick={onCreateClick}
          className="flex items-center justify-center w-14 h-14 -mt-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/30 active:scale-95 transition-transform touch-target-lg"
          aria-label="Create new"
          type="button"
        >
          <Plus size={28} className="text-white" strokeWidth={2.5} />
        </button>

        {NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.labelKey}
              onClick={() => onNavigate(item.view)}
              className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all touch-target ${
                isActive
                  ? 'text-blue-500'
                  : 'text-zinc-400 active:text-white active:scale-95'
              }`}
              aria-current={isActive ? 'page' : undefined}
              type="button"
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium mt-1">{t(item.labelKey)}</span>
            </button>
          );
        })}

        <button
          onClick={() => onNavigate('pricing')}
          className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all touch-target ${
            currentView === 'pricing'
              ? 'text-blue-500'
              : 'text-zinc-400 hover:text-white active:scale-95'
          }`}
          type="button"
        >
          <Settings size={24} strokeWidth={currentView === 'pricing' ? 2.5 : 2} />
          <span className="text-[10px] font-medium mt-1">{t('nav.settings')}</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
