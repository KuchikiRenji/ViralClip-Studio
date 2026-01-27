export interface VoicePreset {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: 'US' | 'UK';
}

export const VOICE_PRESETS: VoicePreset[] = [
  { id: 'male-1', name: 'James', gender: 'male', accent: 'US' },
  { id: 'female-1', name: 'Sarah', gender: 'female', accent: 'US' },
  { id: 'male-2', name: 'Oliver', gender: 'male', accent: 'UK' },
  { id: 'female-2', name: 'Emma', gender: 'female', accent: 'UK' },
];

export const TTS_CREDITS_PER_1000_CHARS = 1;
