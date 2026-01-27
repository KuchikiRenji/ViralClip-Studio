import { TemplateType, TabType, CardAnimationType, TextAnimationType } from './types';
import { ASSETS } from '../../../../constants/assets';
export const TABS: { id: TabType; labelKey: string; emoji: string }[] = [
  { id: 'templates', labelKey: 'textStory.tabs.templates', emoji: '📋' },
  { id: 'script', labelKey: 'textStory.tabs.script', emoji: '📝' },
  { id: 'voices', labelKey: 'textStory.tabs.voices', emoji: '🎤' },
  { id: 'background', labelKey: 'textStory.tabs.background', emoji: '🎬' },
];
export const CARD_ANIMATIONS: { id: CardAnimationType; labelKey: string }[] = [
  { id: 'none', labelKey: 'textStory.cardAnim.none' },
  { id: 'fade', labelKey: 'textStory.cardAnim.fade' },
  { id: 'slide', labelKey: 'textStory.cardAnim.slide' },
  { id: 'bounce', labelKey: 'textStory.cardAnim.bounce' },
];
export const TEXT_ANIMATIONS: { id: TextAnimationType; labelKey: string }[] = [
  { id: 'none', labelKey: 'textStory.textAnim.none' },
  { id: 'fade', labelKey: 'textStory.textAnim.fade' },
  { id: 'slide-up', labelKey: 'textStory.textAnim.slideUp' },
  { id: 'typewriter', labelKey: 'textStory.textAnim.typewriter' },
];
export const VOICE_OPTIONS = [
  { id: 'alice', name: 'Alice', gender: 'Female', accent: 'American' },
  { id: 'aria', name: 'Aria', gender: 'Female', accent: 'British' },
  { id: 'adam', name: 'Adam', gender: 'Male', accent: 'American' },
  { id: 'josh', name: 'Josh', gender: 'Male', accent: 'British' },
  { id: 'rachel', name: 'Rachel', gender: 'Female', accent: 'American' },
  { id: 'bella', name: 'Bella', gender: 'Female', accent: 'Australian' },
];
export const BACKGROUND_VIDEOS = [];
export const TEMPLATE_CONFIG: Record<TemplateType, { name: string; bubbleColor: string; replyColor: string; headerIcon?: string }> = {
  ios: { name: 'iOS Messages', bubbleColor: 'bg-zinc-200', replyColor: 'bg-blue-500' },
  tinder: { name: 'Tinder', bubbleColor: 'bg-zinc-200', replyColor: 'bg-pink-500', headerIcon: 'tinder' },
  whatsapp: { name: 'WhatsApp', bubbleColor: 'bg-zinc-200', replyColor: 'bg-emerald-500' },
  instagram: { name: 'Instagram', bubbleColor: 'bg-zinc-200', replyColor: 'bg-purple-500', headerIcon: 'instagram' },
  messenger: { name: 'Messenger', bubbleColor: 'bg-zinc-200', replyColor: 'bg-blue-500', headerIcon: 'messenger' },
  telegram: { name: 'Telegram', bubbleColor: 'bg-zinc-200', replyColor: 'bg-blue-400' },
  discord: { name: 'Discord', bubbleColor: 'bg-zinc-200', replyColor: 'bg-indigo-500' },
  slack: { name: 'Slack', bubbleColor: 'bg-zinc-200', replyColor: 'bg-purple-600' },
  snapchat: { name: 'Snapchat', bubbleColor: 'bg-zinc-200', replyColor: 'bg-yellow-500' },
  facebook: { name: 'Facebook', bubbleColor: 'bg-zinc-200', replyColor: 'bg-blue-600' },
};
export const TEMPLATES: TemplateType[] = ['ios', 'tinder', 'whatsapp', 'instagram', 'messenger'];
export { GENERATION } from '../../../../constants/generation';
export const TYPING_INDICATOR_DURATION_MS = 800;
export const TYPING_SPEED_CPS = 25;
export const DEFAULT_MESSAGE_DELAY_MS = 1000;
export const TYPEWRITER_CHAR_DELAY_MS = 30;
export const VOICE_PREVIEW_TEXT = 'Hello! This is a voice preview.';
export const ASSETS_THUMBNAILS = {
  CHAT: ASSETS.IMAGES.THUMBNAILS.CHAT,
  WOLF: ASSETS.IMAGES.THUMBNAILS.WOLF,
};
import type { RecentStory, Message, MessageSender, TextStoryState } from './types';
export const createInitialMessage = (sender: MessageSender = 'left', content: string = ''): Message => ({
  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  type: 'text',
  content,
  sender,
  delay: 0,
  animation: 'none',
});
export const INITIAL_MESSAGES: Message[] = [];
export const RECENT_STORIES: RecentStory[] = [];
export const INITIAL_STATE: TextStoryState = {
  currentTab: 'templates',
  contactName: '',
  profilePhoto: null,
  profilePhotoFile: null,
  cardAnimation: 'none',
  darkMode: false,
  selectedTemplate: 'ios',
  messages: INITIAL_MESSAGES,
  leftVoice: '',
  rightVoice: '',
  selectedBackground: '',
  backgroundSource: 'library',
  backgroundCategory: 'all',
  uploadedBackgroundFile: null,
  uploadedBackgroundUrl: null,
  scriptMode: 'manual',
  voiceCategory: 'casual',
  voiceSearchQuery: '',
  clonedVoices: [],
  isPlaying: false,
  isMuted: false,
  currentTime: 0,
  duration: 15,
  isGenerating: false,
  generationProgress: 0,
  isGenerated: false,
  pastedScript: '',
  aiPrompt: '',
  visibleMessageIndex: -1,
  isTyping: false,
  currentTypingText: '',
  validationError: null,
  isPreviewingVoice: false,
  isExporting: false,
  exportProgress: 0,
  exportedBlob: null,
};