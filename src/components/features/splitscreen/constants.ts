import type { TabType, SubtitleTemplate, BackgroundVideo, SplitScreenState } from './types';
export { GENERATION } from '../../../constants/generation';
export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 48;
export const STROKE_SIZE_MIN = 0;
export const STROKE_SIZE_MAX = 10;
export const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'upload', label: 'Upload Video', icon: '🎬' },
  { id: 'background', label: 'Background Video', icon: '🎬' },
  { id: 'subtitle', label: 'Subtitle', icon: '💬' },
];
export const SUBTITLE_TEMPLATES: SubtitleTemplate[] = [
  { id: 'none', name: 'None', fontFamily: 'var(--type-family-display)', color: 'var(--color-text-primary)', strokeColor: 'transparent', strokeWidth: 0, bgColor: 'transparent', style: 'normal', weight: 'normal', transform: 'none' },
  { id: 'operator', name: 'Operator', fontFamily: 'var(--type-family-display)', color: 'var(--color-text-primary)', strokeColor: 'color-mix(in srgb, var(--color-background-primary) 85%, transparent)', strokeWidth: 2, bgColor: 'transparent', style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'brand-primary', name: 'Primary', fontFamily: 'var(--type-family-display)', color: 'var(--color-brand-primary)', strokeColor: 'color-mix(in srgb, var(--color-background-primary) 85%, transparent)', strokeWidth: 2, bgColor: 'transparent', style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'brand-accent', name: 'Accent', fontFamily: 'var(--type-family-display)', color: 'var(--color-brand-accent)', strokeColor: 'color-mix(in srgb, var(--color-background-primary) 85%, transparent)', strokeWidth: 2, bgColor: 'transparent', style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'brand-secondary', name: 'Secondary', fontFamily: 'var(--type-family-display)', color: 'var(--color-brand-secondary)', strokeColor: 'color-mix(in srgb, var(--color-background-primary) 85%, transparent)', strokeWidth: 2, bgColor: 'transparent', style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'highlight', name: 'Highlight', fontFamily: 'var(--type-family-display)', color: 'var(--color-background-primary)', strokeColor: 'transparent', strokeWidth: 0, bgColor: 'var(--color-brand-accent)', style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'mono', name: 'Mono', fontFamily: 'var(--type-family-mono)', color: 'var(--color-text-primary)', strokeColor: 'transparent', strokeWidth: 0, bgColor: 'color-mix(in srgb, var(--color-background-secondary) 75%, transparent)', style: 'normal', weight: 'bold', transform: 'none' },
  { id: 'gradient', name: 'Gradient', fontFamily: 'var(--type-family-display)', color: 'gradient', strokeColor: 'transparent', strokeWidth: 0, bgColor: 'transparent', style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'split', name: 'Split', fontFamily: 'var(--type-family-display)', color: 'split', strokeColor: 'transparent', strokeWidth: 0, bgColor: 'transparent', style: 'normal', weight: 'black', transform: 'uppercase' },
];
// Note: Pexels and Vimeo videos may have CORS/403 restrictions
// Consider hosting videos on your own CDN or using a video proxy service
export const BACKGROUND_VIDEOS: BackgroundVideo[] = [
  // Using sample videos from public CDNs that support CORS
  // Replace these with your own hosted videos for production
  { 
    id: 'minecraft-parkour', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', 
    duration: '10:55' 
  },
  { 
    id: 'gta-stunts', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg', 
    duration: '08:20' 
  },
  { 
    id: 'subway-surfers', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
    thumbnail: '/split-screen.png', 
    duration: '05:00' 
  },
  { 
    id: 'satisfying-soap', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg', 
    duration: '03:00' 
  },
  { 
    id: 'aesthetic-rain', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg', 
    duration: '20:00' 
  },
  { 
    id: 'minimal-desk', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg', 
    duration: '10:00' 
  },
  { 
    id: 'ocean-drone', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg', 
    duration: '09:00' 
  },
  { 
    id: 'city-night', 
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg', 
    duration: '15:00' 
  },
];
export const FONT_OPTIONS = ['var(--type-family-display)', 'var(--type-family-mono)'];
export const INITIAL_STATE: SplitScreenState = {
  currentTab: 'upload',
  splitVariant: 'classic',
  scriptPrompt: '',
  generatedScript: '',
  videoUrl: '',
  uploadedFile: null,
  uploadedFileUrl: null,
  mainVideoPlacement: 'top',
  selectedBackground: '',
  backgroundSource: 'library',
  customBackgroundFile: null,
  customBackgroundUrl: null,
  customBackgroundPlacement: 'bottom',
  subtitlesEnabled: true,
  selectedSubtitleTemplate: 'operator',
  subtitlePosition: 'center',
  subtitleCustomPosition: { x: 50, y: 50 },
  subtitleFont: 'var(--type-family-display)',
  subtitleColor: 'var(--color-text-primary)',
  subtitleSize: 28,
  strokeSize: 0,
  strokeColor: 'color-mix(in srgb, var(--color-background-primary) 85%, transparent)',
  subtitleBgColor: 'transparent',
  enableSubtitleDrag: false,
  isPlaying: false,
  isMuted: false,
  currentTime: 0,
  duration: 15,
  mainVolume: 1,
  backgroundVolume: 0.1,
  splitRatio: 0.5,
  isGenerating: false,
  generationProgress: 0,
  isGenerated: false,
};