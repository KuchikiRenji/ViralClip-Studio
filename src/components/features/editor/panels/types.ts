export type SidebarPanel = 
  | 'background' 
  | 'text' 
  | 'voiceover' 
  | 'talkingHead' 
  | 'audio' 
  | 'sticker'
  | 'animation' 
  | 'transition' 
  | 'credits' 
  | 'captions' 
  | 'volume' 
  | 'cta' 
  | 'settings' 
  | null;
export type BackgroundTabType = 'images' | 'videos' | 'color' | 'upload' | 'ai';
export type AudioTabType = 'audio' | 'upload';
export type StickerTabType = 'emojis' | 'gifs' | 'shapes';
export type TextAlignment = 'left' | 'center' | 'right';
export interface BackgroundState {
  tab: BackgroundTabType;
  selectedImage: string | null;
  selectedVideo: string | null;
  solidColor: string;
  uploadedFile: File | null;
  aiPrompt: string;
  isGenerating: boolean;
}
export interface TextLayerState {
  id: string;
  text: string;
  content: string;
  font: string;
  fontFamily: string;
  size: number;
  fontSize: number;
  color: string;
  alignment: TextAlignment;
  animation: string;
  presetId: string;
  positionX: number;
  positionY: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}
export interface VoiceOverState {
  selectedVoice: string;
  language: string;
  script: string;
  generatedAudioUrl: string | null;
  isGenerating: boolean;
  uploadedFile: File | null;
  isRecording: boolean;
  recordedAudioUrl: string | null;
}
export interface TalkingHeadState {
  enabled: boolean;
  selectedAvatar: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  size: number;
  shape: 'circle' | 'square' | 'rounded';
}
export interface AudioTrackState {
  id: string;
  title: string;
  name: string;
  url: string;
  volume: number;
  isPlaying?: boolean;
  startTime?: number;
  duration: number;
  type: 'music' | 'sfx' | 'voiceover';
}
export interface VolumeState {
  master: number;
  video: number;
  voiceover: number;
  music: number;
  isMasterMuted: boolean;
  isVideoMuted: boolean;
  isVoiceoverMuted: boolean;
  isMusicMuted: boolean;
}
export interface CaptionState {
  enabled: boolean;
  language: string;
  style: 'bottom' | 'top' | 'center';
  font: string;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  fontSize: number;
}
export interface EditorPanelState {
  background: BackgroundState;
  textLayers: TextLayerState[];
  activeTextLayerId: string | null;
  voiceOver: VoiceOverState;
  talkingHead: TalkingHeadState;
  audioTracks: AudioTrackState[];
  selectedAudioId: string | null;
  volume: VolumeState;
  captions: CaptionState;
  credits: {
    intro: boolean;
    outro: boolean;
  };
  cta: {
    enabled: boolean;
    text: string;
    url: string;
  };
  settings: {
    addLogo: boolean;
    addWatermark: boolean;
    slideDuration: number;
  };
}
export const DEFAULT_BACKGROUND_STATE: BackgroundState = {
  tab: 'images',
  selectedImage: null,
  selectedVideo: null,
  solidColor: '#1a1a2e',
  uploadedFile: null,
  aiPrompt: '',
  isGenerating: false,
};
export const DEFAULT_VOICEOVER_STATE: VoiceOverState = {
  selectedVoice: '',
  language: 'en',
  script: '',
  generatedAudioUrl: null,
  isGenerating: false,
  uploadedFile: null,
  isRecording: false,
  recordedAudioUrl: null,
};
export const DEFAULT_TALKING_HEAD_STATE: TalkingHeadState = {
  enabled: false,
  selectedAvatar: '',
  position: 'bottom-right',
  size: 120,
  shape: 'circle',
};
export const DEFAULT_VOLUME_STATE: VolumeState = {
  master: 100,
  video: 100,
  voiceover: 85,
  music: 60,
  isMasterMuted: false,
  isVideoMuted: false,
  isVoiceoverMuted: false,
  isMusicMuted: false,
};
export const DEFAULT_CAPTION_STATE: CaptionState = {
  enabled: true,
  language: 'en',
  style: 'bottom',
  font: 'Inter',
  color: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 70,
  fontSize: 24,
};
export const createDefaultTextLayer = (id: string): TextLayerState => ({
  id,
  text: 'Enter text...',
  content: 'Enter text...',
  font: 'Inter',
  fontFamily: 'Inter',
  size: 48,
  fontSize: 48,
  color: '#ffffff',
  alignment: 'center',
  animation: 'none',
  presetId: '',
  positionX: 50,
  positionY: 50,
  bold: false,
  italic: false,
  underline: false,
});
export const DEFAULT_EDITOR_PANEL_STATE: EditorPanelState = {
  background: DEFAULT_BACKGROUND_STATE,
  textLayers: [],
  activeTextLayerId: null,
  voiceOver: DEFAULT_VOICEOVER_STATE,
  talkingHead: DEFAULT_TALKING_HEAD_STATE,
  audioTracks: [],
  selectedAudioId: null,
  volume: DEFAULT_VOLUME_STATE,
  captions: DEFAULT_CAPTION_STATE,
  credits: {
    intro: true,
    outro: true,
  },
  cta: {
    enabled: false,
    text: 'Subscribe',
    url: '',
  },
  settings: {
    addLogo: false,
    addWatermark: true,
    slideDuration: 5,
  },
};