import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Scissors,
  Copy,
  Trash2,
  Magnet,
  Minus,
  Plus,
  Undo2,
  Redo2,
} from 'lucide-react';
import { TimelineHeaderProps } from './types';
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, formatTimeMMSSFF } from './constants';
import { useTranslation } from '../../../../hooks/useTranslation';

export const TimelineHeader = ({
  isPlaying,
  currentTime,
  duration: _duration,
  zoom,
  snapEnabled,
  selectedClipCount,
  frameRate,
  canUndo,
  canRedo,
  onPlayPause,
  onZoomChange,
  onSnapToggle,
  onSplit,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onAddVideoTrack: _onAddVideoTrack,
  onAddAudioTrack: _onAddAudioTrack,
}: TimelineHeaderProps) => {
  const { t } = useTranslation();
  const noop = () => {};

  return (
    <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-white/5 bg-zinc-900/50 gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1 mr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 sm:p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95 touch-target-sm"
            type="button"
            title={t('editVideo.undo')}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 sm:p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95 touch-target-sm"
            type="button"
            title={t('editVideo.redo')}
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-zinc-700" />

        <button
          onClick={onPlayPause}
          className="p-2.5 sm:p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors active:scale-95 touch-target"
          type="button"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} className="sm:hidden" /> : <Play size={18} className="sm:hidden" />}
          {isPlaying ? <Pause size={16} className="hidden sm:block" /> : <Play size={16} className="hidden sm:block" />}
        </button>

        <button
          onClick={noop}
          className="p-2.5 sm:p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors active:scale-95 touch-target"
          type="button"
          title={t('common.skipBackward')}
        >
          <SkipBack size={16} className="sm:hidden" />
          <SkipBack size={14} className="hidden sm:block" />
        </button>
        <button
          onClick={noop}
          className="p-2.5 sm:p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors active:scale-95 touch-target"
          type="button"
          title={t('common.skipForward')}
        >
          <SkipForward size={16} className="sm:hidden" />
          <SkipForward size={14} className="hidden sm:block" />
        </button>

        <div className="px-2 sm:px-3 py-1.5 bg-zinc-800 rounded-lg text-[10px] sm:text-xs text-white font-mono min-w-[70px] sm:min-w-[90px] text-center">
          {formatTimeMMSSFF(currentTime, frameRate)}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button
          onClick={onSplit}
          disabled={selectedClipCount !== 1}
          className="p-2.5 sm:p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95 touch-target"
          type="button"
          title={`${t('timeline.split')} (Ctrl+Shift+S)`}
        >
          <Scissors size={16} className="sm:hidden" />
          <Scissors size={14} className="hidden sm:block" />
        </button>
        <button
          onClick={onDuplicate}
          disabled={selectedClipCount === 0}
          className="hidden sm:flex p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95 touch-target-sm"
          type="button"
          title={`${t('timeline.duplicate')} (Ctrl+D)`}
        >
          <Copy size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={selectedClipCount === 0}
          className="p-2.5 sm:p-2 rounded-lg bg-zinc-800 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors active:scale-95 touch-target"
          type="button"
          title={`${t('timeline.delete')} (Del)`}
        >
          <Trash2 size={16} className="sm:hidden" />
          <Trash2 size={14} className="hidden sm:block" />
        </button>

        <div className="hidden sm:block w-px h-6 bg-zinc-700 mx-1" />

        <button
          onClick={onSnapToggle}
          className={`p-2.5 sm:p-2 rounded-lg transition-colors active:scale-95 touch-target ${
            snapEnabled
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
          }`}
          type="button"
          title={`${t('timeline.snap')} (S)`}
        >
          <Magnet size={16} className="sm:hidden" />
          <Magnet size={14} className="hidden sm:block" />
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {selectedClipCount > 0 && (
          <span className="hidden sm:inline text-[10px] text-zinc-400 mr-2">
            {selectedClipCount === 1
              ? '1 clip'
              : t('timeline.multipleSelected', { count: selectedClipCount })}
          </span>
        )}

        <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => onZoomChange(Math.max(ZOOM_MIN, zoom - ZOOM_STEP))}
            className="p-2 sm:p-1.5 rounded text-zinc-400 hover:text-white transition-colors active:scale-95 touch-target-sm"
            type="button"
            title="Zoom out"
          >
            <Minus size={14} className="sm:hidden" />
            <Minus size={12} className="hidden sm:block" />
          </button>

          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-16 sm:w-20 h-2 sm:h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-manipulation"
          />

          <button
            onClick={() => onZoomChange(Math.min(ZOOM_MAX, zoom + ZOOM_STEP))}
            className="p-2 sm:p-1.5 rounded text-zinc-400 hover:text-white transition-colors active:scale-95 touch-target-sm"
            type="button"
            title="Zoom in"
          >
            <Plus size={14} className="sm:hidden" />
            <Plus size={12} className="hidden sm:block" />
          </button>

          <span className="hidden sm:inline text-[10px] text-zinc-400 w-12 text-center tabular-nums">
            {zoom}px/s
          </span>
        </div>
      </div>
    </div>
  );
};
