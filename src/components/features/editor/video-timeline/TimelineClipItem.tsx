import { MouseEvent } from 'react';
import { Clip } from '../../../../types';
import { AudioWaveform } from './AudioWaveform';
import { TRACK_COLORS, MIN_CLIP_WIDTH_PX, timeToPixels } from './constants';

interface TimelineClipItemProps {
  clip: Clip;
  isSelected: boolean;
  zoom: number;
  trackType: 'video' | 'audio';
  onClick: (e: MouseEvent) => void;
  onDoubleClick: () => void;
  onDragStart: (e: MouseEvent) => void;
  onResizeStart: (edge: 'left' | 'right', e: MouseEvent) => void;
  onContextMenu: (e: MouseEvent) => void;
}

export const TimelineClipItem = ({
  clip,
  isSelected,
  zoom,
  trackType,
  onClick,
  onDoubleClick,
  onDragStart,
  onResizeStart,
  onContextMenu,
}: TimelineClipItemProps) => {
  const colors = TRACK_COLORS[clip.type] || TRACK_COLORS[trackType];
  const left = timeToPixels(clip.startTime, zoom);
  const width = Math.max(timeToPixels(clip.duration, zoom), MIN_CLIP_WIDTH_PX);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    onClick(e);
    onDragStart(e);
  };

  const handleResizeMouseDown = (edge: 'left' | 'right') => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    onClick(e);
    onResizeStart(edge, e);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e);
    onContextMenu(e);
  };

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing
        group transition-all duration-100 z-10 ${colors.bg} hover:${colors.bgHover} touch-manipulation
        ${isSelected ? `ring-2 ring-blue-400 ring-offset-1 ring-offset-zinc-900 ${colors.border} border z-20` : 'border border-white/20'}`}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        minWidth: MIN_CLIP_WIDTH_PX,
      }}
      onMouseDown={handleMouseDown}
      onPointerDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      onContextMenu={handleContextMenu}
      data-clip-id={clip.id}
      data-clip-type={clip.type}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-3 sm:w-2 cursor-ew-resize z-10
          bg-gradient-to-r from-white/20 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100
          transition-opacity hover:from-white/40 touch-none"
        onMouseDown={handleResizeMouseDown('left')}
        onPointerDown={handleResizeMouseDown('left')}
      />

      <div className="absolute inset-0 flex items-center px-2 pointer-events-none overflow-hidden">
        {(clip.type === 'video' || clip.type === 'image') && clip.thumbnail && (
          <img
            src={clip.thumbnail}
            alt=""
            className="h-full w-auto rounded mr-2 object-cover flex-shrink-0"
            style={{ maxWidth: '40%' }}
          />
        )}

        {clip.type === 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center px-2 opacity-60">
            <AudioWaveform
              waveformData={clip.waveformData}
              width={width - 20}
              height={32}
              color="rgba(255, 255, 255, 0.5)"
            />
          </div>
        )}

        <span className="text-[10px] text-white font-medium truncate drop-shadow-sm z-10 relative">
          {clip.title}
        </span>

        {width > 80 && (
          <span className="absolute right-2 text-[8px] text-white/60 font-mono">
            {formatDuration(clip.duration)}
          </span>
        )}
      </div>

      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none" />
      )}

      <div
        className="absolute right-0 top-0 bottom-0 w-3 sm:w-2 cursor-ew-resize z-10
          bg-gradient-to-l from-white/20 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100
          transition-opacity hover:from-white/40 touch-none"
        onMouseDown={handleResizeMouseDown('right')}
        onPointerDown={handleResizeMouseDown('right')}
      />

      {clip.inPoint > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500/50" />
      )}
      {clip.outPoint < clip.duration && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-500/50" />
      )}
    </div>
  );
};

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
