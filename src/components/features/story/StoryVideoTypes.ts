export type TabType = 'general' | 'subtitles' | 'background' | 'audio';
export type SocialType = 'threads' | 'reddit' | 'instagram' | 'twitter';
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
export interface MusicTrack {
  id: string;
  name: string;
  duration: string;
  src: string;
}
export interface StoryVideoState {
  currentTab: TabType;
  socialType: SocialType;
  script: string;
  aiPrompt: string;
  isGeneratingScript: boolean;
  subtitlesEnabled: boolean;
  selectedSubtitleTemplate: string;
  subtitlePosition: 'top' | 'center' | 'bottom';
  subtitleFont: string;
  subtitleColor: string;
  subtitleSize: number;
  strokeSize: number;
  strokeColor: string;
  subtitleBgColor: string;
  enableSubtitleDrag: boolean;
  selectedBackground: string;
  backgroundSource: 'library' | 'upload';
  uploadedBackgroundFile: File | null;
  uploadedBackgroundUrl: string | null;
  voiceoverEnabled: boolean;
  selectedVoice: string;
  isPreviewingVoice: boolean;
  backgroundMusicEnabled: boolean;
  musicSource: 'library' | 'upload';
  selectedMusic: string;
  uploadedMusicFile: File | null;
  uploadedMusicUrl: string | null;
  musicSearchQuery: string;
  musicVolume: number;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isGenerating: boolean;
  generationProgress: number;
  isGenerated: boolean;
  validationError: string | null;
  isExporting: boolean;
  exportProgress: number;
  exportedBlob: Blob | null;
}
export interface StoryVideoProps {
  onBack: () => void;
}
export interface SocialTypeConfig {
  id: SocialType;
  nameKey: string;
  color: string;
  icon: (props: { className?: string }) => JSX.Element;
}







