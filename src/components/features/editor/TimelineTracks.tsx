import { MouseEvent } from 'react';
import { TimelineClip } from './EditorTimelinePanel';
interface TimelineTracksProps {
  clips: TimelineClip[];
  selectedClipId: string | null;
  timeToPixels: (time: number) => number;
  onClipMouseDown: (e: MouseEvent, clip: TimelineClip) => void;
  onClipResizeMouseDown: (e: MouseEvent, clip: TimelineClip, edge: 'left' | 'right') => void;
  onSelectClip: (clipId: string) => void;
}
const TRACK_CONTAINER_CLASS = 'absolute left-0 right-0 bottom-0 top-6 flex flex-col gap-3 px-2';
const TRACK_ROW_CLASS = 'relative h-8 sm:h-9 rounded bg-zinc-900/60 border border-white/10 overflow-hidden';
const TRACK_TEXT_CLASS = 'absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs text-white font-medium truncate px-1';
const TRACK_RESIZE_HANDLE_CLASS = 'absolute top-0 bottom-0 w-1.5 sm:w-1 bg-white/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity';
const DEFAULT_TRACK_INDEX = 0;
const TRACK_COLORS: Record<string, { bg: string; border: string }> = {
  amber: { bg: 'bg-amber-600/80', border: 'border-amber-500' },
  blue: { bg: 'bg-blue-600/80', border: 'border-blue-500' },
  green: { bg: 'bg-green-600/80', border: 'border-green-500' },
  purple: { bg: 'bg-purple-600/80', border: 'border-purple-500' },
  red: { bg: 'bg-red-600/80', border: 'border-red-500' },
};
export const TimelineTracks = ({
  clips,
  selectedClipId,
  timeToPixels,
  onClipMouseDown,
  onClipResizeMouseDown,
  onSelectClip,
}) => {
  const trackIndices = Array.from(new Set(clips.map((clip) => clip.trackIndex))).sort((a, b) => a - b);
  const tracksToRender = trackIndices.length ? trackIndices : [DEFAULT_TRACK_INDEX];
  return (
    <div className={TRACK_CONTAINER_CLASS}>
      {tracksToRender.map((trackIndex) => {
        const trackClips = clips.filter((clip) => clip.trackIndex === trackIndex);
        return (
          <div key={trackIndex} className={TRACK_ROW_CLASS}>
            {trackClips.map((clip) => {
              const colors = TRACK_COLORS[clip.color] || TRACK_COLORS.amber;
              const isSelected = selectedClipId === clip.id;
              return (
                <div
                  key={clip.id}
                  className={`absolute h-full rounded cursor-move group transition-all ${colors.bg} ${isSelected ? `ring-2 ring-white/50 ${colors.border} border-2` : 'border border-white/20'}`}
                  style={{
                    left: `${timeToPixels(clip.startTime)}px`,
                    width: `${timeToPixels(clip.duration)}px`,
                  }}
                  onMouseDown={(e) => onClipMouseDown(e, clip)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(clip.id);
                  }}
                >
                  <div className={TRACK_TEXT_CLASS}>
                    {clip.title}
                  </div>
                  <div
                    className={`${TRACK_RESIZE_HANDLE_CLASS} left-0 rounded-l`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onClipResizeMouseDown(e, clip, 'left');
                    }}
                  />
                  <div
                    className={`${TRACK_RESIZE_HANDLE_CLASS} right-0 rounded-r`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onClipResizeMouseDown(e, clip, 'right');
                    }}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};







