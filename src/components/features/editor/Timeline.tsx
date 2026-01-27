import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { MousePointer2, Scissors, Trash2, ZoomIn, ZoomOut, Lock, Eye, Magnet, Flag, Copy, Menu } from 'lucide-react';
import { Clip, Track, TimelineMarker } from '../../../types';
import { TRACK_HEIGHT_PX } from '../../../constants';
import { ToolMode } from './types';
import { useTouchGestures, useIsMobile } from '../../../hooks/useTouchGestures';
import { useTranslation } from '../../../hooks/useTranslation';

const SNAP_THRESHOLD_PX = 8;
const MIN_ZOOM = 10;
const MAX_ZOOM = 100;
const TOUCH_HANDLE_WIDTH = 24;
interface TimelineProps {
  tracks: Track[];
  clips: Clip[];
  currentTime: number;
  duration: number;
  timelineZoom: number;
  selectedClipId: string | null;
  selectedClipIds?: string[];
  toolMode: ToolMode;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  snappingEnabled?: boolean;
  markers?: TimelineMarker[];
  onToolModeChange: (mode: ToolMode) => void;
  onZoomChange: (zoom: number) => void;
  onClipSelect: (id: string | null, addToSelection?: boolean) => void;
  onClipMouseDown: (e: React.PointerEvent | React.TouchEvent | React.MouseEvent, clip: Clip, mode: 'move' | 'resize-left' | 'resize-right') => void;
  onRippleDelete: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onSeek: (time: number) => void;
  onTrackLock: (trackId: string) => void;
  onTrackHide: (trackId: string) => void;
  onSnappingToggle?: () => void;
  onMarkerAdd?: (time: number) => void;
  onMarkerDelete?: (id: string) => void;
  onClipDuplicate?: (clipId: string) => void;
}
export const Timeline = ({
  tracks,
  clips,
  currentTime,
  duration,
  timelineZoom,
  selectedClipId,
  selectedClipIds = [],
  toolMode,
  scrollContainerRef,
  snappingEnabled = true,
  markers = [],
  onToolModeChange,
  onZoomChange,
  onClipSelect,
  onClipMouseDown,
  onRippleDelete,
  onDragOver,
  onDrop,
  onSeek,
  onTrackLock,
  onTrackHide,
  onSnappingToggle,
  onMarkerAdd,
  onMarkerDelete,
  onClipDuplicate,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [snapIndicator, setSnapIndicator] = useState<number | null>(null);
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [longPressClip, setLongPressClip] = useState<string | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const initialPinchZoomRef = useRef<number>(timelineZoom);

  const { handlers: touchHandlers } = useTouchGestures({
    onPinch: (scale, center) => {
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialPinchZoomRef.current * scale));
      onZoomChange(Math.round(newZoom));
    },
    onPinchStart: () => {
      initialPinchZoomRef.current = timelineZoom;
    },
    onDoubleTap: (position) => {
      if (!scrollContainerRef.current) return;
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const offsetX = position.x - rect.left + scrollContainerRef.current.scrollLeft;
      const seekTime = Math.max(0, Math.min(duration, offsetX / timelineZoom));
      onSeek(seekTime);
    },
    onLongPress: (position) => {
      if (!scrollContainerRef.current) return;
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const offsetX = position.x - rect.left + scrollContainerRef.current.scrollLeft;
      const clickTime = offsetX / timelineZoom;
      
      const clickedClip = clips.find(clip => 
        clickTime >= clip.startTime && clickTime <= clip.startTime + clip.duration
      );
      
      if (clickedClip) {
        setLongPressClip(clickedClip.id);
        onClipSelect(clickedClip.id);
      }
    },
  });

  useEffect(() => {
    if (longPressClip) {
      const timer = setTimeout(() => setLongPressClip(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [longPressClip]);

  const snapPoints = useMemo(() => {
    const points: number[] = [0, currentTime];
    clips.forEach(clip => {
      points.push(clip.startTime);
      points.push(clip.startTime + clip.duration);
    });
    markers.forEach(marker => points.push(marker.time));
    return [...new Set(points)].sort((a, b) => a - b);
  }, [clips, currentTime, markers]);
  const getSnappedTime = useCallback((time: number): number => {
    if (!snappingEnabled) return time;
    for (const point of snapPoints) {
      const distancePx = Math.abs((time - point) * timelineZoom);
      if (distancePx < SNAP_THRESHOLD_PX) {
        setSnapIndicator(point);
        setTimeout(() => setSnapIndicator(null), 300);
        return point;
      }
    }
    return time;
  }, [snappingEnabled, snapPoints, timelineZoom]);
  const isClipSelected = useCallback((clipId: string): boolean => {
    return clipId === selectedClipId || selectedClipIds.includes(clipId);
  }, [selectedClipId, selectedClipIds]);
  const handleClipClick = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    const addToSelection = e.shiftKey || e.ctrlKey || e.metaKey;
    onClipSelect(clipId, addToSelection);
  }, [onClipSelect]);
  const handleAddMarker = useCallback(() => {
    onMarkerAdd?.(currentTime);
  }, [currentTime, onMarkerAdd]);
  const handleDeleteSelected = useCallback(() => {
    if (selectedClipIds.length > 0) {
      selectedClipIds.forEach(id => onRippleDelete(id));
    } else if (selectedClipId) {
      onRippleDelete(selectedClipId);
    }
  }, [selectedClipId, selectedClipIds, onRippleDelete]);
  return (
    <div 
      ref={timelineContainerRef}
      className="col-span-12 bg-surface-darkest border-t border-white/5 flex flex-col relative z-10 h-full overflow-hidden touch-manipulation"
      {...touchHandlers}
    >
      <div className="h-12 sm:h-10 bg-background border-b border-white/5 flex items-center justify-between px-2 sm:px-3 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          {isMobile ? (
            <button
              onClick={() => setShowMobileTools(!showMobileTools)}
              className={`p-2.5 sm:p-1.5 rounded-lg transition-colors touch-target active:scale-95 ${showMobileTools ? 'bg-blue-600 text-white' : 'text-gray-400 active:bg-white/10'}`}
              type="button"
              aria-label="Toggle tools"
            >
              <Menu size={20} />
            </button>
          ) : (
            <>
              <button
                onClick={() => onToolModeChange('pointer')}
                className={`p-2.5 sm:p-1.5 rounded-lg transition-colors touch-target ${toolMode === 'pointer' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title={t('common.selectionTool')}
                type="button"
              >
                <MousePointer2 size={18} />
              </button>
              <button
                onClick={() => onToolModeChange('razor')}
                className={`p-2.5 sm:p-1.5 rounded-lg transition-colors touch-target ${toolMode === 'razor' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title={t('common.splitTool')}
                type="button"
              >
                <Scissors size={18} />
              </button>
              <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
              <button
                onClick={onSnappingToggle}
                className={`p-2.5 sm:p-1.5 rounded-lg transition-colors touch-target ${snappingEnabled ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title={snappingEnabled ? 'Disable Snapping (S)' : 'Enable Snapping (S)'}
                type="button"
              >
                <Magnet size={18} />
              </button>
              <button
                onClick={handleAddMarker}
                className="p-2.5 sm:p-1.5 rounded-lg text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors touch-target hidden sm:flex"
                title={t('common.addMarker')}
                type="button"
              >
                <Flag size={18} />
              </button>
              <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
              <button
                onClick={() => selectedClipId && onClipDuplicate?.(selectedClipId)}
                disabled={!selectedClipId && selectedClipIds.length === 0}
                className="p-2.5 sm:p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 disabled:opacity-30 transition-colors touch-target hidden sm:flex"
                title="Duplicate (Ctrl+D)"
                type="button"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={!selectedClipId && selectedClipIds.length === 0}
                className="p-2.5 sm:p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 transition-colors touch-target"
                title="Delete (Del)"
                type="button"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
          {selectedClipIds.length > 1 && (
            <span className="text-[10px] text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full ml-1">
              {selectedClipIds.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => onZoomChange(Math.max(MIN_ZOOM, timelineZoom - 10))}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors touch-target"
            type="button"
            aria-label="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            value={timelineZoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
            className="w-20 sm:w-32 h-2 bg-zinc-700 rounded-lg accent-blue-500 touch-target"
          />
          <button 
            onClick={() => onZoomChange(Math.min(MAX_ZOOM, timelineZoom + 10))}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors touch-target"
            type="button"
            aria-label="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {showMobileTools && isMobile && (
        <div className="absolute top-12 left-0 right-0 bg-zinc-900 border-b border-white/10 p-3 z-40 flex items-center justify-around animate-slide-in-up">
          <button
            onClick={() => { onToolModeChange('pointer'); setShowMobileTools(false); }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl touch-target ${toolMode === 'pointer' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            type="button"
          >
            <MousePointer2 size={22} />
            <span className="text-[10px]">Select</span>
          </button>
          <button
            onClick={() => { onToolModeChange('razor'); setShowMobileTools(false); }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl touch-target ${toolMode === 'razor' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
            type="button"
          >
            <Scissors size={22} />
            <span className="text-[10px]">Split</span>
          </button>
          <button
            onClick={() => { onSnappingToggle?.(); setShowMobileTools(false); }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl touch-target ${snappingEnabled ? 'bg-yellow-600 text-white' : 'text-gray-400'}`}
            type="button"
          >
            <Magnet size={22} />
            <span className="text-[10px]">Snap</span>
          </button>
          <button
            onClick={() => { handleAddMarker(); setShowMobileTools(false); }}
            className="flex flex-col items-center gap-1 p-3 rounded-xl text-gray-400 touch-target"
            type="button"
          >
            <Flag size={22} />
            <span className="text-[10px]">Marker</span>
          </button>
          <button
            onClick={() => { selectedClipId && onClipDuplicate?.(selectedClipId); setShowMobileTools(false); }}
            disabled={!selectedClipId && selectedClipIds.length === 0}
            className="flex flex-col items-center gap-1 p-3 rounded-xl text-gray-400 disabled:opacity-30 touch-target"
            type="button"
          >
            <Copy size={22} />
            <span className="text-[10px]">Copy</span>
          </button>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-24 sm:w-40 bg-background border-r border-white/5 flex flex-col pt-6 z-20 shadow-lg shrink-0">
          {tracks.map((track) => (
            <div key={track.id} className="h-20 border-b border-white/5 flex flex-col justify-center px-2 sm:px-4 bg-background">
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] sm:text-[11px] font-bold ${track.type === 'video' ? 'text-blue-400' : 'text-green-400'} truncate max-w-[60px] sm:max-w-[100px]`}>{track.label}</span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrackLock(track.id);
                    }}
                    className={`p-1.5 rounded transition-colors touch-target-sm ${track.isLocked ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                    title={track.isLocked ? 'Unlock track' : 'Lock track'}
                    type="button"
                  >
                    <Lock size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrackHide(track.id);
                    }}
                    className={`p-1.5 rounded transition-colors touch-target-sm ${track.isHidden ? 'text-red-400' : 'text-gray-600 hover:text-white'}`}
                    title={track.isHidden ? 'Show track' : 'Hide track'}
                    type="button"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          className={`flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-black relative select-none touch-pan-x overscroll-contain ${toolMode === 'razor' ? 'cursor-cell' : 'cursor-default'}`}
          onClick={() => onClipSelect(null)}
          ref={scrollContainerRef}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <div
            className="h-6 bg-background border-b border-white/5 sticky top-0 z-30 w-full min-w-full cursor-pointer"
            onClick={(e) => {
              if (!scrollContainerRef.current) return;
              const rect = scrollContainerRef.current.getBoundingClientRect();
              const offsetX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft;
              const seekTime = Math.max(0, Math.min(duration, offsetX / timelineZoom));
              onSeek(seekTime);
            }}
          >
            <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none" style={{ width: `${duration * timelineZoom}px` }}>
              {[...Array(Math.floor(duration) + 1)].map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-white/20 text-[9px] text-gray-500 pl-1 pt-1" style={{ left: `${i * timelineZoom}px` }}>
                  {i % 5 === 0 && <span>{i}s</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="relative pt-0 min-w-full h-full" style={{ width: `${duration * timelineZoom}px` }}>
            {tracks.map((_, i) => <div key={i} className="h-20 border-b border-white/5 bg-white/[0.01]" />)}
            {}
            <div className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none" style={{ left: `${currentTime * timelineZoom}px` }}>
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-red-500 rotate-45 rounded-[1px]" />
            </div>
            {}
            {snapIndicator !== null && (
              <div 
                className="absolute top-0 bottom-0 w-px bg-yellow-400 z-40 pointer-events-none animate-pulse"
                style={{ left: `${snapIndicator * timelineZoom}px` }}
              />
            )}
            {}
            {markers.map((marker) => (
              <div
                key={marker.id}
                className="absolute top-0 bottom-0 w-px z-30 cursor-pointer group/marker"
                style={{ left: `${marker.time * timelineZoom}px`, backgroundColor: marker.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSeek(marker.time);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onMarkerDelete?.(marker.id);
                }}
              >
                <div 
                  className="absolute -top-1 -left-2 w-4 h-4 flex items-center justify-center"
                  style={{ backgroundColor: marker.color }}
                >
                  <Flag size={10} className="text-white" />
                </div>
                <div className="absolute top-5 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover/marker:opacity-100 transition-opacity">
                  {marker.label}
                </div>
              </div>
            ))}
            {}
            {clips.map((clip) => {
              const trackIndex = tracks.findIndex((t) => t.id === clip.trackId);
              if (trackIndex === -1) return null;
              const selected = isClipSelected(clip.id);
              const isLongPressed = longPressClip === clip.id;
              const clipWidth = clip.duration * timelineZoom;
              const showHandles = selected || isLongPressed || !isMobile;
              
              return (
                <div
                  key={clip.id}
                  onClick={(e) => handleClipClick(e, clip.id)}
                  onPointerDown={(e) => {
                    if (e.pointerType === 'mouse' && e.button === 0) {
                      onClipMouseDown(e, clip, 'move');
                    }
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const touchX = touch.clientX - rect.left;

                    if (touchX < TOUCH_HANDLE_WIDTH && showHandles) {
                      e.stopPropagation();
                      onClipMouseDown(e, clip, 'resize-left');
                    } else if (touchX > rect.width - TOUCH_HANDLE_WIDTH && showHandles) {
                      e.stopPropagation();
                      onClipMouseDown(e, clip, 'resize-right');
                    }
                  }}
                  className={`absolute h-16 top-2 rounded-md border overflow-hidden shadow-sm flex flex-col justify-between group touch-manipulation ${
                    selected 
                      ? 'border-white ring-2 ring-blue-500/50 z-20' 
                      : isLongPressed
                        ? 'border-yellow-400 ring-2 ring-yellow-500/50 z-20'
                        : 'border-transparent ring-1 ring-black/20 z-10 hover:ring-white/30'
                  } ${toolMode === 'razor' ? 'cursor-cell' : 'cursor-pointer'}`}
                  style={{
                    left: `${clip.startTime * timelineZoom}px`,
                    width: `${clipWidth}px`,
                    top: `${trackIndex * TRACK_HEIGHT_PX + 2}px`,
                    minWidth: isMobile ? '60px' : '40px',
                  }}
                >
                  <div className={`absolute inset-0 opacity-80 ${clip.color}`} />
                  
                  {clip.type === 'audio' && clip.waveformData && (
                    <div className="absolute inset-0 flex items-center justify-around px-1 opacity-40">
                      {clip.waveformData.slice(0, Math.floor(clip.duration * 10)).map((height, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-white rounded-full"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="relative z-10 px-2 py-1 flex items-center justify-between">
                    <span className="text-[10px] sm:text-[10px] font-bold text-white truncate drop-shadow-md">{clip.title}</span>
                    {selected && selectedClipIds.length > 1 && (
                      <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                        {selectedClipIds.indexOf(clip.id) + 1}
                      </span>
                    )}
                  </div>
                  
                  {clip.properties.keyframes && clip.properties.keyframes.length > 0 && (
                    <div className="absolute bottom-1 left-0 right-0 h-2 flex items-center px-1">
                      {clip.properties.keyframes.map((kf) => (
                        <div
                          key={kf.id}
                          className="absolute w-2 h-2 bg-yellow-400 rotate-45 rounded-[1px]"
                          style={{ left: `${(kf.time / clip.duration) * 100}%` }}
                          title={`${kf.property}: ${kf.value}`}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onClipMouseDown(e, clip, 'resize-left');
                    }}
                    className={`absolute left-0 top-0 bottom-0 bg-white/30 cursor-col-resize z-20 transition-all ${
                      showHandles ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    style={{ width: isMobile ? `${TOUCH_HANDLE_WIDTH}px` : '6px' }}
                  >
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/60 rounded-full transform -translate-x-1/2 my-2" />
                  </div>
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      onClipMouseDown(e, clip, 'resize-right');
                    }}
                    className={`absolute right-0 top-0 bottom-0 bg-white/30 cursor-col-resize z-20 transition-all ${
                      showHandles ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    style={{ width: isMobile ? `${TOUCH_HANDLE_WIDTH}px` : '6px' }}
                  >
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/60 rounded-full transform -translate-x-1/2 my-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};