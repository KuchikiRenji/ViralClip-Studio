import { MediaAsset, Track, Clip } from '../types';
export const FONTS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Bebas Neue',
  'Courier New',
] as const;
export const INITIAL_TRACKS: Track[] = [
  { id: 'v3', type: 'video', label: 'Overlay / Text', isMuted: false, isLocked: false, isHidden: false },
  { id: 'v2', type: 'video', label: 'B-Roll', isMuted: false, isLocked: false, isHidden: false },
  { id: 'v1', type: 'video', label: 'Main Video', isMuted: false, isLocked: false, isHidden: false },
  { id: 'a1', type: 'audio', label: 'Voiceover', isMuted: false, isLocked: false, isHidden: false },
  { id: 'a2', type: 'audio', label: 'Music', isMuted: false, isLocked: false, isHidden: false },
];
export const INITIAL_CLIPS: Clip[] = [];
export const MOCK_ASSETS: MediaAsset[] = [];
export const TRANSITIONS: MediaAsset[] = [
  { id: 't1', type: 'transition', title: 'Cross Dissolve', src: 'fade', thumbnail: '', duration: 1, fileSize: '0KB', resolution: '', createdAt: '' },
  { id: 't2', type: 'transition', title: 'Wipe Left', src: 'wipe', thumbnail: '', duration: 1, fileSize: '0KB', resolution: '', createdAt: '' },
  { id: 't3', type: 'transition', title: 'Slide Up', src: 'slide', thumbnail: '', duration: 1, fileSize: '0KB', resolution: '', createdAt: '' },
];
export const EDITOR_DEFAULTS = {
  timelineZoom: 20,
  projectDuration: 60,
  autosaveIntervalMs: 30000,
  historyMaxStates: 50,
  minClipDuration: 0.5,
  canvasWidth: 1080,
  canvasHeight: 1920,
} as const;

export const MAX_HISTORY = 50;
export const AUTOSAVE_INTERVAL_MS = 30000;
export const TRACK_HEIGHT_PX = 80;
export const TIMELINE_RULER_HEIGHT_PX = 24;
export const DEFAULT_VIDEO_DURATION_SECONDS = 132;
export const MIN_CLIP_DURATION_SECONDS = 0.5;
export const TIMELINE_ZOOM_MIN = 10;
export const TIMELINE_ZOOM_MAX = 200;
export const WAVEFORM_BARS_COUNT = 100;
export const TIMELINE_MARKER_INTERVAL = 5;
export const SIDEBAR_MOBILE_HEIGHT = '40vh';
export const TIMELINE_COLLAPSED_HEIGHT = '48px';
export const PREVIEW_ASPECT_RATIO = '9/16';
export const SIDEBAR_ICONS_CONFIG = [
  { id: 'background', label: 'Background' },
  { id: 'text', label: 'Text' },
  { id: 'voiceover', label: 'Voice Over' },
  { id: 'talkingHead', label: 'Talking Head' },
  { id: 'audio', label: 'Background Audio' },
  { id: 'sticker', label: 'Sticker' },
  { id: 'animation', label: 'Layer Animations' },
  { id: 'transition', label: 'Slide Transition' },
  { id: 'credits', label: 'Credits' },
  { id: 'captions', label: 'Captions' },
  { id: 'volume', label: 'Volume' },
  { id: 'cta', label: 'Call To Action' },
  { id: 'settings', label: 'Settings' },
] as const;
export const AUDIO_TRACKS_DATA = [
  { id: 'a1', title: 'Sitting On T...', duration: '3:00 min' },
  { id: 'a2', title: 'Anticipation...', duration: '3:04 min' },
  { id: 'a3', title: 'Reggae Chill...', duration: '3:06 min' },
  { id: 'a4', title: 'Playful Hip...', duration: '2:53 min' },
  { id: 'a5', title: 'Showdown 3m...', duration: '3:00 min' },
  { id: 'a6', title: 'Spring 3m...', duration: '3:00 min' },
  { id: 'a7', title: 'Out For A St...', duration: '3:01 min' },
  { id: 'a8', title: 'Two-Way 3m...', duration: '3:01 min' },
] as const;
export const TRANSITION_OPTIONS = [
  { id: 'fade', name: 'Fade', description: 'Smooth fade transition' },
  { id: 'wipe-up', name: 'Wipe Up', description: 'Wipe from bottom to top' },
  { id: 'wipe-down', name: 'Wipe Down', description: 'Wipe from top to bottom' },
  { id: 'wipe-left', name: 'Wipe Left', description: 'Wipe from right to left' },
  { id: 'wipe-right', name: 'Wipe Right', description: 'Wipe from left to right' },
  { id: 'slide', name: 'Slide', description: 'Slide transition' },
  { id: 'zoom', name: 'Zoom In', description: 'Zoom in transition' },
  { id: 'zoom-out', name: 'Zoom Out', description: 'Zoom out transition' },
  { id: 'rotate', name: 'Rotate', description: 'Rotate and fade' },
  { id: 'blur', name: 'Blur', description: 'Blur transition' },
  { id: 'pixelize', name: 'Pixelize', description: 'Pixelated transition' },
  { id: 'morph', name: 'Morph', description: 'Morphing effect' },
] as const;
export const TRANSITION_NAMES = TRANSITION_OPTIONS.map(t => t.name);
export const SAMPLE_PICKER_VIDEOS = [
  { id: 'story_1', title: 'New text Story', duration: '0:45', type: 'story' as const },
  { id: 'story_2', title: 'New story Video', duration: '1:23', type: 'story' as const },
] as const;
export const TEXT_PRESETS = [
  { id: 'heading', label: 'Heading', fontSize: 80, fontWeight: '900' },
  { id: 'subheading', label: 'Subheading', fontSize: 50, fontWeight: '700' },
  { id: 'body', label: 'Body', fontSize: 32, fontWeight: '400' },
  { id: 'caption', label: 'Caption', fontSize: 24, fontWeight: '400' },
] as const;
export const TEXT_ANIMATIONS = [
  'Fade In',
  'Slide Up',
  'Slide Down',
  'Slide Left',
  'Slide Right',
  'Zoom In',
  'Zoom Out',
  'Bounce',
  'Typewriter',
] as const;
export const STICKER_CATEGORIES = ['emojis', 'gifs', 'shapes'] as const;
export const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗'] },
  { name: 'Gestures', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇'] },
  { name: 'Objects', emojis: ['🔥', '💎', '⭐', '✨', '💫', '🌟', '💥', '💯', '🎯', '🎨', '🎭', '🎪', '🎬', '🎤', '🎧', '🎮', '🕹️', '🎰'] },
] as const;
export const SHAPE_CATEGORIES = [
  { name: 'Basic', shapes: ['●', '■', '▲', '◆', '★', '✦', '✧', '✩', '✪', '✫', '✬', '✭'] },
  { name: 'Arrows', shapes: ['→', '←', '↑', '↓', '↔', '↕', '↗', '↘', '↙', '↖', '⇄', '⇅'] },
  { name: 'Symbols', shapes: ['✓', '✗', '✘', '✕', '✖', '✚', '✛', '✜', '✝', '✞', '✟', '✠'] },
] as const;
export const CAPTION_STYLES = [
  { id: 'bottom', label: 'Bottom', position: 'bottom' },
  { id: 'top', label: 'Top', position: 'top' },
  { id: 'center', label: 'Center', position: 'center' },
] as const;
export const CAPTION_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
] as const;