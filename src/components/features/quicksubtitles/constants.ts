import type { QuickSubtitlesState } from './types';
export { GENERATION } from '../../../constants/generation';

export const LANGUAGES = [
  { id: 'en', code: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'es', code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { id: 'fr', code: 'fr', name: 'French', flag: '🇫🇷' },
  { id: 'de', code: 'de', name: 'German', flag: '🇩🇪' },
  { id: 'it', code: 'it', name: 'Italian', flag: '🇮🇹' },
  { id: 'pt', code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { id: 'ru', code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { id: 'ja', code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { id: 'ko', code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { id: 'zh', code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { id: 'ar', code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { id: 'hi', code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export const INITIAL_STATE: QuickSubtitlesState = {
  videoUrl: '',
  uploadedFile: null,
  uploadedFileUrl: null,
  selectedLanguage: 'en',
  subtitles: [],
  isPlaying: false,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  isGenerating: false,
  generationProgress: 0,
  isGenerated: false,
  exportedBlob: null,
};
