import { Play, Pause } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

interface EditorControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBackward: () => void;
  onSkipForward: () => void;
}

export const EditorControls = ({ isPlaying, onPlayPause, onSkipBackward, onSkipForward }: EditorControlsProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 mt-3 sm:mt-4">
      <button
        onClick={onSkipBackward}
        className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-target active:scale-95"
        title={t('common.skipBackward')}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
          <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
        </svg>
      </button>
      <button
        onClick={onPlayPause}
        className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 rounded-full flex items-center justify-center text-black transition-colors touch-target active:scale-95"
        type="button"
      >
        {isPlaying ? <Pause size={18} className="sm:hidden" /> : <Play size={18} className="sm:hidden ml-0.5" />}
        {isPlaying ? <Pause size={20} className="hidden sm:block" /> : <Play size={20} className="hidden sm:block ml-0.5" />}
      </button>
      <button
        onClick={onSkipForward}
        className="p-2 hover:bg-white/10 active:bg-white/20 rounded-lg transition-colors touch-target active:scale-95"
        title={t('common.skipForward')}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
          <path d="M13 7l5 5-5 5M6 7l5 5-5 5" />
        </svg>
      </button>
    </div>
  );
};