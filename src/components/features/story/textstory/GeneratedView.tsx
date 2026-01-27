import { RefObject } from 'react';
import { Check, Download, Loader2 } from 'lucide-react';
import { TextStoryPreview } from './TextStoryPreview';
import { TextStoryState } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
interface GeneratedViewProps {
  state: TextStoryState;
  videoRef: RefObject<HTMLVideoElement>;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onVideoEnded: () => void;
  onVideoError?: () => void;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onExportVideo: () => void;
  onDownloadExported: () => void;
  onResetStory: () => void;
  formatTime: (seconds: number) => string;
}
export const GeneratedView = ({
  state,
  videoRef,
  onTimeUpdate,
  onLoadedMetadata,
  onVideoEnded,
  onVideoError,
  onSeek,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  onExportVideo,
  onDownloadExported,
  onResetStory,
  formatTime,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-400 sm:hidden" />
          <Check size={40} className="text-emerald-400 hidden sm:block" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('textStory.generated')}</h1>
        <p className="text-zinc-400 text-sm sm:text-base">{t('textStory.generatedSubtitle')}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start w-full max-w-xl sm:max-w-none justify-center">
        <TextStoryPreview
          state={state}
          videoRef={videoRef}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onVideoEnded={onVideoEnded}
          onVideoError={onVideoError}
          onSeek={onSeek}
          onTogglePlay={onTogglePlay}
          onToggleMute={onToggleMute}
          onToggleFullscreen={onToggleFullscreen}
          formatTime={formatTime}
        />
        <div className="space-y-4 w-full sm:w-56">
          {state.isExporting ? (
            <div className="w-full py-3 sm:py-2.5 bg-zinc-700 text-white text-sm sm:text-base font-bold rounded-xl flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin sm:hidden" />
              <Loader2 size={16} className="animate-spin hidden sm:block" />
              {t('textStory.exporting')} {Math.round(state.exportProgress)}%
            </div>
          ) : state.exportedBlob ? (
            <button 
              onClick={onDownloadExported}
              className="w-full py-3 sm:py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm sm:text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors touch-target active:scale-95"
              type="button"
            >
              <Download size={18} className="sm:hidden" />
              <Download size={16} className="hidden sm:block" />
              {t('textStory.downloadVideo')}
            </button>
          ) : (
            <button 
              onClick={onExportVideo}
              className="w-full py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors touch-target active:scale-95"
              type="button"
            >
              <Download size={18} className="sm:hidden" />
              <Download size={16} className="hidden sm:block" />
              {t('textStory.exportVideo')}
            </button>
          )}
          <button 
            onClick={onResetStory}
            className="w-full py-3 sm:py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm sm:text-base font-bold rounded-xl transition-colors touch-target active:scale-95"
            type="button"
          >
            {t('textStory.createNew')}
          </button>
        </div>
      </div>
    </div>
  );
};







