import { useState, useCallback } from 'react';
import { Clip, Caption } from '../../../types';
import { DEFAULT_EDITOR_PANEL_STATE, EditorPanelState } from './panels';
import { TimelineTrack, DEFAULT_TRACKS, ZOOM_DEFAULT } from './video-timeline';

export interface TimelineClip {
  id: string;
  startTime: number;
  duration: number;
  trackIndex: number;
  color: string;
  title: string;
}

export interface MediaSource {
  id: string;
  url: string;
  type: 'video' | 'image' | 'audio';
  name: string;
  duration?: number;
  thumbnail?: string;
}

interface HistoryState {
  clips: Clip[];
  captions: Caption[];
  tracks: TimelineTrack[];
  panelState: EditorPanelState;
  backgroundUrl: string;
  backgroundType: 'image' | 'video' | 'color' | 'gradient';
}

const MAX_HISTORY_LENGTH = 50;
const INITIAL_CLIPS: Clip[] = [];

export const useEditVideoState = () => {
  const [showPicker, setShowPicker] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showTimeline, setShowTimeline] = useState(true);
  const [currentSlide] = useState(1);
  const [panelState, setPanelState] = useState<EditorPanelState>(DEFAULT_EDITOR_PANEL_STATE);
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [backgroundType, setBackgroundType] = useState<'image' | 'video' | 'color' | 'gradient'>('image');
  const [gradientColors, setGradientColors] = useState<[string, string] | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [clips, setClips] = useState<Clip[]>(INITIAL_CLIPS);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [tracks, setTracks] = useState<TimelineTrack[]>(DEFAULT_TRACKS);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [timelineZoom, setTimelineZoom] = useState(ZOOM_DEFAULT);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [mediaSources, setMediaSources] = useState<Map<string, MediaSource>>(new Map());

  const addMediaSource = useCallback((source: MediaSource) => {
    setMediaSources(prev => {
      const newMap = new Map(prev);
      newMap.set(source.id, source);
      return newMap;
    });
  }, []);

  const removeMediaSource = useCallback((id: string) => {
    setMediaSources(prev => {
      const newMap = new Map(prev);
      const source = newMap.get(id);
      if (source) {
        URL.revokeObjectURL(source.url);
      }
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  const saveToHistory = useCallback(() => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    const newState: HistoryState = {
      clips: [...clips],
      captions: [...captions],
      tracks: [...tracks],
      panelState: { ...panelState },
      backgroundUrl,
      backgroundType,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > MAX_HISTORY_LENGTH) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });

    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_LENGTH - 1));
  }, [clips, captions, tracks, panelState, backgroundUrl, backgroundType, historyIndex, isUndoRedoAction]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    setIsUndoRedoAction(true);
    const prevState = history[historyIndex - 1];
    setClips(prevState.clips);
    setCaptions(prevState.captions);
    setTracks(prevState.tracks);
    setPanelState(prevState.panelState);
    setBackgroundUrl(prevState.backgroundUrl);
    setBackgroundType(prevState.backgroundType);
    setHistoryIndex(prev => prev - 1);
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    setIsUndoRedoAction(true);
    const nextState = history[historyIndex + 1];
    setClips(nextState.clips);
    setCaptions(nextState.captions);
    setTracks(nextState.tracks);
    setPanelState(nextState.panelState);
    setBackgroundUrl(nextState.backgroundUrl);
    setBackgroundType(nextState.backgroundType);
    setHistoryIndex(prev => prev + 1);
  }, [canRedo, history, historyIndex]);

  const toggleSnap = useCallback(() => setSnapEnabled(prev => !prev), []);
  const togglePlayPause = useCallback(() => setIsPlaying(prev => !prev), []);

  return {
    showPicker,
    setShowPicker,
    isPlaying,
    setIsPlaying,
    togglePlayPause,
    currentTime,
    setCurrentTime,
    showTimeline,
    setShowTimeline,
    currentSlide,
    panelState,
    setPanelState,
    backgroundUrl,
    setBackgroundUrl,
    backgroundType,
    setBackgroundType,
    gradientColors,
    setGradientColors,
    showExportModal,
    setShowExportModal,
    isMuted,
    setIsMuted,
    isFullscreen,
    setIsFullscreen,
    clips,
    setClips,
    captions,
    setCaptions,
    tracks,
    setTracks,
    selectedClipIds,
    setSelectedClipIds,
    timelineZoom,
    setTimelineZoom,
    snapEnabled,
    setSnapEnabled,
    toggleSnap,
    mediaSources,
    setMediaSources,
    addMediaSource,
    removeMediaSource,
    saveToHistory,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  };
};
