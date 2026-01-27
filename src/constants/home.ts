import {
  Film,
  MessageSquare,
  Video,
  SplitSquareVertical,
  Trophy,
  Zap,
  Mic2,
  Image as ImageIcon,
  Scissors,
  Captions,
  Hash,
  Eraser,
  Music,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import { ViewType, CreationMode } from '../types';

export type FeatureId = 
  | 'text-story'
  | 'story-video'
  | 'split-screen'
  | 'auto-clipping'
  | 'voice-clone'
  | 'video-transcriber'
  | 'quick-subtitles'
  | 'reddit-video'
  | 'veo3-video'
  | 'background-remover'
  | 'mp3-converter'
  | 'video-compressor'
  | 'audio-balancer'
  | 'speech-enhancer'
  | 'video-ranking';

export const FEATURE_BACKGROUND_IMAGES: Record<FeatureId, string> = {
  'text-story': '/Create Text Story.png',
  'story-video': '/story-video.webp',
  'split-screen': '/split-screen.png',
  'auto-clipping': '/auto-clipping-new-CjrCXG6L.png',
  'voice-clone': '/generate-voice-new-zhj6yAo5.webp',
  'video-transcriber': '/enhance-scripts-new-DdNbBHAJ.webp',
  'quick-subtitles': '/Sub.png',
  'reddit-video': '/reddit.png',
  'veo3-video': '/story-video.webp',
  'background-remover': '/background-remover.jpg',
  'mp3-converter': '/vocal-remover.jpg',
  'video-compressor': '/Edit a Video.png',
  'audio-balancer': '/vocal-remover.jpg',
  'speech-enhancer': '/enhance-scripts-new-DdNbBHAJ.webp',
  'video-ranking': '/video-ranking-new-DOzGDFPU.png',
};

export const FEATURE_IMAGE_SCALE: Partial<Record<FeatureId, number>> = {
  'text-story': 1.05,
  'quick-subtitles': 2.0,
};

export const FEATURE_IMAGE_POSITION: Partial<Record<FeatureId, string>> = {
  'text-story': 'center 45%',
  'quick-subtitles': 'center 5%',
};

export interface CreateOption {
  icon: React.ElementType;
  labelKey: string;
  view: ViewType;
  mode?: CreationMode;
  color: string;
  descriptionKey?: string;
}

export const QUICK_TOOLS: CreateOption[] = [
  { icon: Video, labelKey: 'home.veo3Video', view: 'veo3-video', color: 'text-indigo-300', descriptionKey: 'home.veo3VideoDesc' },
  { icon: ImageIcon, labelKey: 'home.createImages', view: 'create-image', color: 'text-blue-400', descriptionKey: 'home.createImagesDesc' },
  { icon: Mic2, labelKey: 'home.cloneVoice', view: 'voice-clone', color: 'text-violet-400', descriptionKey: 'home.cloneVoiceDesc' },
  { icon: Captions, labelKey: 'home.quickSubtitles', view: 'quick-subtitles', color: 'text-amber-400', descriptionKey: 'home.quickSubtitlesDesc' },
  { icon: FileText, labelKey: 'home.videoTranscriber', view: 'video-transcriber', color: 'text-blue-400', descriptionKey: 'home.videoTranscriberDesc' },
  { icon: Eraser, labelKey: 'home.backgroundRemover', view: 'background-remover', color: 'text-rose-400', descriptionKey: 'home.backgroundRemoverDesc' },
];

export const FULL_VIDEO_TOOLS: CreateOption[] = [
  { icon: MessageSquare, labelKey: 'home.createTextStory', view: 'text-story', color: 'text-indigo-400', descriptionKey: 'home.createTextStoryDesc' },
  { icon: Trophy, labelKey: 'home.videoRanking', view: 'video-ranking', color: 'text-yellow-400', descriptionKey: 'home.videoRankingDesc' },
  { icon: Zap, labelKey: 'home.autoClipping', view: 'auto-clipping', color: 'text-pink-400', descriptionKey: 'home.autoClippingDesc' },
  { icon: SplitSquareVertical, labelKey: 'home.splitScreen', view: 'split-screen', color: 'text-cyan-400', descriptionKey: 'home.splitScreenDesc' },
  { icon: Hash, labelKey: 'home.redditVideos', view: 'reddit-video', color: 'text-orange-500', descriptionKey: 'home.redditVideosDesc' },
];

export const CREATE_OPTIONS: CreateOption[] = [
  ...QUICK_TOOLS,
  ...FULL_VIDEO_TOOLS,
  { icon: Film, labelKey: 'home.generateClips', view: 'create-story', mode: 'viral-clips', color: 'text-amber-400' },
  { icon: Video, labelKey: 'home.createStoryVideos', view: 'story-video', color: 'text-orange-400' },
  { icon: Scissors, labelKey: 'home.editVideo', view: 'edit-video', color: 'text-purple-400' },
  { icon: Music, labelKey: 'home.mp3Converter', view: 'mp3-converter', color: 'text-blue-300' },
  { icon: Film, labelKey: 'home.videoCompressor', view: 'video-compressor', color: 'text-blue-300' },
  { icon: SlidersHorizontal, labelKey: 'home.audioBalancer', view: 'audio-balancer', color: 'text-blue-300' },
  { icon: Mic2, labelKey: 'home.speechEnhancer', view: 'speech-enhancer', color: 'text-blue-300' },
];

// Helper function to convert ViewType to FeatureId for FeatureCard
export const viewTypeToFeatureId = (view: string): FeatureId | null => {
  const validFeatureIds: FeatureId[] = [
    'text-story',
    'story-video',
    'split-screen',
    'auto-clipping',
    'voice-clone',
    'video-transcriber',
    'quick-subtitles',
    'reddit-video',
    'veo3-video',
    'background-remover',
    'mp3-converter',
    'video-compressor',
    'audio-balancer',
    'speech-enhancer',
    'video-ranking',
  ];
  return validFeatureIds.includes(view as FeatureId) ? (view as FeatureId) : null;
};
