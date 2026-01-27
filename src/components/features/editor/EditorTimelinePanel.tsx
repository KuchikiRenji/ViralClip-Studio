import { useRef, useEffect, useState, useCallback, Dispatch, SetStateAction } from 'react';
import { List } from 'lucide-react';
import {
  DEFAULT_VIDEO_DURATION_SECONDS,
  MIN_CLIP_DURATION_SECONDS,
  TIMELINE_ZOOM_MIN,
  TIMELINE_ZOOM_MAX,
} from '../../../constants/editor';
import { TimelineControls } from './TimelineControls';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTracks } from './TimelineTracks';
export interface TimelineClip {
  id: string;
  startTime: number;
  duration: number;
  trackIndex: number;
  color: string;
  title: string;
}
interface EditorTimelinePanelProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  showTimeline: boolean;
  setShowTimeline: (show: boolean) => void;
  clips: TimelineClip[];
  setClips: Dispatch<SetStateAction<TimelineClip[]>>;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
const TRACK_COLORS: Record<string, { bg: string; border: string }> = {
  amber: { bg: 'bg-amber-600/80', border: 'border-amber-500' },
  blue: { bg: 'bg-blue-600/80', border: 'border-blue-500' },
  green: { bg: 'bg-green-600/80', border: 'border-green-500' },
  purple: { bg: 'bg-purple-600/80', border: 'border-purple-500' },
  red: { bg: 'bg-red-600/80', border: 'border-red-500' },
};
export const EditorTimelinePanel = ({
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  showTimeline,
  setShowTimeline,
  clips,
  setClips,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  const [timelineZoom, setTimelineZoom] = useState(50);
  const [timelineScroll, setTimelineScroll] = useState(0);
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{ id: string; startX: number; startTime: number } | null>(null);
  const [resizingClip, setResizingClip] = useState<{ id: string; edge: 'left' | 'right'; startX: number; startTime: number; startDuration: number } | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [showTracks, setShowTracks] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const duration = DEFAULT_VIDEO_DURATION_SECONDS;
  const pixelsToTime = useCallback((pixels: number): number => {
    return pixels / timelineZoom;
  }, [timelineZoom]);
  const timeToPixels = useCallback((time: number): number => {
    return time * timelineZoom;
  }, [timelineZoom]);
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!timelineRef.current || draggingClip || resizingClip) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    if (clientX === undefined) return;
    const x = clientX - rect.left + timelineScroll;
    const time = Math.max(0, Math.min(duration, pixelsToTime(x)));
    setCurrentTime(time);
    setSelectedClipId(null);
  };
  const handlePlayheadMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setDraggingPlayhead(true);
  };
  const handleClipMouseDown = (e: React.MouseEvent, clip: TimelineClip) => {
    e.stopPropagation();
    const startX = e.clientX;
    setDraggingClip({ id: clip.id, startX, startTime: clip.startTime });
    setSelectedClipId(clip.id);
  };
  const handleClipResizeMouseDown = (e: React.MouseEvent, clip: TimelineClip, edge: 'left' | 'right') => {
    e.stopPropagation();
    setResizingClip({ id: clip.id, edge, startX: e.clientX, startTime: clip.startTime, startDuration: clip.duration });
    setSelectedClipId(clip.id);
  };
  const handleDeleteSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    setClips(prev => prev.filter(c => c.id !== selectedClipId));
    setSelectedClipId(null);
  }, [selectedClipId, setClips]);
  const handleDuplicateSelectedClip = useCallback(() => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    const newClip: TimelineClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: clip.startTime + clip.duration + 0.5,
    };
    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
  }, [selectedClipId, clips, setClips]);
  const handleSplitClip = useCallback(() => {
    if (!selectedClipId) return;
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) return;
    const splitPoint = currentTime - clip.startTime;
    const firstPart: TimelineClip = {
      ...clip,
      duration: splitPoint,
    };
    const secondPart: TimelineClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: currentTime,
      duration: clip.duration - splitPoint,
    };
    setClips(prev => prev.map(c => c.id === selectedClipId ? firstPart : c).concat(secondPart));
  }, [selectedClipId, clips, currentTime, setClips]);
  const handleAddSlide = useCallback(() => {
    const lastClip = clips.reduce((max, clip) => 
      clip.startTime + clip.duration > max ? clip.startTime + clip.duration : max, 0
    );
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      startTime: lastClip + 0.5,
      duration: 5,
      trackIndex: 0,
      color: 'amber',
      title: `Slide ${clips.filter(c => c.trackIndex === 0).length + 1}`,
    };
    setClips(prev => [...prev, newClip]);
  }, [clips, setClips]);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingPlayhead && timelineRef.current) {
        const x = e.clientX - timelineRef.current.getBoundingClientRect().left + timelineScroll;
        const time = Math.max(0, Math.min(duration, pixelsToTime(x)));
        setCurrentTime(time);
      } else if (draggingClip && timelineRef.current) {
        const deltaX = e.clientX - draggingClip.startX;
        const deltaTime = pixelsToTime(deltaX);
        const newStartTime = Math.max(0, draggingClip.startTime + deltaTime);
        setClips((prev: TimelineClip[]) =>
          prev.map((c: TimelineClip) => (c.id === draggingClip.id ? { ...c, startTime: newStartTime } : c))
        );
      } else if (resizingClip && timelineRef.current) {
        const deltaX = e.clientX - resizingClip.startX;
        const deltaTime = pixelsToTime(deltaX);
        const clip = clips.find((c) => c.id === resizingClip.id);
        if (!clip) return;
        if (resizingClip.edge === 'right') {
          const newDuration = Math.max(MIN_CLIP_DURATION_SECONDS, resizingClip.startDuration + deltaTime);
          setClips((prev: TimelineClip[]) =>
            prev.map((c: TimelineClip) => (c.id === resizingClip.id ? { ...c, duration: newDuration } : c))
          );
        } else {
          const newStartTime = Math.max(0, resizingClip.startTime + deltaTime);
          const newDuration = Math.max(MIN_CLIP_DURATION_SECONDS, resizingClip.startDuration - deltaTime);
          if (newDuration > 0) {
            setClips((prev: TimelineClip[]) =>
              prev.map((c: TimelineClip) =>
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
    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingPlayhead || !timelineRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const x = touch.clientX - timelineRef.current.getBoundingClientRect().left + timelineScroll;
      const time = Math.max(0, Math.min(duration, pixelsToTime(x)));
      setCurrentTime(time);
    };
    const handleTouchEnd = () => {
      setDraggingPlayhead(false);
      setDraggingClip(null);
      setResizingClip(null);
    };
    if (draggingPlayhead || draggingClip || resizingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [draggingPlayhead, draggingClip, resizingClip, timelineScroll, duration, pixelsToTime, clips, setCurrentTime, setClips]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelectedClip();
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDuplicateSelectedClip();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        handleSplitClip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelectedClip, handleDuplicateSelectedClip, handleSplitClip]);
  if (!showTimeline) {
    return (
      <div className="bg-surface-darker border-t border-white/5 px-3 sm:px-4 py-2 safe-area-inset-bottom">
        <button
          onClick={() => setShowTimeline(true)}
          className="flex items-center gap-2 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 touch-target"
          type="button"
        >
          <List size={12} className="sm:hidden" />
          <List size={14} className="hidden sm:block" />
          Show Timeline
        </button>
      </div>
    );
  }
  const selectedClip = clips.find(c => c.id === selectedClipId);
  return (
    <div className="bg-surface-darker border-t border-white/5 safe-area-inset-bottom">
      <TimelineControls
        showTimeline={showTimeline}
        showTracks={showTracks}
        currentTime={currentTime}
        isPlaying={isPlaying}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedClip={selectedClip}
        duration={duration}
        onToggleTimeline={() => setShowTimeline(!showTimeline)}
        onToggleTracks={() => setShowTracks(!showTracks)}
        onSetCurrentTime={setCurrentTime}
        onSetIsPlaying={setIsPlaying}
        onUndo={onUndo}
        onRedo={onRedo}
        onSplitClip={handleSplitClip}
        onDuplicateClip={handleDuplicateSelectedClip}
        onDeleteClip={handleDeleteSelectedClip}
        onAddSlide={handleAddSlide}
        formatTime={formatTime}
      />
      <div className="flex items-center gap-2 px-2 sm:px-4 py-1.5">
        <span className="text-[10px] sm:text-xs text-zinc-500 whitespace-nowrap">Zoom:</span>
        <input
          type="range"
          min={TIMELINE_ZOOM_MIN}
          max={TIMELINE_ZOOM_MAX}
          value={timelineZoom}
          onChange={(e) => setTimelineZoom(Number(e.target.value))}
          className="flex-1 h-2 sm:h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600 touch-target"
        />
        <span className="text-[10px] sm:text-xs text-zinc-500 w-10 sm:w-12 whitespace-nowrap tabular-nums">{timelineZoom}px/s</span>
      </div>
      {showTracks && (
        <div
          ref={timelineRef}
          className="relative h-32 sm:h-36 overflow-x-auto custom-scrollbar cursor-pointer touch-pan-x overscroll-contain"
          onScroll={(e) => setTimelineScroll(e.currentTarget.scrollLeft)}
          onClick={handleTimelineClick}
          onTouchStart={handleTimelineClick}
        >
          <div className="absolute top-0 left-0" style={{ width: `${timeToPixels(duration)}px`, height: '100%' }}>
            <TimelineRuler
              duration={duration}
              timeToPixels={timeToPixels}
            />
            <TimelineTracks
              clips={clips}
              selectedClipId={selectedClipId}
              timeToPixels={timeToPixels}
              onClipMouseDown={handleClipMouseDown}
              onClipResizeMouseDown={handleClipResizeMouseDown}
              onSelectClip={setSelectedClipId}
            />
            <div
              className="absolute top-0 bottom-0 w-1 sm:w-0.5 bg-orange-500 z-20 cursor-grab active:cursor-grabbing"
              style={{ left: `${timeToPixels(currentTime)}px` }}
              onMouseDown={handlePlayheadMouseDown}
              onTouchStart={(e) => {
                e.preventDefault();
                handlePlayheadMouseDown(e);
              }}
            >
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-2.5 sm:h-2.5 bg-orange-500 rounded-full shadow-lg" />
              <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-2.5 sm:h-2.5 bg-orange-500 rounded-full shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};