import { useRef, useEffect, useCallback, useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Undo, Redo, Trash2, Plus, 
  Music, Layers, List 
} from 'lucide-react';
export interface TimelineClip {
  id: string;
  startTime: number;
  duration: number;
  trackIndex: number;
  color: string;
  title: string;
}
interface EditorTimelineProps {
  clips: TimelineClip[];
  onClipsChange: (clips: TimelineClip[]) => void;
  currentTime: number;
  onTimeChange: (time: number) => void;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  showTimeline: boolean;
  onToggleTimeline: () => void;
}
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
export const EditorTimeline = ({
  clips,
  onClipsChange,
  currentTime,
  onTimeChange,
  duration,
  isPlaying,
  onPlayPause,
  showTimeline,
  onToggleTimeline,
}) => {
  const [timelineZoom, setTimelineZoom] = useState(50);
  const [timelineScroll, setTimelineScroll] = useState(0);
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{ id: string; startX: number; startTime: number } | null>(null);
  const [resizingClip, setResizingClip] = useState<{ 
    id: string; 
    edge: 'left' | 'right'; 
    startX: number; 
    startTime: number; 
    startDuration: number 
  } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const pixelsToTime = useCallback((pixels: number): number => {
    return pixels / timelineZoom;
  }, [timelineZoom]);
  const timeToPixels = useCallback((time: number): number => {
    return time * timelineZoom;
  }, [timelineZoom]);
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || draggingClip || resizingClip) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineScroll;
    const time = Math.max(0, Math.min(duration, pixelsToTime(x)));
    onTimeChange(time);
  }, [draggingClip, resizingClip, timelineScroll, duration, pixelsToTime, onTimeChange]);
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingPlayhead(true);
  }, []);
  const handleClipMouseDown = useCallback((e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    const startX = e.clientX;
    setDraggingClip({ id: clip.id, startX, startTime: clip.startTime });
  }, []);
  const handleClipResizeMouseDown = useCallback((e: React.MouseEvent, clip: TimelineClip, edge: 'left' | 'right') => {
    e.stopPropagation();
    setResizingClip({ 
      id: clip.id, 
      edge, 
      startX: e.clientX, 
      startTime: clip.startTime, 
      startDuration: clip.duration 
    });
  }, []);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingPlayhead && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineScroll;
        const time = Math.max(0, Math.min(duration, pixelsToTime(x)));
        onTimeChange(time);
      } else if (draggingClip && timelineRef.current) {
        const deltaX = e.clientX - draggingClip.startX;
        const deltaTime = pixelsToTime(deltaX);
        const newStartTime = Math.max(0, draggingClip.startTime + deltaTime);
        onClipsChange(
          clips.map((c) => (c.id === draggingClip.id ? { ...c, startTime: newStartTime } : c))
        );
      } else if (resizingClip && timelineRef.current) {
        const deltaX = e.clientX - resizingClip.startX;
        const deltaTime = pixelsToTime(deltaX);
        const clip = clips.find((c) => c.id === resizingClip.id);
        if (!clip) return;
        if (resizingClip.edge === 'right') {
          const newDuration = Math.max(0.5, resizingClip.startDuration + deltaTime);
          onClipsChange(
            clips.map((c) => (c.id === resizingClip.id ? { ...c, duration: newDuration } : c))
          );
        } else {
          const newStartTime = Math.max(0, resizingClip.startTime + deltaTime);
          const newDuration = Math.max(0.5, resizingClip.startDuration - deltaTime);
          if (newDuration > 0) {
            onClipsChange(
              clips.map((c) =>
                c.id === resizingClip.id ? { ...c, startTime: newStartTime, duration: newDuration } : c
              )
            );
          }
        }
      }
    };
    const handleMouseUp = () => {
      setDraggingPlayhead(false);
      setDraggingClip(null);
      setResizingClip(null);
    };
    if (draggingPlayhead || draggingClip || resizingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingPlayhead, draggingClip, resizingClip, timelineScroll, duration, pixelsToTime, clips, onClipsChange, onTimeChange]);
  if (!showTimeline) {
    return (
      <div className="bg-surface-darker border-t border-white/5 px-3 sm:px-4 py-2 hidden sm:block">
        <button
          onClick={onToggleTimeline}
          className="flex items-center gap-2 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300"
          type="button"
        >
          <List size={12} className="sm:hidden" />
          <List size={14} className="hidden sm:block" />
          Show Timeline
        </button>
      </div>
    );
  }
  return (
    <div className="bg-surface-darker border-t border-white/5 hidden sm:block">
      <div className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-4 py-2 border-b border-white/5">
        <button
          onClick={onToggleTimeline}
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300"
          type="button"
        >
          <List size={12} className="sm:hidden" />
          <List size={14} className="hidden sm:block" />
          <span className="hidden xs:inline">Hide</span> Timeline
        </button>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm font-mono text-gray-400">{formatTime(currentTime)}</span>
          <div className="text-orange-500 hidden sm:block">|</div>
          <button className="p-1 hover:bg-white/10 rounded" type="button">
            <SkipBack size={14} className="sm:hidden" />
            <SkipBack size={16} className="hidden sm:block" />
          </button>
          <button
            onClick={onPlayPause}
            className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center text-black hover:bg-gray-200"
            type="button"
          >
            {isPlaying ? <Pause size={14} className="sm:hidden" /> : <Play size={14} className="sm:hidden ml-0.5" />}
            {isPlaying ? <Pause size={16} className="hidden sm:block" /> : <Play size={16} className="hidden sm:block ml-0.5" />}
          </button>
          <button className="p-1 hover:bg-white/10 rounded" type="button">
            <SkipForward size={14} className="sm:hidden" />
            <SkipForward size={16} className="hidden sm:block" />
          </button>
          <div className="text-orange-500 hidden sm:block">|</div>
          <button className="hidden sm:block p-1 hover:bg-white/10 rounded text-gray-400" type="button"><Undo size={14} /></button>
          <button className="hidden sm:block p-1 hover:bg-white/10 rounded text-gray-400" type="button"><Redo size={14} /></button>
          <div className="text-orange-500 hidden md:block">|</div>
          <button className="hidden md:block p-1 hover:bg-white/10 rounded text-gray-400" type="button"><Layers size={14} /></button>
          <button className="hidden md:block p-1 hover:bg-white/10 rounded text-gray-400" type="button"><Trash2 size={14} /></button>
        </div>
        <button className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-white" type="button">
          <Plus size={14} />
          Add Slide
        </button>
      </div>
      <div className="flex items-center gap-2 px-2 sm:px-4 pb-2">
        <span className="text-[10px] sm:text-xs text-gray-500">Zoom:</span>
        <input
          type="range"
          min="10"
          max="200"
          value={timelineZoom}
          onChange={(e) => setTimelineZoom(Number(e.target.value))}
          className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span className="text-[10px] sm:text-xs text-gray-500 w-10 sm:w-12">{timelineZoom}px/s</span>
      </div>
      <div
        ref={timelineRef}
        className="relative h-32 overflow-x-auto custom-scrollbar cursor-pointer"
        onScroll={(e) => setTimelineScroll(e.currentTarget.scrollLeft)}
        onClick={handleTimelineClick}
      >
        <div className="absolute top-0 left-0" style={{ width: `${timeToPixels(duration)}px`, height: '100%' }}>
          <div className="absolute top-0 left-0 right-0 h-5 flex items-end border-b border-white/5">
            {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute border-l border-white/10"
                style={{ left: `${timeToPixels(i)}px`, height: i % 5 === 0 ? '100%' : '50%' }}
              >
                {i % 5 === 0 && (
                  <span 
                    className="absolute -bottom-4 left-0 text-[10px] text-gray-600 whitespace-nowrap" 
                    style={{ transform: 'translateX(-50%)' }}
                  >
                    {i}s
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="absolute top-6 left-0 right-0 h-8">
            {clips
              .filter((c) => c.trackIndex === 0)
              .map((clip) => (
                <div
                  key={clip.id}
                  className="absolute h-full rounded cursor-move group"
                  style={{
                    left: `${timeToPixels(clip.startTime)}px`,
                    width: `${timeToPixels(clip.duration)}px`,
                    backgroundColor: clip.color === 'amber' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                  }}
                  onMouseDown={(e) => handleClipMouseDown(e, clip)}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium truncate px-1">
                    {clip.title}
                  </div>
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleClipResizeMouseDown(e, clip, 'left');
                    }}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleClipResizeMouseDown(e, clip, 'right');
                    }}
                  />
                </div>
              ))}
          </div>
          <div className="absolute top-16 left-0 right-0 px-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-600 flex items-center justify-center">
                <Music size={10} />
              </div>
              <div className="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
                <div className="h-full bg-purple-900/50 flex items-center px-2">
                  <span className="text-[10px] text-gray-400 truncate">Audio Track 1</span>
                </div>
              </div>
            </div>
            <div className="ml-6 h-3 bg-zinc-800/50 rounded overflow-hidden">
              <div className="h-full flex items-center">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 mx-px" 
                    style={{ height: `${Math.random() * 100}%`, backgroundColor: 'rgba(168, 85, 247, 0.5)' }} 
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute top-24 left-0 right-0 px-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                <Music size={10} />
              </div>
              <div className="flex-1 h-6 bg-zinc-800 rounded overflow-hidden">
                <div className="h-full bg-blue-900/50 flex items-center px-2">
                  <span className="text-[10px] text-gray-400 truncate">Audio Track 2</span>
                </div>
              </div>
            </div>
            <div className="ml-6 h-3 bg-zinc-800/50 rounded overflow-hidden">
              <div className="h-full flex items-center">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 mx-px" 
                    style={{ height: `${Math.random() * 100}%`, backgroundColor: 'rgba(59, 130, 246, 0.5)' }} 
                  />
                ))}
              </div>
            </div>
          </div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-20 cursor-grab active:cursor-grabbing"
            style={{ left: `${timeToPixels(currentTime)}px` }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};