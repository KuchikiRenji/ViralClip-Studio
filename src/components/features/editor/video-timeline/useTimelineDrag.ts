import { useState, useCallback, useEffect, useRef } from 'react';
import { Clip } from '../../../../types';
import { TimelineTrack, DragOperation, DropTarget, SnapIndicator } from './types';
import { MIN_CLIP_DURATION_SECONDS, pixelsToTime } from './constants';

interface UseTimelineDragProps {
  clips: Clip[];
  tracks: TimelineTrack[];
  zoom: number;
  duration: number;
  scrollLeft: number;
  getSnappedTime: (time: number, excludeClipId?: string) => { time: number; snapped: boolean; snapType?: string };
  onClipsChange: (clips: Clip[]) => void;
  onCurrentTimeChange: (time: number) => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
}

interface UseTimelineDragReturn {
  isDragging: boolean;
  dragOperation: DragOperation | null;
  dropTarget: DropTarget | null;
  snapIndicator: SnapIndicator | null;

  handleClipDragStart: (clipId: string, e: React.MouseEvent) => void;
  handleClipResizeStart: (clipId: string, edge: 'left' | 'right', e: React.MouseEvent) => void;

  handlePlayheadDragStart: (e: React.MouseEvent | { clientX: number; clientY: number; button: number }) => void;
  isDraggingPlayhead: boolean;

  handleExternalDragOver: (e: React.DragEvent) => void;
  handleExternalDrop: (e: React.DragEvent) => DropTarget | null;
}

