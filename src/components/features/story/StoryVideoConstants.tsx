import type { SubtitleTemplate, MusicTrack, SocialTypeConfig, TabType } from './StoryVideoTypes';
export { GENERATION } from '../../../constants/generation';
export const VOICE_PREVIEW_TEXT = 'Hello, this is a preview of the selected voice.';
export const WORDS_PER_SECOND = 2;
export const MAX_VISIBLE_WORDS = 4;
export const MAX_BACKGROUND_FILE_SIZE_MB = 500;
export const MAX_MUSIC_FILE_SIZE_MB = 50;
export const BYTES_PER_MB = 1024 * 1024;
export const TABS: { id: TabType; labelKey: string; icon: string }[] = [
  { id: 'general', labelKey: 'storyVideo.tab.general', icon: '⚙️' },
  { id: 'subtitles', labelKey: 'storyVideo.tab.subtitles', icon: '💬' },
  { id: 'background', labelKey: 'storyVideo.tab.background', icon: '🎬' },
  { id: 'audio', labelKey: 'storyVideo.tab.audio', icon: '🔊' },
];
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.88-.73 2.082-1.146 3.39-1.17 1.066-.02 2.03.124 2.895.433-.07-.469-.186-.907-.347-1.308-.37-.92-1.068-1.397-2.134-1.46-.926-.056-1.762.132-2.364.53l-1.07-1.696c.907-.573 2.12-.876 3.51-.876.164 0 .333.004.503.013 1.597.093 2.834.728 3.578 1.838.591.883.9 2.04.917 3.442.532.178 1.03.407 1.49.686 1.078.653 1.904 1.552 2.388 2.6.76 1.644.834 4.304-1.36 6.45-1.884 1.842-4.166 2.648-7.398 2.672zm-.839-5.778c.906-.05 1.59-.378 2.032-.976.37-.501.61-1.163.716-1.972a7.925 7.925 0 0 0-2.089-.278c-.792.015-1.478.196-1.985.524-.49.316-.755.742-.726 1.168.03.448.327.827.837 1.068.478.227 1.095.342 1.785.342.147 0 .295-.004.43-.012v.136z"/>
  </svg>
);
const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
export const SOCIAL_TYPES: SocialTypeConfig[] = [
  { id: 'threads', nameKey: 'storyVideo.social.threads', color: 'bg-zinc-700', icon: ThreadsIcon },
  { id: 'reddit', nameKey: 'storyVideo.social.reddit', color: 'bg-orange-600', icon: RedditIcon },
  { id: 'instagram', nameKey: 'storyVideo.social.instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: InstagramIcon },
  { id: 'twitter', nameKey: 'storyVideo.social.twitter', color: 'bg-black border border-zinc-600', icon: XIcon },
];
import { DESIGN_TOKENS } from '../../../constants/designTokens';

export const SUBTITLE_TEMPLATES: SubtitleTemplate[] = [
  { id: 'custom', name: 'Custom', fontFamily: 'Arial', color: DESIGN_TOKENS.colors.editor.subtitle.templates.white, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 0, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'normal', transform: 'none' },
  { id: 'none', name: 'None', fontFamily: 'Arial', color: DESIGN_TOKENS.colors.editor.subtitle.templates.white, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 0, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'normal', transform: 'none' },
  { id: 'random', name: 'Random Color', fontFamily: 'Arial Black', color: 'rainbow', strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 2, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'black', transform: 'none' },
  { id: 'quick', name: 'QUICK', fontFamily: 'Arial', color: DESIGN_TOKENS.colors.editor.subtitle.templates.white, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 0, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'normal', transform: 'uppercase' },
  { id: 'impact-white', name: 'THE QUICK', fontFamily: 'Impact', color: DESIGN_TOKENS.colors.editor.subtitle.templates.white, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 2, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'bold', transform: 'uppercase' },
  { id: 'hormozi', name: 'THE QUICK', fontFamily: 'Impact', color: DESIGN_TOKENS.colors.editor.subtitle.templates.yellow, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 3, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'neon-green', name: 'THE QUICK', fontFamily: 'Arial Black', color: DESIGN_TOKENS.colors.editor.subtitle.templates.green, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 2, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'purple', name: 'THE QUICK', fontFamily: 'Arial Black', color: DESIGN_TOKENS.colors.editor.subtitle.templates.purple, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 2, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'black', transform: 'uppercase' },
  { id: 'elegant', name: 'The Quick', fontFamily: 'Georgia', color: DESIGN_TOKENS.colors.editor.subtitle.templates.pink, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 1, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'italic', weight: 'normal', transform: 'none' },
  { id: 'highlight', name: 'The Quick', fontFamily: 'Arial Black', color: DESIGN_TOKENS.colors.editor.text.stroke, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 0, bgColor: DESIGN_TOKENS.colors.editor.subtitle.templates.yellow, style: 'normal', weight: 'black', transform: 'none' },
  { id: 'cursive', name: 'The Quick', fontFamily: 'Brush Script MT', color: DESIGN_TOKENS.colors.editor.subtitle.templates.coral, strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 1, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'italic', weight: 'normal', transform: 'none' },
  { id: 'split', name: 'THE QUICK', fontFamily: 'Arial Black', color: 'split', strokeColor: DESIGN_TOKENS.colors.editor.text.stroke, strokeWidth: 2, bgColor: DESIGN_TOKENS.colors.editor.text.bg, style: 'normal', weight: 'black', transform: 'uppercase' },
];
export const BACKGROUND_VIDEOS = [
  { id: 'minecraft-1', label: 'Minecraft Parkour', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg', duration: '0:15' },
  { id: 'subway-1', label: 'Subway Surfers', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg', duration: '0:15' },
  { id: 'gta-1', label: 'GTA Driving', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg', duration: '1:00' },
  { id: 'satisfying-1', label: 'Satisfying Clips', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg', duration: '0:15' },
  { id: 'nature-1', label: 'Nature Scenery', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg', duration: '0:15' },
  { id: 'abstract-1', label: 'Abstract Motion', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg', duration: '9:56' },
];
export const VOICE_OPTIONS = [
  { id: 'alice', name: 'Alice' },
  { id: 'aria', name: 'Aria' },
  { id: 'adam', name: 'Adam' },
  { id: 'josh', name: 'Josh' },
  { id: 'rachel', name: 'Rachel' },
  { id: 'bella', name: 'Bella' },
];
const MUSIC_PROXY_BASE = '/media/soundhelix/';

const MUSIC_FILES = [
  { id: 'lofi-1', name: 'Lofi Chill Beats', duration: '3:24', file: 'SoundHelix-Song-1.mp3' },
  { id: 'epic-1', name: 'Epic Cinematic', duration: '2:45', file: 'SoundHelix-Song-2.mp3' },
  { id: 'upbeat-1', name: 'Upbeat Energy', duration: '3:10', file: 'SoundHelix-Song-3.mp3' },
  { id: 'ambient-1', name: 'Ambient Dreams', duration: '4:02', file: 'SoundHelix-Song-4.mp3' },
  { id: 'hiphop-1', name: 'Hip Hop Vibes', duration: '2:58', file: 'SoundHelix-Song-5.mp3' },
  { id: 'electronic-1', name: 'Electronic Pulse', duration: '3:33', file: 'SoundHelix-Song-6.mp3' },
] as const;

export const MUSIC_TRACKS: MusicTrack[] = MUSIC_FILES.map((track) => ({
  id: track.id,
  name: track.name,
  duration: track.duration,
  src: `${MUSIC_PROXY_BASE}${track.file}`,
}));
export const FONT_OPTIONS = [
  'BRICKS', 'Arial', 'Impact', 'Georgia', 'Verdana', 'Comic Sans MS', 'Arial Black',
];
export const INITIAL_STATE = {
  currentTab: 'general' as const,
  socialType: 'threads' as const,
  script: '',
  aiPrompt: '',
  isGeneratingScript: false,
  subtitlesEnabled: true,
  selectedSubtitleTemplate: 'hormozi',
  subtitlePosition: 'center' as const,
  subtitleFont: 'BRICKS',
  subtitleColor: '#ff0000',
  subtitleSize: 28,
  strokeSize: 0,
  strokeColor: '#000000',
  subtitleBgColor: '#000000',
  enableSubtitleDrag: false,
  selectedBackground: 'minecraft-1',
  backgroundSource: 'library' as const,
  uploadedBackgroundFile: null,
  uploadedBackgroundUrl: null,
  voiceoverEnabled: true,
  selectedVoice: 'alice',
  isPreviewingVoice: false,
  backgroundMusicEnabled: true,
  musicSource: 'library' as const,
  selectedMusic: 'lofi-1',
  uploadedMusicFile: null,
  uploadedMusicUrl: null,
  musicSearchQuery: '',
  musicVolume: 0.3,
  isPlaying: false,
  isMuted: false,
  currentTime: 0,
  duration: 10,
  isGenerating: false,
  generationProgress: 0,
  isGenerated: false,
  validationError: null,
  isExporting: false,
  exportProgress: 0,
  exportedBlob: null,
};