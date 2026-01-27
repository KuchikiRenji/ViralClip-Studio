import { TimelineTrack, TimelineConfig } from './types';

export const ZOOM_MIN = 10;
export const ZOOM_MAX = 200;
export const ZOOM_DEFAULT = 50;
export const ZOOM_STEP = 10;

export const TRACK_HEIGHT_PX = 56;
export const TRACK_HEIGHT_COLLAPSED_PX = 24;
export const RULER_HEIGHT_PX = 32;
export const TRACK_HEADER_WIDTH_PX = 160;
export const PLAYHEAD_WIDTH_PX = 2;

export const SNAP_THRESHOLD_PX = 10;

export const MIN_CLIP_DURATION_SECONDS = 0.5;
export const MIN_CLIP_WIDTH_PX = 20;

export const WAVEFORM_BARS_COUNT = 50;
export const WAVEFORM_BAR_GAP = 1;

export const SNAP_INDICATOR_DURATION_MS = 300;
export const TRANSITION_DURATION_MS = 150;

export const FRAME_RATE_OPTIONS = [24, 30, 60] as const;
export const DEFAULT_FRAME_RATE: (typeof FRAME_RATE_OPTIONS)[number] = 30;

export const TRACK_COLORS = {
  video: {
    bg: 'bg-amber-600/80',
    bgHover: 'bg-amber-500/80',
    border: 'border-amber-500',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
  },
  audio: {
    bg: 'bg-green-600/80',
    bgHover: 'bg-green-500/80',
    border: 'border-green-500',
    text: 'text-green-400',
    dot: 'bg-green-500',
  },
  text: {
    bg: 'bg-blue-600/80',
    bgHover: 'bg-blue-500/80',
    border: 'border-blue-500',
    text: 'text-blue-400',
    dot: 'bg-blue-500',
  },
  image: {
    bg: 'bg-purple-600/80',
    bgHover: 'bg-purple-500/80',
    border: 'border-purple-500',
    text: 'text-purple-400',
    dot: 'bg-purple-500',
  },
} as const;

export const DEFAULT_TRACKS: TimelineTrack[] = [
  {
    id: 'v3',
    type: 'video',
    label: 'Overlay',
    isMuted: false,
    isLocked: false,
    isVisible: true,
    isCollapsed: false,
    height: TRACK_HEIGHT_PX,
    order: 0,
  },
  {
    id: 'v2',
    type: 'video',
    label: 'B-Roll',
    isMuted: false,
    isLocked: false,
    isVisible: true,
    isCollapsed: false,
    height: TRACK_HEIGHT_PX,
    order: 1,
  },
  {
    id: 'v1',
    type: 'video',
    label: 'Main Video',
    isMuted: false,
    isLocked: false,
    isVisible: true,
    isCollapsed: false,
    height: TRACK_HEIGHT_PX,
    order: 2,
  },
  {
    id: 'a1',
    type: 'audio',
    label: 'Voiceover',
    isMuted: false,
    isLocked: false,
    isVisible: true,
    isCollapsed: false,
    height: TRACK_HEIGHT_PX,
    order: 3,
  },
  {
    id: 'a2',
    type: 'audio',
    label: 'Music',
    isMuted: false,
    isLocked: false,
    isVisible: true,
    isCollapsed: false,
    height: TRACK_HEIGHT_PX,
    order: 4,
  },
  {
    id: 'a3',
    type: 'audio',
    label: 'SFX',
    isMuted: false,
    isLocked: false,
    isVisible: true,
    isCollapsed: false,
    height: TRACK_HEIGHT_PX,
    order: 5,
  },
];

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  zoom: ZOOM_DEFAULT,
  snapEnabled: true,
  snapThreshold: SNAP_THRESHOLD_PX,
  frameRate: DEFAULT_FRAME_RATE,
  showWaveforms: true,
  showThumbnails: true,
  minClipDuration: MIN_CLIP_DURATION_SECONDS,
};

export const TIMELINE_SHORTCUTS = {
  PLAY_PAUSE: ' ',
  DELETE: ['Delete', 'Backspace'],
  DUPLICATE: 'd',
  SPLIT: 's',
  UNDO: 'z',
  REDO: 'y',
  SELECT_ALL: 'a',
  DESELECT: 'Escape',
  TOGGLE_SNAP: 's',
  FRAME_FORWARD: 'ArrowRight',
  FRAME_BACKWARD: 'ArrowLeft',
  SECOND_FORWARD: 'ArrowRight',
  SECOND_BACKWARD: 'ArrowLeft',
} as const;

export const formatTimeMMSSFF = (seconds: number, frameRate: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * frameRate);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

export const formatTimeMMSS = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const pixelsToTime = (pixels: number, zoom: number): number => {
  return pixels / zoom;
};

export const timeToPixels = (time: number, zoom: number): number => {
  return time * zoom;
};

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
