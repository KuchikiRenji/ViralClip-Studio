import { Play, Pause, SkipBack, SkipForward, Undo, Redo, Trash2, Plus, Layers, ChevronDown, ChevronUp, Scissors, Copy } from 'lucide-react';
import { TimelineClip } from './EditorTimelinePanel';
interface TimelineControlsProps {
  showTimeline: boolean;
  showTracks: boolean;
  currentTime: number;
  isPlaying: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedClip: TimelineClip | undefined;
  duration: number;
  onToggleTimeline: () => void;
  onToggleTracks: () => void;
  onSetCurrentTime: (time: number) => void;
  onSetIsPlaying: (playing: boolean) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSplitClip: () => void;
  onDuplicateClip: () => void;
  onDeleteClip: () => void;
  onAddSlide: () => void;
  formatTime: (seconds: number) => string;
}
export const TimelineControls = ({
  showTimeline,
  showTracks,
  currentTime,
  isPlaying,
  canUndo,
  canRedo,
  selectedClip,
  duration,
  onToggleTimeline,
  onToggleTracks,
  onSetCurrentTime,
  onSetIsPlaying,
  onUndo,
  onRedo,
  onSplitClip,
  onDuplicateClip,
  onDeleteClip,
  onAddSlide,
  formatTime,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-4 py-1.5 border-b border-white/5">
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onToggleTimeline}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          type="button"
        >
          {showTracks ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          <span className="hidden xs:inline">Timeline</span>
        </button>
        <button
          onClick={onToggleTracks}
          className="p-1.5 sm:p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white touch-target transition-colors"
          title="Toggle tracks"
          type="button"
        >
          <Layers size={14} className="sm:hidden" />
          <Layers size={16} className="hidden sm:block" />
        </button>
      </div>
      <div className="flex items-center gap-1 sm:gap-3">
        <span className="text-xs sm:text-sm font-mono text-zinc-400 tabular-nums">{formatTime(currentTime)}</span>
        <div className="text-orange-500 hidden sm:block">|</div>
        <button 
          onClick={() => onSetCurrentTime(Math.max(0, currentTime - 5))}
          className="p-1.5 sm:p-2 hover:bg-white/10 rounded touch-target transition-colors"
          type="button"
        >
          <SkipBack size={14} className="sm:hidden" />
          <SkipBack size={16} className="hidden sm:block" />
        </button>
        <button
          onClick={() => onSetIsPlaying(!isPlaying)}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200 touch-target active:scale-95 transition-all"
          type="button"
        >
          {isPlaying ? <Pause size={14} className="sm:hidden" /> : <Play size={14} className="sm:hidden ml-0.5" />}
          {isPlaying ? <Pause size={16} className="hidden sm:block" /> : <Play size={16} className="hidden sm:block ml-0.5" />}
        </button>
        <button 
          onClick={() => onSetCurrentTime(Math.min(duration, currentTime + 5))}
          className="p-1.5 sm:p-2 hover:bg-white/10 rounded touch-target transition-colors"
          type="button"
        >
          <SkipForward size={14} className="sm:hidden" />
          <SkipForward size={16} className="hidden sm:block" />
        </button>
        <div className="text-orange-500 hidden sm:block">|</div>
        <button 
          onClick={onUndo}
          disabled={!canUndo}
          className="hidden sm:block p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed touch-target transition-colors"
          title="Undo (Ctrl+Z)"
          type="button"
        >
          <Undo size={16} />
        </button>
        <button 
          onClick={onRedo}
          disabled={!canRedo}
          className="hidden sm:block p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed touch-target transition-colors"
          title="Redo (Ctrl+Y)"
          type="button"
        >
          <Redo size={16} />
        </button>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {selectedClip && (
          <>
            <button
              onClick={onSplitClip}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white touch-target transition-colors"
              title="Split clip (Ctrl+Shift+S)"
              type="button"
            >
              <Scissors size={14} className="sm:hidden" />
              <Scissors size={16} className="hidden sm:block" />
            </button>
            <button
              onClick={onDuplicateClip}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white touch-target transition-colors"
              title="Duplicate clip (Ctrl+D)"
              type="button"
            >
              <Copy size={14} className="sm:hidden" />
              <Copy size={16} className="hidden sm:block" />
            </button>
            <button
              onClick={onDeleteClip}
              className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded text-zinc-400 hover:text-red-400 touch-target transition-colors"
              title="Delete clip (Delete)"
              type="button"
            >
              <Trash2 size={14} className="sm:hidden" />
              <Trash2 size={16} className="hidden sm:block" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
          </>
        )}
        <button 
          onClick={onAddSlide}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          type="button"
        >
          <Plus size={14} />
          Add Slide
        </button>
      </div>
    </div>
  );
};







