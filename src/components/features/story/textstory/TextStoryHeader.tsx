import { ArrowLeft, Clock, ChevronDown, X } from 'lucide-react';
import { RecentStory } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
interface TextStoryHeaderProps {
  showRecentDropdown: boolean;
  onBack: () => void;
  onToggleRecentDropdown: () => void;
  onLoadRecentStory: (story: RecentStory) => void;
  onViewAllStories: () => void;
  recentStories: RecentStory[];
}
export const TextStoryHeader = ({
  showRecentDropdown,
  onBack,
  onToggleRecentDropdown,
  onLoadRecentStory,
  onViewAllStories,
  recentStories,
}) => {
  const { t } = useTranslation();
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 safe-area-inset-top">
      <div className="flex items-center gap-3 sm:gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold truncate">{t('textStory.title')}</h1>
      </div>
      <div className="relative">
        <button 
          onClick={onToggleRecentDropdown}
          className={`hidden sm:flex px-4 py-2 border rounded-lg text-sm font-medium items-center gap-2 transition-colors touch-target ${
            showRecentDropdown 
              ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
              : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
          }`}
          type="button"
        >
          <Clock size={14} />
          {t('textStory.viewRecent')}
          <ChevronDown size={14} className={`transition-transform ${showRecentDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showRecentDropdown && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium text-white">{t('textStory.recentStories')}</span>
              <button 
                onClick={onToggleRecentDropdown}
                className="text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            {recentStories.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                {recentStories.map(story => (
                  <button
                    key={story.id}
                    onClick={() => onLoadRecentStory(story)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
                    type="button"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{story.title}</div>
                      <div className="text-xs text-zinc-500">{story.template} · {story.createdAt}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Clock size={32} className="mx-auto text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500">{t('textStory.noRecentStories')}</p>
              </div>
            )}
            <div className="px-4 py-3 border-t border-zinc-800">
              <button 
                onClick={onViewAllStories}
                className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                type="button"
              >
                {t('textStory.viewAllLibrary')}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};