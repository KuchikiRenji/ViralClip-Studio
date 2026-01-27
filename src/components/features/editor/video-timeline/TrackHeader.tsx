import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { TrackHeaderProps } from './types';
import { TRACK_COLORS, TRACK_HEIGHT_PX, TRACK_HEIGHT_COLLAPSED_PX } from './constants';

export const TrackHeader = ({
  track,
  onToggleLock,
  onToggleMute,
  onToggleVisibility,
  onToggleCollapse,
  onDelete,
}: TrackHeaderProps) => {
  const colors = TRACK_COLORS[track.type];
  const height = track.isCollapsed ? TRACK_HEIGHT_COLLAPSED_PX : TRACK_HEIGHT_PX;

  return (
    <div
      className={`flex items-center gap-1 px-2 border-b border-white/5 bg-zinc-900/50 group transition-all duration-150 ${
        track.isLocked ? 'opacity-60' : ''
      } ${!track.isVisible ? 'opacity-40' : ''}`}
      style={{ height }}
    >
      <GripVertical
        size={12}
        className="text-zinc-600 cursor-grab active:cursor-grabbing flex-shrink-0"
      />

      <button
        onClick={onToggleCollapse}
        className="p-0.5 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
        type="button"
        title={track.isCollapsed ? 'Expand track' : 'Collapse track'}
      >
        {track.isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      </button>

      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />

      <span className="text-[11px] text-white flex-1 truncate min-w-0">{track.label}</span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {track.type === 'audio' && (
          <button
            onClick={onToggleMute}
            className={`p-1 rounded transition-colors ${
              track.isMuted
                ? 'text-red-400 bg-red-500/20'
                : 'text-zinc-500 hover:text-white hover:bg-white/10'
            }`}
            type="button"
            title={track.isMuted ? 'Unmute track' : 'Mute track'}
          >
            {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        )}

        <button
          onClick={onToggleVisibility}
          className={`p-1 rounded transition-colors ${
            !track.isVisible
              ? 'text-zinc-600 bg-zinc-800'
              : 'text-zinc-500 hover:text-white hover:bg-white/10'
          }`}
          type="button"
          title={track.isVisible ? 'Hide track' : 'Show track'}
        >
          {track.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>

        <button
          onClick={onToggleLock}
          className={`p-1 rounded transition-colors ${
            track.isLocked
              ? 'text-amber-400 bg-amber-500/20'
              : 'text-zinc-500 hover:text-white hover:bg-white/10'
          }`}
          type="button"
          title={track.isLocked ? 'Unlock track' : 'Lock track'}
        >
          {track.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>

        <button
          onClick={onDelete}
          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          type="button"
          title="Delete track"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
