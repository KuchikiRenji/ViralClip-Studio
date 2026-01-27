import { AspectRatio } from './common';

export interface CanvasElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'shape';
  src?: string;
  content?: string;
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scale: number;
    opacity: number;
  };
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
  style?: Record<string, unknown>;
}

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

export interface EditorProject {
  id: string;
  name: string;
  duration: number;
  aspectRatio: AspectRatio;
  elements: CanvasElement[];
  tracks: TimelineTrack[];
  clips: TimelineClip[];
  backgroundColor: string;
  backgroundImage?: string;
}

export interface EditorProjectData {
  clips: TimelineClip[];
  tracks: TimelineTrack[];
  duration: number;
  aspectRatio: AspectRatio;
  background: {
    color: string;
    image?: string;
  };
  settings: {
    elements: CanvasElement[];
  };
}

export interface StoredEditorProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  data: EditorProjectData;
  thumbnail?: string;
}

export type TextAnimationType = 'none' | 'fade' | 'slide-up' | 'typewriter' | 'zoom';

export type BackgroundType = 'solid' | 'gradient' | 'image';

export type TransitionType = 'none' | 'fade' | 'wipe' | 'slide';

export interface BackgroundConfig {
  type: BackgroundType;
  value: string;
  gradientStops?: [string, string];
  gradientAngle?: number;
  blur: number;
  opacity: number;
}

export type KeyframeProperty = 'scale' | 'positionX' | 'positionY' | 'rotation' | 'opacity' | 'volume';

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';

export interface Keyframe {
  id: string;
  time: number;
  property: KeyframeProperty;
  value: number;
  easing: EasingType;
}

export interface ClipProperties {
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
  opacity: number;
  blendMode?: 'normal' | 'screen' | 'multiply' | 'overlay';
  brightness?: number;
  contrast?: number;
  saturation?: number;
  chromaKeyEnabled?: boolean;
  chromaKeyColor?: string;
  volume: number;
  pan?: number;
  fadeIn?: number;
  fadeOut?: number;
  noiseReduction?: boolean;
  speed: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  outlineColor?: string;
  outlineWidth?: number;
  animation?: TextAnimationType;
  animationDuration?: number;
  keyframes?: Keyframe[];
}

export interface Clip {
  id: string;
  trackId: string;
  mediaId: string;
  type: 'video' | 'audio' | 'text' | 'image';
  title: string;
  startTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  properties: ClipProperties;
  transitionIn?: TransitionType;
  transitionOut?: TransitionType;
  color: string;
  thumbnail?: string;
  isSelected?: boolean;
  waveformData?: number[];
}

export interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  style: CaptionStyle;
}

export type CaptionStylePreset = 'default' | 'tiktok' | 'youtube' | 'netflix' | 'minimal';

export interface CaptionStyle {
  preset: CaptionStylePreset;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'top' | 'center' | 'bottom';
  animation: 'none' | 'fade' | 'pop' | 'word-highlight';
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface Track {
  id: string;
  type: 'video' | 'audio';
  label: string;
  isMuted: boolean;
  isLocked: boolean;
  isHidden: boolean;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'faceless' | 'story' | 'ranking' | 'tutorial' | 'promo';
  aspectRatio: AspectRatio;
  duration: number;
  clips: Clip[];
  tracks: Track[];
}

export interface BrandKit {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headingFont: string;
  logoUrl?: string;
  watermarkUrl?: string;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkOpacity?: number;
}

export interface EditorState {
  clips: Clip[];
  tracks: Track[];
  background: BackgroundConfig;
  duration: number;
}

export interface HistoryState {
  past: EditorState[];
  future: EditorState[];
}

