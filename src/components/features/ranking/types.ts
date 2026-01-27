export type VideoSourceType = 'link' | 'file';

export interface VideoSource {
  id: string;
  type: VideoSourceType;
  link?: string;
  file?: File;
  thumbnail?: string;
  duration?: number;
  clipDuration?: number;
  trimStart?: number;
  trimEnd?: number;
  caption?: ClipCaption;
}

export interface ClipCaption {
  text: string;
  enabled: boolean;
  format: CaptionFormat;
  position: CaptionPosition;
  animation: CaptionAnimation;
  timing?: {
    showTime: number;
    hideTime: number;
  };
}

export interface CaptionFormat {
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  borderColor?: string;
  borderWidth?: number;
}

export type CaptionPosition = 'top' | 'middle' | 'bottom' | 'custom';

export interface CustomCaptionPosition {
  x: number;
  y: number;
}

export type CaptionAnimation = 'none' | 'fade' | 'slide-up' | 'slide-down' | 'typewriter' | 'pop';

export type TransitionType =
  | 'none'
  | 'fade'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'blur'
  | 'glitch'
  | 'rotate'
  | 'cube';

export interface TransitionSettings {
  type: TransitionType;
  duration: number;
  timingFunction: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

export interface BackgroundMusic {
  file?: File;
  url?: string;
  volume: number;
  fadeIn: boolean;
  fadeOut: boolean;
  ducking: boolean;
  duckingAmount: number;
}

export type ExportQuality = '720p' | '1080p' | '4k';

export interface ExportSettings {
  quality: ExportQuality;
  format: 'webm' | 'mp4' | 'mov';
  fps: 30 | 60;
  bitrate?: number;
}

export interface RankingConfig {
  title: string;
  titleStroke: number;
  titleStrokeColor: string;
  videoHeight: number;
  background: string;
  videos: VideoSource[];
  enableTitleDrag: boolean;
  captionsEnabled: boolean;
  transitionSettings: TransitionSettings;
  backgroundMusic?: BackgroundMusic;
  exportSettings: ExportSettings;
  rankingStyle?: RankingStyle;
  rankingGraphic?: RankingGraphic;
  overlays?: Overlay[];
}

export interface RichTextFormat {
  bold: boolean;
  italic: boolean;
  fontFamily: string;
  fontSize: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export type RankingStyle = 'number' | 'badge' | 'medal' | 'trophy' | 'custom';

export interface RankingGraphic {
  style: RankingStyle;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size: number;
  animation: boolean;
}

export type OverlayType = 'text' | 'image' | 'logo' | 'watermark' | 'lower-third' | 'progress-bar';

export interface Overlay {
  id: string;
  type: OverlayType;
  enabled: boolean;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  content?: string;
  imageUrl?: string;
  imageFile?: File; // File object for persistence
  style?: Record<string, string>;
  animation?: {
    type: string;
    duration: number;
  };
  visibility?: {
    start: number;
    end: number;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: 'gaming' | 'beauty' | 'tech' | 'food' | 'sports' | 'general';
  config: Partial<RankingConfig>;
  createdAt: Date;
}

export interface RankingProject {
  id: string;
  name: string;
  config: RankingConfig;
  lastModified: Date;
  thumbnail?: string;
  version: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: {
    duration: number;
    width: number;
    height: number;
    size: number;
    format: string;
  };
}