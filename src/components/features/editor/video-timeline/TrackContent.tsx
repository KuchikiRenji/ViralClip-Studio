import { TrackContentProps } from './types';
import { TimelineClipItem } from './TimelineClipItem';
import { TRACK_HEIGHT_PX, TRACK_HEIGHT_COLLAPSED_PX } from './constants';

export const TrackContent = ({
  track,
  clips,
  selectedClipIds,
  zoom,
  onClipClick,
  onClipDoubleClick,
  onClipDragStart,
  onClipResizeStart,
  onContextMenu,
}: TrackContentProps) => {
  const height = track.isCollapsed ? TRACK_HEIGHT_COLLAPSED_PX : TRACK_HEIGHT_PX;

  const trackClips = clips.filter((clip) => clip.trackId === track.id);

  return (
    <div
      className={`relative border-b border-white/5 transition-all duration-150 ${
        track.isLocked ? 'bg-zinc-800/20' : 'bg-zinc-900/20'
      } ${!track.isVisible ? 'opacity-30' : ''}`}
      style={{ height }}
      data-track-id={track.id}
      data-track-type={track.type}
    >
      {trackClips.length === 0 && !track.isCollapsed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-zinc-600 italic">
            {track.isLocked ? 'Locked' : 'Drop clips here'}
          </span>
        </div>
      )}

      {!track.isCollapsed &&
        trackClips.map((clip) => (
          <TimelineClipItem
            key={clip.id}
            clip={clip}
            isSelected={selectedClipIds.has(clip.id)}
            zoom={zoom}
            trackType={track.type}
            onClick={(e) => onClipClick(clip.id, e)}
            onDoubleClick={() => onClipDoubleClick(clip.id)}
            onDragStart={(e) => onClipDragStart(clip.id, e)}
            onResizeStart={(edge, e) => onClipResizeStart(clip.id, edge, e)}
            onContextMenu={(e) => onContextMenu(clip.id, e)}
          />
        ))}

      {track.isCollapsed && trackClips.length > 0 && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 mx-2 flex gap-1">
          {trackClips.map((clip) => (
            <div
              key={clip.id}
              className={`h-full rounded-full ${
                selectedClipIds.has(clip.id) ? 'bg-blue-500' : 'bg-zinc-500'
              }`}
              style={{
                left: `${clip.startTime * zoom}px`,
                width: `${Math.max(clip.duration * zoom, 4)}px`,
                position: 'absolute',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
