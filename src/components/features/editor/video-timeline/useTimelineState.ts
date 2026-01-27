import { useState, useCallback, useMemo, useRef } from 'react';
import { Clip, TimelineMarker } from '../../../../types';
import {
  TimelineConfig,
  DragOperation,
  DropTarget,
  ContextMenuState,
  SnapIndicator,
} from './types';
import {
  DEFAULT_TIMELINE_CONFIG,
  SNAP_THRESHOLD_PX,
  pixelsToTime,
  timeToPixels,
} from './constants';

interface UseTimelineStateProps {
  clips: Clip[];
  currentTime: number;
  markers?: TimelineMarker[];
  config?: Partial<TimelineConfig>;
}

interface UseTimelineStateReturn {
  scrollLeft: number;
  scrollTop: number;
  setScrollLeft: (value: number) => void;
  setScrollTop: (value: number) => void;

  dragOperation: DragOperation | null;
  setDragOperation: (op: DragOperation | null) => void;
  dropTarget: DropTarget | null;
  setDropTarget: (target: DropTarget | null) => void;

  contextMenu: ContextMenuState;
  openContextMenu: (x: number, y: number, clipId: string | null, trackId: string | null) => void;
  closeContextMenu: () => void;

  snapIndicator: SnapIndicator | null;
  setSnapIndicator: (indicator: SnapIndicator | null) => void;
  snapPoints: number[];
  getSnappedTime: (time: number, excludeClipId?: string) => { time: number; snapped: boolean; snapType?: string };

  config: TimelineConfig;
  updateConfig: (updates: Partial<TimelineConfig>) => void;

  timeToPixels: (time: number) => number;
  pixelsToTime: (pixels: number) => number;

  timelineRef: React.RefObject<HTMLDivElement | null>;
  tracksContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const useTimelineState = ({
  clips,
  currentTime,
  markers = [],
  config: initialConfig,
}: UseTimelineStateProps): UseTimelineStateReturn => {
  const [config, setConfig] = useState<TimelineConfig>({
    ...DEFAULT_TIMELINE_CONFIG,
    ...initialConfig,
  });

  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const [dragOperation, setDragOperation] = useState<DragOperation | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    clipId: null,
    trackId: null,
  });

  const [snapIndicator, setSnapIndicator] = useState<SnapIndicator | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);

  const snapPoints = useMemo(() => {
    const points: number[] = [0, currentTime];

    markers.forEach((marker) => {
      points.push(marker.time);
    });

    clips.forEach((clip) => {
      points.push(clip.startTime);
      points.push(clip.startTime + clip.duration);
    });

    return [...new Set(points)].sort((a, b) => a - b);
  }, [clips, currentTime, markers]);

  const getSnappedTime = useCallback(
    (time: number, excludeClipId?: string) => {
      if (!config.snapEnabled) {
        return { time, snapped: false };
      }

      const threshold = pixelsToTime(SNAP_THRESHOLD_PX, config.zoom);

      let points = snapPoints;
      if (excludeClipId) {
        const excludedClip = clips.find((c) => c.id === excludeClipId);
        if (excludedClip) {
          points = points.filter(
            (p) =>
              p !== excludedClip.startTime &&
              p !== excludedClip.startTime + excludedClip.duration
          );
        }
      }

      let closestPoint = time;
      let closestDistance = Infinity;
      let snapType: string | undefined;

      for (const point of points) {
        const distance = Math.abs(time - point);
        if (distance < threshold && distance < closestDistance) {
          closestPoint = point;
          closestDistance = distance;

          if (point === currentTime) {
            snapType = 'playhead';
          } else if (markers.some((m) => m.time === point)) {
            snapType = 'marker';
          } else {
            const clipAtPoint = clips.find(
              (c) => c.startTime === point || c.startTime + c.duration === point
            );
            if (clipAtPoint) {
              snapType = clipAtPoint.startTime === point ? 'clip-start' : 'clip-end';
            }
          }
        }
      }

      return {
        time: closestPoint,
        snapped: closestDistance < threshold,
        snapType,
      };
    },
    [config.snapEnabled, config.zoom, snapPoints, clips, currentTime, markers]
  );

  const openContextMenu = useCallback(
    (x: number, y: number, clipId: string | null, trackId: string | null) => {
      setContextMenu({
        isOpen: true,
        x,
        y,
        clipId,
        trackId,
      });
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const updateConfig = useCallback((updates: Partial<TimelineConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const timeToPixelsFn = useCallback(
    (time: number) => timeToPixels(time, config.zoom),
    [config.zoom]
  );

  const pixelsToTimeFn = useCallback(
    (pixels: number) => pixelsToTime(pixels, config.zoom),
    [config.zoom]
  );

  return {
    scrollLeft,
    scrollTop,
    setScrollLeft,
    setScrollTop,
    dragOperation,
    setDragOperation,
    dropTarget,
    setDropTarget,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    snapIndicator,
    setSnapIndicator,
    snapPoints,
    getSnappedTime,
    config,
    updateConfig,
    timeToPixels: timeToPixelsFn,
    pixelsToTime: pixelsToTimeFn,
    timelineRef,
    tracksContainerRef,
  };
};
