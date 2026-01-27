import { useCallback, useMemo, useRef, useState } from 'react';
import { Clip } from '../../../../types';
import {
  VideoEditorTimelineProps,
  TimelineTrack,
  ContextMenuState,
} from './types';
import { TimelineHeader } from './TimelineHeader';
import { TimelineRuler } from './TimelineRuler';
import { TrackHeaderList } from './TrackHeaderList';
import { TrackContent } from './TrackContent';
import { TimelinePlayhead } from './TimelinePlayhead';
import { ContextMenu } from './ContextMenu';
import { useTimelineState } from './useTimelineState';
import { useTimelineDrag } from './useTimelineDrag';
import { useTimelineKeyboard } from './useTimelineKeyboard';
import {
  DEFAULT_FRAME_RATE,
  RULER_HEIGHT_PX,
  TRACK_HEIGHT_PX,
  TRACK_HEIGHT_COLLAPSED_PX,
  SNAP_THRESHOLD_PX,
  generateId,
  timeToPixels,
  pixelsToTime,
} from './constants';

export const VideoEditorTimeline = ({
  tracks,
  clips,
  currentTime,
  duration,
  isPlaying,
  selectedClipIds,
  markers = [],
  zoom,
  snapEnabled,
  frameRate = DEFAULT_FRAME_RATE,
  onTracksChange,
  onClipsChange,
  onCurrentTimeChange,
  onPlayPause,
  onSelectionChange,
  onZoomChange,
  onSnapToggle,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onExternalDrop,
}: VideoEditorTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    clipId: null,
    trackId: null,
  });

  const { getSnappedTime } = useTimelineState({
    clips,
    currentTime,
    markers,
    config: { zoom, snapEnabled, snapThreshold: 10, frameRate, showWaveforms: true, showThumbnails: true, minClipDuration: 0.5 },
  });

  const {
    isDragging,
    dropTarget,
    snapIndicator,
    handleClipDragStart,
    handleClipResizeStart,
    handlePlayheadDragStart,
    isDraggingPlayhead,
    handleExternalDragOver,
    handleExternalDrop,
  } = useTimelineDrag({
    clips,
    tracks,
    zoom,
    duration,
    scrollLeft,
    getSnappedTime,
    onClipsChange,
    onCurrentTimeChange,
    timelineRef,
  });

  const {
    handleSplit,
    handleDuplicate,
    handleDelete,
    handleRippleDelete,
    handleCopy,
    handleCut,
    handlePaste,
    handleTrimStart,
    handleTrimEnd,
    clipboardHasContent,
  } = useTimelineKeyboard({
    clips,
    tracks,
    selectedClipIds,
    currentTime,
    duration,
    frameRate,
    isEnabled: true,
    onClipsChange,
    onSelectionChange,
    onCurrentTimeChange,
    onPlayPause,
    onSnapToggle,
    onUndo,
    onRedo,
  });

  const sortedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.order - b.order),
    [tracks]
  );

  const tracksHeight = useMemo(
    () =>
      sortedTracks.reduce(
        (acc, track) =>
          acc + (track.isCollapsed ? TRACK_HEIGHT_COLLAPSED_PX : TRACK_HEIGHT_PX),
        0
      ),
    [sortedTracks]
  );

  const timelineWidth = timeToPixels(duration, zoom) + 100;

  const handleTrackChange = useCallback(
    (trackId: string, updates: Partial<TimelineTrack>) => {
      onTracksChange(
        tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
      );
    },
    [tracks, onTracksChange]
  );

  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      onTracksChange(tracks.filter((t) => t.id !== trackId));
      onClipsChange(clips.filter((c) => c.trackId !== trackId));
    },
    [tracks, clips, onTracksChange, onClipsChange]
  );

  const handleAddVideoTrack = useCallback(() => {
    const videoTracks = tracks.filter((t) => t.type === 'video');
    const newTrack: TimelineTrack = {
      id: generateId('v'),
      type: 'video',
      label: `Video ${videoTracks.length + 1}`,
      isMuted: false,
      isLocked: false,
      isVisible: true,
      isCollapsed: false,
      height: TRACK_HEIGHT_PX,
      order: 0,
    };
    const updatedTracks = tracks.map((t) => ({ ...t, order: t.order + 1 }));
    onTracksChange([newTrack, ...updatedTracks]);
  }, [tracks, onTracksChange]);

  const handleAddAudioTrack = useCallback(() => {
    const audioTracks = tracks.filter((t) => t.type === 'audio');
    const maxOrder = Math.max(...tracks.map((t) => t.order), 0);
    const newTrack: TimelineTrack = {
      id: generateId('a'),
      type: 'audio',
      label: `Audio ${audioTracks.length + 1}`,
      isMuted: false,
      isLocked: false,
      isVisible: true,
      isCollapsed: false,
      height: TRACK_HEIGHT_PX,
      order: maxOrder + 1,
    };
    onTracksChange([...tracks, newTrack]);
  }, [tracks, onTracksChange]);

  const handleClipClick = useCallback(
    (clipId: string, e: React.MouseEvent) => {
      if (e.shiftKey) {
        const newSelection = new Set(selectedClipIds);
        if (newSelection.has(clipId)) {
          newSelection.delete(clipId);
        } else {
          newSelection.add(clipId);
        }
        onSelectionChange(newSelection);
      } else if (!selectedClipIds.has(clipId)) {
        onSelectionChange(new Set([clipId]));
      }
    },
    [selectedClipIds, onSelectionChange]
  );

  const handleClipDoubleClick = useCallback(() => {
  }, []);

  const handleContextMenu = useCallback(
    (clipId: string, e: React.MouseEvent) => {
      e.preventDefault();
      const clip = clips.find((c) => c.id === clipId);
      setContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        clipId,
        trackId: clip?.trackId || null,
      });
      if (!selectedClipIds.has(clipId)) {
        onSelectionChange(new Set([clipId]));
      }
    },
    [clips, selectedClipIds, onSelectionChange]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDetachAudio = useCallback(() => {
    if (!contextMenu.clipId) return;
    const clip = clips.find((c) => c.id === contextMenu.clipId);
    if (!clip || clip.type !== 'video') return;

    const audioClip: Clip = {
      ...clip,
      id: generateId('audio'),
      type: 'audio',
      trackId: tracks.find((t) => t.type === 'audio')?.id || 'a1',
      title: `${clip.title} (Audio)`,
    };

    onClipsChange([...clips, audioClip]);
  }, [contextMenu.clipId, clips, tracks, onClipsChange]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || isDraggingPlayhead) return;

      const target = e.target as HTMLElement;
      const clickedOnClip = target.closest('[data-clip-id]');
      
      if (clickedOnClip) {
        return;
      }

      onSelectionChange(new Set());

      if (timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + scrollLeft;
        const time = Math.max(0, Math.min(duration, pixelsToTime(x, zoom)));
        onCurrentTimeChange(time);
      }
    },
    [isDragging, isDraggingPlayhead, scrollLeft, duration, zoom, onCurrentTimeChange, onSelectionChange]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        onZoomChange(Math.max(10, Math.min(200, zoom + delta)));
      }
    },
    [zoom, onZoomChange]
  );

  return (
    <div className="flex flex-col h-full bg-surface-darker">
      <TimelineHeader
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        zoom={zoom}
        snapEnabled={snapEnabled}
        selectedClipCount={selectedClipIds.size}
        frameRate={frameRate}
        canUndo={canUndo}
        canRedo={canRedo}
        onPlayPause={onPlayPause}
        onZoomChange={onZoomChange}
        onSnapToggle={onSnapToggle}
        onSplit={handleSplit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onUndo={onUndo || (() => {})}
        onRedo={onRedo || (() => {})}
        onAddVideoTrack={handleAddVideoTrack}
        onAddAudioTrack={handleAddAudioTrack}
      />

      <div className="flex flex-1 overflow-hidden">
        <TrackHeaderList
          tracks={sortedTracks}
          onTrackChange={handleTrackChange}
          onDeleteTrack={handleDeleteTrack}
          onAddVideoTrack={handleAddVideoTrack}
          onAddAudioTrack={handleAddAudioTrack}
        />

        <div
          ref={timelineRef}
          className="flex-1 overflow-auto custom-scrollbar touch-pan-x touch-pan-y momentum-scroll overscroll-contain"
          onScroll={handleScroll}
          onWheel={handleWheel}
          onClick={handleTimelineClick}
          onDragOver={handleExternalDragOver}
          onDrop={(e) => {
            const target = handleExternalDrop(e);
            if (target && target.isValid && onExternalDrop) {
              onExternalDrop(e, target.trackId, target.time);
            }
          }}
        >
          <div
            className="relative"
            style={{ width: timelineWidth, minHeight: '100%' }}
          >
            <TimelineRuler
              duration={duration}
              zoom={zoom}
              frameRate={frameRate}
              scrollLeft={scrollLeft}
            />

            <div ref={tracksContainerRef}>
              {sortedTracks.map((track) => (
                <TrackContent
                  key={track.id}
                  track={track}
                  clips={clips.filter((c) => c.trackId === track.id)}
                  selectedClipIds={selectedClipIds}
                  currentTime={currentTime}
                  zoom={zoom}
                  snapEnabled={snapEnabled}
                  snapThreshold={SNAP_THRESHOLD_PX}
                  onClipClick={handleClipClick}
                  onClipDoubleClick={handleClipDoubleClick}
                  onClipDragStart={handleClipDragStart}
                  onClipResizeStart={handleClipResizeStart}
                  onContextMenu={handleContextMenu}
                />
              ))}
            </div>

            <TimelinePlayhead
              currentTime={currentTime}
              zoom={zoom}
              height={RULER_HEIGHT_PX + tracksHeight}
              onDragStart={handlePlayheadDragStart}
            />

            {snapIndicator?.visible && (
              <div
                className="absolute top-0 w-px bg-blue-400 pointer-events-none z-40 animate-pulse"
                style={{
                  left: timeToPixels(snapIndicator.time, zoom),
                  height: RULER_HEIGHT_PX + tracksHeight,
                }}
              />
            )}

            {dropTarget && dropTarget.isValid && (
              <div
                className="absolute top-0 w-1 bg-green-400 pointer-events-none z-40 rounded"
                style={{
                  left: timeToPixels(dropTarget.time, zoom),
                  height: RULER_HEIGHT_PX + tracksHeight,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <ContextMenu
        state={contextMenu}
        onClose={closeContextMenu}
        onSplit={handleSplit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onRippleDelete={handleRippleDelete}
        onDetachAudio={handleDetachAudio}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onTrimStart={handleTrimStart}
        onTrimEnd={handleTrimEnd}
        clipboardHasContent={clipboardHasContent}
      />
    </div>
  );
};
