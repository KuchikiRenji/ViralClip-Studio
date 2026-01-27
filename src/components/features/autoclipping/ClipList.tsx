import { Play, CheckCircle, Clock, Sparkles, Download, Loader2, Scissors } from 'lucide-react';
import { GeneratedClip } from './clipHelpers';
import { AutoClippingState } from './useAutoClippingState';
import { useTranslation } from '../../../hooks/useTranslation';
interface ClipListProps {
  state: AutoClippingState;
  onPreviewClip: (clip: GeneratedClip) => void;
  onToggleClipSelection: (clipId: string) => void;
  onSelectAllClips: () => void;
  onDownloadSelected: () => void;
  onEditBoundaries?: (clip: GeneratedClip) => void;
  formatTimeDisplay: (seconds: number) => string;
  getScoreColor: (score: number) => string;
}
export const ClipList = ({
  state,
  onPreviewClip,
  onToggleClipSelection,
  onSelectAllClips,
  onDownloadSelected,
  onEditBoundaries,
  formatTimeDisplay,
  getScoreColor,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar order-2 lg:order-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white">{t('autoclipping.generatedClips')}</h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            {t('autoclipping.aiFoundMoments', { count: state.generatedClips.length })}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onSelectAllClips}
            className="px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
          >
            {state.selectedClips.size === state.generatedClips.length ? t('autoclipping.deselect') : t('autoclipping.selectAll')}
          </button>
          <button
            onClick={onDownloadSelected}
            disabled={state.selectedClips.size === 0 || state.isExtracting}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 ${
              state.selectedClips.size > 0 && !state.isExtracting
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
            type="button"
          >
            {state.isExtracting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="hidden sm:inline">{Math.round(state.extractionProgress)}%</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span className="hidden sm:inline">{t('autoclipping.download')}</span> ({state.selectedClips.size})
              </>
            )}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {state.generatedClips.map((clip) => (
          <div
            key={clip.id}
            className={`relative bg-zinc-900/50 rounded-xl border overflow-hidden transition-all ${
              state.selectedClips.has(clip.id)
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : state.previewClip?.id === clip.id
                  ? 'border-purple-500 ring-2 ring-purple-500/20'
                  : 'border-white/5 hover:border-white/10'
            }`}
          >
            <button
              type="button"
              onClick={() => onPreviewClip(clip)}
              className="aspect-video bg-zinc-800 relative w-full"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Play size={24} className="text-white ml-1" />
                </div>
              </div>
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs font-bold ${getScoreColor(clip.score)} bg-black/60`}>
                  <Sparkles size={12} className="inline mr-1" />
                  {clip.score}%
                </div>
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-xs text-white">
                {clip.duration}
              </div>
            </button>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white mb-1 truncate">{clip.title}</h3>
                  {clip.reason && (
                    <p className="text-[10px] sm:text-xs text-zinc-400 mb-2 line-clamp-2 italic leading-snug">
                      "{clip.reason}"
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatTimeDisplay(clip.startTimeSeconds)} - {formatTimeDisplay(clip.endTimeSeconds)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onEditBoundaries && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBoundaries(clip);
                      }}
                      className="w-7 h-7 rounded-full border border-white/20 bg-black/30 hover:bg-zinc-800 hover:border-white/30 flex items-center justify-center transition-colors shrink-0"
                      title={t('autoclipping.editBoundaries')}
                    >
                      <Scissors size={12} className="text-zinc-400 hover:text-white" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleClipSelection(clip.id);
                    }}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                      state.selectedClips.has(clip.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-white/30 bg-black/30 hover:border-white/50'
                    }`}
                  >
                    {state.selectedClips.has(clip.id) && (
                      <CheckCircle size={14} className="text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};