import { Check } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { RedditVideoState } from '../types';
import { SUBTITLE_STYLES } from '../constants';
import sharedStyles from '../RedditVideo.module.css';

interface StyleTabProps {
  state: RedditVideoState;
  updateState: <K extends keyof RedditVideoState>(key: K, value: RedditVideoState[K]) => void;
}

export const StyleTab = ({
  state,
  updateState,
}: StyleTabProps) => {
  const { t } = useTranslation();

  const handleStyleSelect = (styleId: string) => {
    const selectedStyle = SUBTITLE_STYLES.find(s => s.id === styleId);
    if (selectedStyle) {
      updateState('subtitleStyle', selectedStyle);
      updateState('selectedStyle', styleId);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${sharedStyles.panel} p-4 sm:p-6`}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t('redditVideo.style.presets')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateState('subtitleDisplayMode', 'oneWord')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors touch-target ${
                state.subtitleDisplayMode === 'oneWord'
                  ? 'bg-zinc-800 border-white/20 text-white'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
              }`}
              type="button"
            >
              One Word
            </button>
            <button
              onClick={() => updateState('subtitleDisplayMode', 'lines')}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors touch-target ${
                state.subtitleDisplayMode === 'lines'
                  ? 'bg-zinc-800 border-white/20 text-white'
                  : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
              }`}
              type="button"
            >
              Lines
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {SUBTITLE_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              className={`relative p-4 rounded-xl border transition-all touch-target-lg ${
                state.selectedStyle === style.id
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-zinc-800/50 border-white/10 hover:border-white/20'
              }`}
              type="button"
            >
              {state.selectedStyle === style.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <div
                className="text-lg font-bold mb-2"
                style={{
                  fontFamily: style.fontFamily,
                  color: style.color,
                }}
              >
                {style.name}
              </div>
              <div className="text-xs text-zinc-500 capitalize">
                {style.position}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`${sharedStyles.panel} p-4 sm:p-6`}>
        <h2 className="text-lg font-semibold text-white mb-4">
          {t('redditVideo.style.fontSize')}
        </h2>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="16"
            max="48"
            value={state.subtitleStyle.fontSize}
            onChange={(e) => updateState('subtitleStyle', {
              ...state.subtitleStyle,
              fontSize: parseInt(e.target.value),
            })}
            className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-white font-mono w-12 text-center">
            {state.subtitleStyle.fontSize}px
          </span>
        </div>
      </div>
    </div>
  );
};
