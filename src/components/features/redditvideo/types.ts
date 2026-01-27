export interface RedditVideoProps {
  onBack: () => void;
}

export type RedditVideoTab = 'script' | 'style' | 'video' | 'audio';

export type RedditScriptSource = 'reddit' | 'prompt';

export type RedditTone = 'funny' | 'serious' | 'informative';

export type RedditLength = 45 | 60 | 90;

export type SubtitleDisplayMode = 'oneWord' | 'lines';

export interface RedditIntro {
  username: string;
  avatarUrl: string;
  isVerified: boolean;
  description: string;
  reactions: string[];
  likes: number;
  comments: number;
}

export interface BackgroundVideo {
  id: string;
  title: string;
  src?: string;
  thumbnail: string;
  duration: string;
  size: string;
  category: 'gameplay' | 'satisfying' | 'nature' | 'faceless' | 'aesthetic';
  author: string;
  isPremium: boolean;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: 'young' | 'middle-aged';
  language: 'english' | 'multilingual';
  previewUrl?: string;
}

export interface MusicOption {
  id: string;
  name: string;
  duration: string;
  src?: string;
  waveform?: number[];
}

export interface SubtitleStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  animation: 'none' | 'fade' | 'pop' | 'word-highlight';
}

export interface RedditVideoState {
  currentTab: RedditVideoTab;
  scriptSource: RedditScriptSource;
  redditUrl: string;
  storyTopic: string;
  tone: RedditTone;
  language: string;
  lengthSeconds: RedditLength;
  hook: string;
  cta: string;
  intro: RedditIntro;
  scriptContent: string;
  subtitleDisplayMode: SubtitleDisplayMode;
  showIntroCard: boolean;
  isDarkMode: boolean;
  selectedStyle: string;
  selectedBackground: string;
  uploadedBackgroundFile: File | null;
  uploadedBackgroundUrl: string | null;
  introVoice: string;
  scriptVoice: string;
  backgroundMusic: string;
  musicVolume: number;
  voiceVolume: number;
  subtitleStyle: SubtitleStyle;
  generatedIntroAudioUrl: string | null;
  generatedScriptAudioUrl: string | null;
  introDuration: number;
  scriptDuration: number;
  isGenerating: boolean;
  generationProgress: number;
  isGenerated: boolean;
  validationError: string | null;
  generationError: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isMuted: boolean;
}
