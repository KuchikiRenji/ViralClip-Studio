import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Scissors, 
  Copy, 
  Trash2, 
  Plus, 
  Minus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Magnet,
  ChevronDown,
  ChevronUp,
  GripVertical
} from 'lucide-react';

export interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  label: string;
  color: string;
  isLocked: boolean;
  isHidden: boolean;
  isMuted: boolean;
  height: number;
}

export interface TimelineClip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  title: string;
  color: string;
  thumbnail?: string;
  type: 'video' | 'audio' | 'text' | 'image';
  isSelected?: boolean;
}

interface AdvancedTimelineProps {
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  onTracksChange: (tracks: TimelineTrack[]) => void;
  onClipsChange: (clips: TimelineClip[]) => void;
  onCurrentTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onZoomChange: (zoom: number) => void;
}

const TRACK_COLORS: Record<string, string> = {
  video: 'bg-amber-600',
  audio: 'bg-green-600',
  text: 'bg-blue-600',
  image: 'bg-purple-600',
};

const SNAP_THRESHOLD_PX = 10;
const MIN_ZOOM = 10;
const MAX_ZOOM = 200;
const DEFAULT_TRACK_HEIGHT = 48;

export const AdvancedTimeline = ({
  tracks,
  clips,
  duration,
  currentTime,
  isPlaying,
  zoom,
  onTracksChange,
  onClipsChange,
  onCurrentTimeChange,
  onPlayPause,
  onZoomChange,
}) => {
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [isDraggingClip, setIsDraggingClip] = useState<{
    clipId: string;
    mode: 'move' | 'resize-left' | 'resize-right';
    startX: number;
    originalStart: number;
    originalDuration: number;
  } | null>(null);
  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showTrackSettings, setShowTrackSettings] = useState<string | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  const timeToPixels = useCallback((time: number): number => {
    return time * zoom;
  }, [zoom]);

  const pixelsToTime = useCallback((pixels: number): number => {
    return pixels / zoom;
  }, [zoom]);

  const snapPoints = useMemo(() => {
    const points: number[] = [0, duration];
    clips.forEach(clip => {
      points.push(clip.startTime);
      points.push(clip.startTime + clip.duration);
    });
    return [...new Set(points)].sort((a, b) => a - b);
  }, [clips, duration]);

  const getSnapTime = useCallback((time: number): number => {
    if (!isSnapEnabled) return time;
    
    const snapThreshold = pixelsToTime(SNAP_THRESHOLD_PX);
    
    for (const point of snapPoints) {
      if (Math.abs(time - point) < snapThreshold) {
        return point;
      }
    }
    
    return time;
  }, [isSnapEnabled, snapPoints, pixelsToTime]);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current || isDraggingClip) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(duration, pixelsToTime(x)));
    
    onCurrentTimeChange(getSnapTime(time));
    setSelectedClipIds(new Set());
  }, [scrollLeft, duration, pixelsToTime, getSnapTime, onCurrentTimeChange, isDraggingClip]);

  const handlePlayheadDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  }, []);

  const handleClipClick = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    
    if (e.shiftKey) {
      setSelectedClipIds(prev => {
        const next = new Set(prev);
        if (next.has(clipId)) {
          next.delete(clipId);
        } else {
          next.add(clipId);
        }
        return next;
      });
    } else {
      setSelectedClipIds(new Set([clipId]));
    }
  }, []);

  const handleClipDragStart = useCallback((
    e: React.MouseEvent,
    clipId: string,
    mode: 'move' | 'resize-left' | 'resize-right'
  ) => {
    e.stopPropagation();
    
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const track = tracks.find(t => t.id === clip.trackId);
    if (track?.isLocked) return;
    
    setIsDraggingClip({
      clipId,
      mode,
      startX: e.clientX,
      originalStart: clip.startTime,
      originalDuration: clip.duration,
    });
    
    if (!selectedClipIds.has(clipId)) {
      setSelectedClipIds(new Set([clipId]));
    }
  }, [clips, tracks, selectedClipIds]);

  const handleSplitClip = useCallback(() => {
    if (selectedClipIds.size !== 1) return;
    
    const clipId = Array.from(selectedClipIds)[0];
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    if (currentTime <= clip.startTime || currentTime >= clip.startTime + clip.duration) return;
    
    const splitPoint = currentTime - clip.startTime;
    
    const firstPart: TimelineClip = {
      ...clip,
      duration: splitPoint,
      outPoint: clip.inPoint + splitPoint,
    };
    
    const secondPart: TimelineClip = {
      ...clip,
      id: `clip-${Date.now()}`,
      startTime: currentTime,
      duration: clip.duration - splitPoint,
      inPoint: clip.inPoint + splitPoint,
    };
    
    onClipsChange(clips.map(c => c.id === clipId ? firstPart : c).concat(secondPart));
  }, [selectedClipIds, clips, currentTime, onClipsChange]);

  const handleDuplicateClips = useCallback(() => {
    if (selectedClipIds.size === 0) return;
    
    const newClips = Array.from(selectedClipIds).map(id => {
      const clip = clips.find(c => c.id === id);
      if (!clip) return null;
      
      return {
        ...clip,
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: clip.startTime + clip.duration + 0.5,
      };
    }).filter(Boolean) as TimelineClip[];
    
    onClipsChange([...clips, ...newClips]);
  }, [selectedClipIds, clips, onClipsChange]);

  const handleDeleteClips = useCallback(() => {
    if (selectedClipIds.size === 0) return;
    
    onClipsChange(clips.filter(c => !selectedClipIds.has(c.id)));
    setSelectedClipIds(new Set());
  }, [selectedClipIds, clips, onClipsChange]);

  const handleAddTrack = useCallback((type: TimelineTrack['type']) => {
    const newTrack: TimelineTrack = {
      id: `track-${Date.now()}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${tracks.filter(t => t.type === type).length + 1}`,
      color: TRACK_COLORS[type],
      isLocked: false,
      isHidden: false,
      isMuted: false,
      height: DEFAULT_TRACK_HEIGHT,
    };
    
    onTracksChange([...tracks, newTrack]);
  }, [tracks, onTracksChange]);

  const handleToggleTrackLock = useCallback((trackId: string) => {
    onTracksChange(tracks.map(t => 
      t.id === trackId ? { ...t, isLocked: !t.isLocked } : t
    ));
  }, [tracks, onTracksChange]);

  const handleToggleTrackVisibility = useCallback((trackId: string) => {
    onTracksChange(tracks.map(t => 
      t.id === trackId ? { ...t, isHidden: !t.isHidden } : t
    ));
  }, [tracks, onTracksChange]);

  const handleToggleTrackMute = useCallback((trackId: string) => {
    onTracksChange(tracks.map(t => 
      t.id === trackId ? { ...t, isMuted: !t.isMuted } : t
    ));
  }, [tracks, onTracksChange]);

  const handleDeleteTrack = useCallback((trackId: string) => {
    onTracksChange(tracks.filter(t => t.id !== trackId));
    onClipsChange(clips.filter(c => c.trackId !== trackId));
  }, [tracks, clips, onTracksChange, onClipsChange]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollLeft;
        const time = Math.max(0, Math.min(duration, pixelsToTime(x)));
        onCurrentTimeChange(getSnapTime(time));
      } else if (isDraggingClip && timelineRef.current) {
        const deltaX = e.clientX - isDraggingClip.startX;
        const deltaTime = pixelsToTime(deltaX);
        
        if (isDraggingClip.mode === 'move') {
          const newStart = Math.max(0, isDraggingClip.originalStart + deltaTime);
          const snappedStart = getSnapTime(newStart);
          
          onClipsChange(clips.map(c => 
            c.id === isDraggingClip.clipId ? { ...c, startTime: snappedStart } : c
          ));
        } else if (isDraggingClip.mode === 'resize-left') {
          const newStart = Math.max(0, isDraggingClip.originalStart + deltaTime);
          const snappedStart = getSnapTime(newStart);
          const newDuration = isDraggingClip.originalDuration - (snappedStart - isDraggingClip.originalStart);
          
          if (newDuration > 0.1) {
            onClipsChange(clips.map(c => 
              c.id === isDraggingClip.clipId ? { ...c, startTime: snappedStart, duration: newDuration } : c
            ));
          }
        } else if (isDraggingClip.mode === 'resize-right') {
          const newDuration = Math.max(0.1, isDraggingClip.originalDuration + deltaTime);
          const newEnd = isDraggingClip.originalStart + newDuration;
          const snappedEnd = getSnapTime(newEnd);
          const snappedDuration = snappedEnd - isDraggingClip.originalStart;
          
          if (snappedDuration > 0.1) {
            onClipsChange(clips.map(c => 
              c.id === isDraggingClip.clipId ? { ...c, duration: snappedDuration } : c
            ));
          }
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      setIsDraggingClip(null);
    };

    if (isDraggingPlayhead || isDraggingClip) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingPlayhead, isDraggingClip, scrollLeft, duration, pixelsToTime, getSnapTime, clips, onClipsChange, onCurrentTimeChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteClips();
      } else if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDuplicateClips();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        handleSplitClip();
      } else if (e.key === ' ') {
        e.preventDefault();
        onPlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteClips, handleDuplicateClips, handleSplitClip, onPlayPause]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const renderRuler = () => {
    const marks: React.ReactNode[] = [];
    const majorInterval = zoom < 30 ? 10 : zoom < 60 ? 5 : 1;
    const minorInterval = majorInterval / 5;
    
    for (let time = 0; time <= duration; time += minorInterval) {
      const x = timeToPixels(time);
      const isMajor = time % majorInterval === 0;
      
      marks.push(
        <div
          key={time}
          className="absolute top-0"
          style={{ left: x }}
        >
          <div className={`w-px ${isMajor ? 'h-4 bg-zinc-500' : 'h-2 bg-zinc-700'}`} />
          {isMajor && (
            <span className="absolute top-4 left-0 -translate-x-1/2 text-[9px] text-zinc-500 whitespace-nowrap">
              {formatTime(time).slice(0, 5)}
            </span>
          )}
        </div>
      );
    }
    
    return marks;
  };

  return (
    <div className="flex flex-col h-full bg-surface-darker border-t border-white/5">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayPause}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            type="button"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            onClick={() => onCurrentTimeChange(Math.max(0, currentTime - 5))}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            type="button"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={() => onCurrentTimeChange(Math.min(duration, currentTime + 5))}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            type="button"
          >
            <SkipForward size={14} />
          </button>
          <div className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs text-white font-mono">
            {formatTime(currentTime)}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleSplitClip}
            disabled={selectedClipIds.size !== 1}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            type="button"
            title="Split Clip (Ctrl+Shift+S)"
          >
            <Scissors size={14} />
          </button>
          <button
            onClick={handleDuplicateClips}
            disabled={selectedClipIds.size === 0}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            type="button"
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleDeleteClips}
            disabled={selectedClipIds.size === 0}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            type="button"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          
          <div className="w-px h-6 bg-zinc-700 mx-1" />
          
          <button
            onClick={() => setIsSnapEnabled(!isSnapEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              isSnapEnabled ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
            type="button"
            title="Snap to Grid"
          >
            <Magnet size={14} />
          </button>
          
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => onZoomChange(Math.max(MIN_ZOOM, zoom - 10))}
              className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors"
              type="button"
            >
              <Minus size={12} />
            </button>
            <span className="text-[10px] text-zinc-400 w-10 text-center">{zoom}px/s</span>
            <button
              onClick={() => onZoomChange(Math.min(MAX_ZOOM, zoom + 10))}
              className="p-1.5 rounded text-zinc-400 hover:text-white transition-colors"
              type="button"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-40 shrink-0 border-r border-white/5 bg-zinc-900/30">
          <div className="h-8 border-b border-white/5 flex items-center justify-between px-2">
            <span className="text-[10px] text-zinc-500 font-medium uppercase">Tracks</span>
            <div className="relative group">
              <button
                className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                type="button"
              >
                <Plus size={12} />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {(['video', 'audio', 'text', 'image'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAddTrack(type)}
                    className="w-full px-3 py-2 text-[11px] text-left text-white hover:bg-white/10 transition-colors capitalize"
                    type="button"
                  >
                    {type} Track
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {tracks.map((track) => (
            <div
              key={track.id}
              className="border-b border-white/5 group"
              style={{ height: track.height }}
            >
              <div className="h-full flex items-center gap-1 px-2">
                <GripVertical size={12} className="text-zinc-600 cursor-grab" />
                <div className={`w-2 h-2 rounded-full ${track.color}`} />
                <span className="text-[11px] text-white flex-1 truncate">{track.label}</span>
                
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleTrackMute(track.id)}
                    className={`p-1 rounded transition-colors ${
                      track.isMuted ? 'text-red-400' : 'text-zinc-500 hover:text-white'
                    }`}
                    type="button"
                  >
                    {track.isMuted ? <VolumeX size={10} /> : <Volume2 size={10} />}
                  </button>
                  <button
                    onClick={() => handleToggleTrackVisibility(track.id)}
                    className={`p-1 rounded transition-colors ${
                      track.isHidden ? 'text-zinc-600' : 'text-zinc-500 hover:text-white'
                    }`}
                    type="button"
                  >
                    {track.isHidden ? <EyeOff size={10} /> : <Eye size={10} />}
                  </button>
                  <button
                    onClick={() => handleToggleTrackLock(track.id)}
                    className={`p-1 rounded transition-colors ${
                      track.isLocked ? 'text-amber-400' : 'text-zinc-500 hover:text-white'
                    }`}
                    type="button"
                  >
                    {track.isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                  </button>
                  <button
                    onClick={() => setShowTrackSettings(showTrackSettings === track.id ? null : track.id)}
                    className="p-1 rounded text-zinc-500 hover:text-white transition-colors"
                    type="button"
                  >
                    {showTrackSettings === track.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                </div>
              </div>
              
              {showTrackSettings === track.id && (
                <div className="absolute left-40 bg-zinc-800 border border-white/10 rounded-lg shadow-xl p-2 z-20">
                  <button
                    onClick={() => handleDeleteTrack(track.id)}
                    className="w-full px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 rounded transition-colors text-left"
                    type="button"
                  >
                    Delete Track
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div 
          className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar"
          onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        >
          <div 
            ref={timelineRef}
            className="relative min-h-full"
            style={{ width: timeToPixels(duration) + 100 }}
            onClick={handleTimelineClick}
          >
            <div className="h-8 border-b border-white/5 relative bg-zinc-900/50">
              {renderRuler()}
            </div>

            <div ref={tracksContainerRef}>
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`relative border-b border-white/5 ${
                    track.isHidden ? 'opacity-30' : ''
                  } ${track.isLocked ? 'bg-zinc-800/20' : ''}`}
                  style={{ height: track.height }}
                >
                  {clips
                    .filter(clip => clip.trackId === track.id)
                    .map((clip) => {
                      const isSelected = selectedClipIds.has(clip.id);
                      const left = timeToPixels(clip.startTime);
                      const width = timeToPixels(clip.duration);
                      
                      return (
                        <div
                          key={clip.id}
                          className={`absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900' : ''
                          } ${clip.color}`}
                          style={{ left, width: Math.max(width, 20) }}
                          onClick={(e) => handleClipClick(e, clip.id)}
                          onMouseDown={(e) => handleClipDragStart(e, clip.id, 'move')}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 transition-colors"
                            onMouseDown={(e) => handleClipDragStart(e, clip.id, 'resize-left')}
                          />
                          
                          <div className="px-2 py-1 h-full flex items-center">
                            {clip.thumbnail && (
                              <img 
                                src={clip.thumbnail} 
                                alt="" 
                                className="h-full w-auto rounded mr-2 object-cover"
                              />
                            )}
                            <span className="text-[10px] text-white font-medium truncate">
                              {clip.title}
                            </span>
                          </div>
                          
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 transition-colors"
                            onMouseDown={(e) => handleClipDragStart(e, clip.id, 'resize-right')}
                          />
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-30 cursor-ew-resize"
              style={{ left: timeToPixels(currentTime) }}
              onMouseDown={handlePlayheadDragStart}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