export const useTimelineDrag = ({
  clips,
  tracks,
  zoom,
  duration,
  scrollLeft,
  getSnappedTime,
  onClipsChange,
  onCurrentTimeChange,
  timelineRef,
}: UseTimelineDragProps): UseTimelineDragReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [dragOperation, setDragOperation] = useState<DragOperation | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [snapIndicator, setSnapIndicator] = useState<SnapIndicator | null>(null);

  const dragStartClipsRef = useRef<Clip[]>([]);

  const getTimelinePosition = useCallback(
    (clientX: number) => {
      if (!timelineRef.current) return 0;
      const rect = timelineRef.current.getBoundingClientRect();
      return clientX - rect.left + scrollLeft;
    },
    [scrollLeft, timelineRef]
  );

  const handleClipDragStart = useCallback(
    (clipId: string, e: React.MouseEvent) => {
      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return;

      const track = tracks.find((t) => t.id === clip.trackId);
      if (track?.isLocked) return;

      setIsDragging(true);
      dragStartClipsRef.current = [...clips];

      setDragOperation({
        type: 'move',
        clipId,
        trackId: clip.trackId,
        startX: e.clientX,
        startY: e.clientY,
        originalStartTime: clip.startTime,
        originalDuration: clip.duration,
        sourceTrackId: clip.trackId,
      });
    },
    [clips, tracks]
  );

  const handleClipResizeStart = useCallback(
    (clipId: string, edge: 'left' | 'right', e: React.MouseEvent) => {
      const clip = clips.find((c) => c.id === clipId);
      if (!clip) return;

      const track = tracks.find((t) => t.id === clip.trackId);
      if (track?.isLocked) return;

      setIsDragging(true);
      dragStartClipsRef.current = [...clips];

      setDragOperation({
        type: edge === 'left' ? 'resize-left' : 'resize-right',
        clipId,
        trackId: clip.trackId,
        startX: e.clientX,
        startY: e.clientY,
        originalStartTime: clip.startTime,
        originalDuration: clip.duration,
      });
    },
    [clips, tracks]
  );

  const handlePlayheadDragStart = useCallback(
    (_e: React.MouseEvent | { clientX: number; clientY: number; button: number }) => {
    setIsDraggingPlayhead(true);
    },
    []
  );

  useEffect(() => {
    if (!isDragging && !isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPlayhead && timelineRef.current) {
        const x = getTimelinePosition(e.clientX);
        const time = pixelsToTime(x, zoom);
        const clampedTime = Math.max(0, Math.min(duration, time));
        const { time: snappedTime, snapped, snapType } = getSnappedTime(clampedTime);

        onCurrentTimeChange(snappedTime);

        if (snapped) {
          setSnapIndicator({ time: snappedTime, type: snapType as SnapIndicator['type'], visible: true });
        } else {
          setSnapIndicator(null);
        }
        return;
      }

      if (!dragOperation || !timelineRef.current) return;

      const deltaX = e.clientX - dragOperation.startX;
      const deltaTime = pixelsToTime(deltaX, zoom);

      if (dragOperation.type === 'move') {
        let newStartTime = Math.max(0, dragOperation.originalStartTime + deltaTime);
        const { time: snappedTime, snapped, snapType } = getSnappedTime(
          newStartTime,
          dragOperation.clipId
        );

        if (snapped) {
          newStartTime = snappedTime;
          setSnapIndicator({ time: snappedTime, type: snapType as SnapIndicator['type'], visible: true });
        } else {
          const clipEndTime = newStartTime + dragOperation.originalDuration;
          const { time: snappedEndTime, snapped: endSnapped, snapType: endSnapType } =
            getSnappedTime(clipEndTime, dragOperation.clipId);

          if (endSnapped) {
            newStartTime = snappedEndTime - dragOperation.originalDuration;
            setSnapIndicator({ time: snappedEndTime, type: endSnapType as SnapIndicator['type'], visible: true });
          } else {
            setSnapIndicator(null);
          }
        }

        onClipsChange(
          clips.map((c) =>
            c.id === dragOperation.clipId ? { ...c, startTime: newStartTime } : c
          )
        );
      } else if (dragOperation.type === 'resize-left') {
        let newStartTime = Math.max(0, dragOperation.originalStartTime + deltaTime);
        const { time: snappedTime, snapped, snapType } = getSnappedTime(
          newStartTime,
          dragOperation.clipId
        );

        if (snapped) {
          newStartTime = snappedTime;
          setSnapIndicator({ time: snappedTime, type: snapType as SnapIndicator['type'], visible: true });
        } else {
          setSnapIndicator(null);
        }

        const maxStartTime =
          dragOperation.originalStartTime +
          dragOperation.originalDuration -
          MIN_CLIP_DURATION_SECONDS;
        newStartTime = Math.min(newStartTime, maxStartTime);

        const newDuration =
          dragOperation.originalDuration -
          (newStartTime - dragOperation.originalStartTime);

        if (newDuration >= MIN_CLIP_DURATION_SECONDS) {
          onClipsChange(
            clips.map((c) =>
              c.id === dragOperation.clipId
                ? { ...c, startTime: newStartTime, duration: newDuration }
                : c
            )
          );
        }
      } else if (dragOperation.type === 'resize-right') {
        let newDuration = Math.max(
          MIN_CLIP_DURATION_SECONDS,
          dragOperation.originalDuration + deltaTime
        );

        const newEndTime = dragOperation.originalStartTime + newDuration;
        const { time: snappedEndTime, snapped, snapType } = getSnappedTime(
          newEndTime,
          dragOperation.clipId
        );

        if (snapped) {
          newDuration = snappedEndTime - dragOperation.originalStartTime;
          setSnapIndicator({ time: snappedEndTime, type: snapType as SnapIndicator['type'], visible: true });
        } else {
          setSnapIndicator(null);
        }

        if (newDuration >= MIN_CLIP_DURATION_SECONDS) {
          onClipsChange(
            clips.map((c) =>
              c.id === dragOperation.clipId ? { ...c, duration: newDuration } : c
            )
          );
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingPlayhead(false);
      setDragOperation(null);
      setDropTarget(null);
      setSnapIndicator(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    isDragging,
    isDraggingPlayhead,
    dragOperation,
    clips,
    zoom,
    duration,
    getSnappedTime,
    onClipsChange,
    onCurrentTimeChange,
    getTimelinePosition,
    timelineRef,
  ]);

  const handleExternalDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';

      if (!timelineRef.current) return;

      const x = getTimelinePosition(e.clientX);
      const time = Math.max(0, pixelsToTime(x, zoom));

      const rect = timelineRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;

      let trackId: string | null = null;
      let cumulativeHeight = 32;

      for (const track of tracks) {
        const trackHeight = track.isCollapsed ? 24 : 56;
        if (y >= cumulativeHeight && y < cumulativeHeight + trackHeight) {
          trackId = track.id;
          break;
        }
        cumulativeHeight += trackHeight;
      }

      if (trackId) {
        const track = tracks.find((t) => t.id === trackId);
        const isValid = track && !track.isLocked;

        setDropTarget({
          trackId,
          time,
          isValid: isValid || false,
        });
      }
    },
    [timelineRef, getTimelinePosition, zoom, tracks]
  );

  const handleExternalDrop = useCallback(
    (e: React.DragEvent): DropTarget | null => {
      e.preventDefault();

      if (!dropTarget || !dropTarget.isValid) {
        setDropTarget(null);
        return null;
      }

      const result = dropTarget;
      setDropTarget(null);
      return result;
    },
    [dropTarget]
  );

  return {
    isDragging,
    dragOperation,
    dropTarget,
    snapIndicator,
    handleClipDragStart,
    handleClipResizeStart,
    handlePlayheadDragStart,
    isDraggingPlayhead,
    handleExternalDragOver,
    handleExternalDrop,
  };
};
