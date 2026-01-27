export type TabType = 'upload' | 'background' | 'subtitle';
export interface SubtitleTemplate {
  id: string;
  name: string;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  bgColor: string;
  style: 'normal' | 'italic';
  weight: 'normal' | 'bold' | 'black';
  transform: 'none' | 'uppercase';
}
export interface BackgroundVideo {
  id: string;
  src?: string;
  thumbnail: string;
  duration: string;
}
export type SubtitlePosition = 'top' | 'center' | 'bottom' | 'custom';
export type VideoPlacement = 'top' | 'bottom' | 'left' | 'right';
export type SplitVariant = 'classic' | 'vertical';
export type BackgroundSource = 'library' | 'upload';

export interface SubtitleCustomPosition {
  x: number;
  y: number;
}

export interface SplitScreenState {
  currentTab: TabType;
  splitVariant: SplitVariant;
  scriptPrompt: string;
  generatedScript: string;
  videoUrl: string;
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  mainVideoPlacement: VideoPlacement;
  selectedBackground: string;
  backgroundSource: 'library' | 'upload';
  customBackgroundFile: File | null;
  customBackgroundUrl: string | null;
  customBackgroundPlacement: VideoPlacement;
  subtitlesEnabled: boolean;
  selectedSubtitleTemplate: string;
  subtitlePosition: SubtitlePosition;
  subtitleCustomPosition: SubtitleCustomPosition;
  subtitleFont: string;
  subtitleColor: string;
  subtitleSize: number;
  strokeSize: number;
  strokeColor: string;
  subtitleBgColor: string;
  enableSubtitleDrag: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  mainVolume: number;
  backgroundVolume: number;
  splitRatio: number;
  isGenerating: boolean;
  generationProgress: number;
  isGenerated: boolean;
}