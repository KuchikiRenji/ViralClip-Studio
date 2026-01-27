export type TabType = 'templates' | 'script' | 'voices' | 'background' | 'timeline' | 'export';
export type TemplateBuilderTab = 'gallery' | 'conversation' | 'timeline' | 'preview' | 'export';
export type TemplateType = 'ios' | 'tinder' | 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'discord' | 'slack' | 'snapchat' | 'facebook';
export type CardAnimationType = 'none' | 'fade' | 'slide' | 'bounce';
export type MessageSender = 'left' | 'right';
export type TextAnimationType = 'none' | 'fade' | 'slide-up' | 'typewriter' | 'typing';
export type ScriptMode = 'manual' | 'paste' | 'ai';
export type BackgroundCategory = 'all' | 'gaming' | 'nature' | 'abstract';
export type ExportFormat = 'screen-recording' | 'first-person-pov' | 'clean-chat' | 'social-media';
export type NotificationStyle = 'banner' | 'lock-screen' | 'badge';
export type ConversationType = 'personal' | 'group' | 'customer-service' | 'business';
export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  avatarFile?: File;
  color?: string;
  position: 'left' | 'right';
}

export interface Message {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  sender: MessageSender;
  delay: number;
  animation: TextAnimationType;
  videoUrl?: string;
  videoFile?: File;
  videoThumbnail?: string;
  typingSpeed?: number;
  readStatus?: 'sent' | 'delivered' | 'read';
  timestamp?: Date;
  reactions?: string[];
}

export interface TemplateConfig {
  id: string;
  name: string;
  platform: TemplateType;
  previewImage: string;
  sampleConversation: Message[];
  features: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface TimingConfig {
  messageDelay: number;
  typingSpeed: number;
  readDelay: number;
  videoSyncOffset: number;
}

export interface ExportConfig {
  format: ExportFormat;
  includeTypingSounds: boolean;
  includeNotificationSounds: boolean;
  loopConversation: boolean;
  addEndingCTA: boolean;
  ctaText?: string;
  watermark?: string;
  resolution: '720p' | '1080p' | '4k';
  frameRate: 24 | 30 | 60;
}

export interface NotificationConfig {
  style: NotificationStyle;
  showBadge: boolean;
  badgeCount: number;
  previewText: string;
  appIcon?: string;
  dismissAnimation: boolean;
}
export interface ClonedVoice {
  id: string;
  name: string;
  createdAt: string;
}
export interface TextStoryState {
  currentTab: TabType;
  contactName: string;
  profilePhoto: string | null;
  profilePhotoFile: File | null;
  cardAnimation: CardAnimationType;
  darkMode: boolean;
  selectedTemplate: TemplateType;
  messages: Message[];
  leftVoice: string;
  rightVoice: string;
  selectedBackground: string;
  backgroundSource: 'library' | 'upload';
  backgroundCategory: BackgroundCategory;
  uploadedBackgroundFile: File | null;
  uploadedBackgroundUrl: string | null;
  scriptMode: ScriptMode;
  voiceCategory: string;
  voiceSearchQuery: string;
  clonedVoices: ClonedVoice[];
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isGenerating: boolean;
  generationProgress: number;
  isGenerated: boolean;
  pastedScript: string;
  aiPrompt: string;
  visibleMessageIndex: number;
  isTyping: boolean;
  currentTypingText: string;
  validationError: string | null;
  isPreviewingVoice: boolean;
  isExporting: boolean;
  exportProgress: number;
  exportedBlob: Blob | null;
}
export interface TextStoryProps {
  onBack: () => void;
}

export interface TemplateBuilderProps {
  onBack: () => void;
  onComplete?: (state: TemplateBuilderState) => void;
}

export interface TemplateBuilderState {
  selectedTemplate: TemplateConfig | null;
  participants: Participant[];
  messages: Message[];
  timingConfig: TimingConfig;
  exportConfig: ExportConfig;
  notificationConfig: NotificationConfig;
  isPlaying: boolean;
  currentTime: number;
  isTyping: boolean;
  currentTypingMessage: Message | null;
}

export interface RecentStory {
  id: string;
  title: string;
  template: TemplateType;
  createdAt: string;
  thumbnail: string;
  contactName: string;
  messages: Message[];
  darkMode: boolean;
}