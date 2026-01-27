export const BACKGROUND_IMAGES = [
  { id: 'bg-1', url: 'https://picsum.photos/1920/1080?random=1' },
  { id: 'bg-2', url: 'https://picsum.photos/1920/1080?random=2' },
  { id: 'bg-3', url: 'https://picsum.photos/1920/1080?random=3' },
  { id: 'bg-4', url: 'https://picsum.photos/1920/1080?random=4' },
  { id: 'bg-5', url: 'https://picsum.photos/1920/1080?random=5' },
  { id: 'bg-6', url: 'https://picsum.photos/1920/1080?random=6' },
  { id: 'bg-7', url: 'https://picsum.photos/1920/1080?random=7' },
  { id: 'bg-8', url: 'https://picsum.photos/1920/1080?random=8' },
  { id: 'bg-9', url: 'https://picsum.photos/1920/1080?random=9' },
  { id: 'bg-10', url: 'https://picsum.photos/1920/1080?random=10' },
  { id: 'bg-11', url: 'https://picsum.photos/1920/1080?random=11' },
  { id: 'bg-12', url: 'https://picsum.photos/1920/1080?random=12' },
] as const;
export const BACKGROUND_VIDEOS = [
  { id: 'vid-1', url: 'https://picsum.photos/1920/1080?random=13' },
  { id: 'vid-2', url: 'https://picsum.photos/1920/1080?random=14' },
  { id: 'vid-3', url: 'https://picsum.photos/1920/1080?random=15' },
  { id: 'vid-4', url: 'https://picsum.photos/1920/1080?random=16' },
  { id: 'vid-5', url: 'https://picsum.photos/1920/1080?random=17' },
] as const;
export const PRESET_COLORS = [
  '#000000', '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#e94560', '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1',
  '#ffffff', '#f5f5f5', '#e0e0e0', '#9e9e9e', '#424242',
] as const;
export const GRADIENT_PRESETS = [
  { id: 'grad-1', from: '#667eea', to: '#764ba2', label: 'Purple Dream' },
  { id: 'grad-2', from: '#f093fb', to: '#f5576c', label: 'Pink Sunset' },
  { id: 'grad-3', from: '#4facfe', to: '#00f2fe', label: 'Ocean Blue' },
  { id: 'grad-4', from: '#43e97b', to: '#38f9d7', label: 'Mint Fresh' },
  { id: 'grad-5', from: '#fa709a', to: '#fee140', label: 'Warm Glow' },
  { id: 'grad-6', from: '#a8edea', to: '#fed6e3', label: 'Soft Pink' },
  { id: 'grad-7', from: '#ff0844', to: '#ffb199', label: 'Coral' },
  { id: 'grad-8', from: '#0c0c0c', to: '#2d2d2d', label: 'Dark' },
] as const;
export const AI_VOICES = [
  { id: 'voice-1', name: 'Alex', gender: 'male', accent: 'American', preview: '/audio/alex-preview.mp3' },
  { id: 'voice-2', name: 'Sarah', gender: 'female', accent: 'American', preview: '/audio/sarah-preview.mp3' },
  { id: 'voice-3', name: 'James', gender: 'male', accent: 'British', preview: '/audio/james-preview.mp3' },
  { id: 'voice-4', name: 'Emma', gender: 'female', accent: 'British', preview: '/audio/emma-preview.mp3' },
  { id: 'voice-5', name: 'Carlos', gender: 'male', accent: 'Spanish', preview: '/audio/carlos-preview.mp3' },
  { id: 'voice-6', name: 'Sofia', gender: 'female', accent: 'Spanish', preview: '/audio/sofia-preview.mp3' },
  { id: 'voice-7', name: 'Lucas', gender: 'male', accent: 'French', preview: '/audio/lucas-preview.mp3' },
  { id: 'voice-8', name: 'Marie', gender: 'female', accent: 'French', preview: '/audio/marie-preview.mp3' },
  { id: 'voice-9', name: 'Kenji', gender: 'male', accent: 'Japanese', preview: '/audio/kenji-preview.mp3' },
  { id: 'voice-10', name: 'Yuki', gender: 'female', accent: 'Japanese', preview: '/audio/yuki-preview.mp3' },
] as const;
export const VOICE_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
] as const;
export const TALKING_HEAD_AVATARS = [
  { id: 'avatar-1', name: 'Alex', thumbnail: 'https://picsum.photos/200/200?random=18' },
  { id: 'avatar-2', name: 'Sarah', thumbnail: 'https://picsum.photos/200/200?random=19' },
  { id: 'avatar-3', name: 'Mike', thumbnail: 'https://picsum.photos/200/200?random=20' },
  { id: 'avatar-4', name: 'Emily', thumbnail: 'https://picsum.photos/200/200?random=21' },
  { id: 'avatar-5', name: 'David', thumbnail: 'https://picsum.photos/200/200?random=22' },
  { id: 'avatar-6', name: 'Lisa', thumbnail: 'https://picsum.photos/200/200?random=23' },
] as const;
export const AVATAR_POSITIONS = [
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
] as const;
export const AVATAR_SHAPES = [
  { id: 'circle', label: 'Circle' },
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
] as const;
export const MUSIC_LIBRARY = [
  { id: 'music-1', title: 'Chill Lofi Beats', duration: '3:24', mood: 'chill', url: '' },
  { id: 'music-2', title: 'Upbeat Pop Energy', duration: '2:58', mood: 'energetic', url: '' },
  { id: 'music-3', title: 'Epic Cinematic', duration: '4:12', mood: 'dramatic', url: '' },
  { id: 'music-4', title: 'Acoustic Morning', duration: '3:01', mood: 'calm', url: '' },
  { id: 'music-5', title: 'Hip Hop Groove', duration: '2:45', mood: 'urban', url: '' },
  { id: 'music-6', title: 'Electronic Dance', duration: '3:33', mood: 'energetic', url: '' },
  { id: 'music-7', title: 'Motivational Rise', duration: '2:22', mood: 'inspiring', url: '' },
  { id: 'music-8', title: 'Soft Piano', duration: '3:15', mood: 'emotional', url: '' },
  { id: 'music-9', title: 'Rock Anthem', duration: '3:48', mood: 'powerful', url: '' },
  { id: 'music-10', title: 'Jazz Vibes', duration: '4:02', mood: 'smooth', url: '' },
  { id: 'music-11', title: 'Trap Beat', duration: '2:30', mood: 'urban', url: '' },
  { id: 'music-12', title: 'Reggae Summer', duration: '3:06', mood: 'relaxed', url: '' },
] as const;
export const MUSIC_MOODS = [
  { id: 'all', label: 'All' },
  { id: 'chill', label: 'Chill' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'calm', label: 'Calm' },
  { id: 'urban', label: 'Urban' },
  { id: 'inspiring', label: 'Inspiring' },
  { id: 'emotional', label: 'Emotional' },
] as const;
export const LAYER_ANIMATIONS = [
  { id: 'none', label: 'None' },
  { id: 'fade-in', label: 'Fade In' },
  { id: 'fade-out', label: 'Fade Out' },
  { id: 'slide-up', label: 'Slide Up' },
  { id: 'slide-down', label: 'Slide Down' },
  { id: 'slide-left', label: 'Slide Left' },
  { id: 'slide-right', label: 'Slide Right' },
  { id: 'zoom-in', label: 'Zoom In' },
  { id: 'zoom-out', label: 'Zoom Out' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'shake', label: 'Shake' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'spin', label: 'Spin' },
  { id: 'typewriter', label: 'Typewriter' },
] as const;
export const AI_IMAGE_STYLES = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'anime', label: 'Anime' },
  { id: 'digital-art', label: 'Digital Art' },
  { id: '3d-render', label: '3D Render' },
  { id: 'oil-painting', label: 'Oil Painting' },
  { id: 'watercolor', label: 'Watercolor' },
  { id: 'comic', label: 'Comic Book' },
  { id: 'pixel-art', label: 'Pixel Art' },
] as const;
export const DEFAULT_AI_PROMPT = 'A beautiful abstract background with vibrant colors and smooth gradients';
export const AVATAR_SIZE_MIN = 60;
export const AVATAR_SIZE_MAX = 200;
export const AVATAR_SIZE_DEFAULT = 120;