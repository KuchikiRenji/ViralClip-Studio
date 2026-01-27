export interface ProcessingState {
  status: 'idle' | 'loading' | 'processing' | 'complete' | 'error';
  progress: number;
  errorMessage: string | null;
}

export type AspectRatio = '9:16' | '16:9' | '1:1';

export type VisualStyle = 'gameplay' | 'cinematic' | 'minimal' | 'vibrant' | 'dark' | 'light';

export type InputType = 'topic' | 'url' | 'file';

export type ViewType =
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'auth-callback'
  | 'home'
  | 'library'
  | 'profile'
  | 'pricing'
  | 'services'
  | 'edit-video'
  | 'create-story'
  | 'create-image'
  | 'video-ranking'
  | 'text-story'
  | 'story-video'
  | 'split-screen'
  | 'auto-clipping'
  | 'voice-clone'
  | 'video-transcriber'
  | 'video-downloader'
  | 'download-instagram'
  | 'download-tiktok'
  | 'download-youtube'
  | 'quick-subtitles'
  | 'reddit-video'
  | 'background-remover'
  | 'vocal-remover'
  | 'mp3-converter'
  | 'video-compressor'
  | 'audio-balancer'
  | 'speech-enhancer'
  | 'veo3-video'
  | 'clash';

export type CreationMode =
  | 'story'
  | 'text-story'
  | 'ranking'
  | 'split-screen'
  | 'conversation'
  | 'viral-clips'
  | 'text'
  | 'reddit'
  | 'instagram'
  | 'x'
  | 'gameplay';

export interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}
