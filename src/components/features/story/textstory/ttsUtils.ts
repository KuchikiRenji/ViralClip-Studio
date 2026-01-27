import { invokeEdgeFunctionBlob } from '@/lib/supabase';

export type TTSProvider = 'elevenlabs' | 'openai' | 'browser';
export type TTSQuality = 'low' | 'medium' | 'high';

export interface TTSVoice {
  id: string;
  name: string;
  provider: TTSProvider;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
  description?: string;
  previewUrl?: string;
}

export interface TTSOptions {
  text: string;
  voiceId: string;
  provider: TTSProvider;
  speed?: number;
  pitch?: number;
  stability?: number;
  similarity_boost?: number;
  model?: string;
}

export interface TTSResult {
  audioBlob?: Blob;
  audioUrl?: string;
  error?: string;
  duration?: number;
}

export const ELEVENLABS_VOICES: TTSVoice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: 'elevenlabs', gender: 'female', accent: 'American' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', provider: 'elevenlabs', gender: 'female', accent: 'American' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', provider: 'elevenlabs', gender: 'female', accent: 'American' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', provider: 'elevenlabs', gender: 'male', accent: 'American' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', provider: 'elevenlabs', gender: 'female', accent: 'American' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', provider: 'elevenlabs', gender: 'male', accent: 'American' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', provider: 'elevenlabs', gender: 'male', accent: 'American' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', provider: 'elevenlabs', gender: 'male', accent: 'American' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', provider: 'elevenlabs', gender: 'male', accent: 'American' },
];

export const OPENAI_VOICES: TTSVoice[] = [
  { id: 'alloy', name: 'Alloy', provider: 'openai', gender: 'neutral', description: 'Neutral, balanced' },
  { id: 'echo', name: 'Echo', provider: 'openai', gender: 'male', description: 'Male, clear' },
  { id: 'fable', name: 'Fable', provider: 'openai', gender: 'male', description: 'Male, expressive' },
  { id: 'onyx', name: 'Onyx', provider: 'openai', gender: 'male', description: 'Male, deep' },
  { id: 'nova', name: 'Nova', provider: 'openai', gender: 'female', description: 'Female, warm' },
  { id: 'shimmer', name: 'Shimmer', provider: 'openai', gender: 'female', description: 'Female, bright' },
];

export function validateTTSConfig(provider: TTSProvider): { valid: boolean; error?: string } {
  return { valid: true };
}

async function generateWithElevenLabs(options: TTSOptions): Promise<TTSResult> {
  const sanitizedText = options.text.trim().substring(0, 5000);

  if (!sanitizedText) {
    return { error: 'Text cannot be empty' };
  }

  try {
    const audioBlob = await invokeEdgeFunctionBlob('elevenlabs-proxy', {
      path: `/text-to-speech/${options.voiceId}`,
      method: 'POST',
      body: {
        text: sanitizedText,
        model_id: options.model || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarity_boost ?? 0.75,
        },
      }
    });
    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = await getAudioDuration(audioBlob);

    return { audioBlob, audioUrl, duration };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to generate speech',
    };
  }
}

async function generateWithOpenAI(options: TTSOptions): Promise<TTSResult> {
  const sanitizedText = options.text.trim().substring(0, 4096);

  if (!sanitizedText) {
    return { error: 'Text cannot be empty' };
  }

  try {
    const audioBlob = await invokeEdgeFunctionBlob('openai-proxy', {
      path: '/audio/speech',
      method: 'POST',
      body: {
        model: options.model || 'tts-1',
        input: sanitizedText,
        voice: options.voiceId,
        speed: options.speed ?? 1.0,
      }
    });
    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = await getAudioDuration(audioBlob);

    return { audioBlob, audioUrl, duration };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to generate speech',
    };
  }
}

async function generateWithBrowser(options: TTSOptions): Promise<TTSResult> {
  return new Promise((resolve) => {
    const sanitizedText = options.text.trim();

    if (!sanitizedText) {
      resolve({ error: 'Text cannot be empty' });
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(sanitizedText);
      const voices = speechSynthesis.getVoices();

      const matchedVoice = voices.find(v =>
        v.name.toLowerCase().includes(options.voiceId.toLowerCase()) ||
        v.voiceURI.toLowerCase().includes(options.voiceId.toLowerCase())
      );

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.rate = options.speed ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;

      utterance.onend = () => {
        resolve({ duration: utterance.text.split(' ').length * 0.5 });
      };

      utterance.onerror = (event) => {
        resolve({ error: `Speech synthesis error: ${event.error}` });
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      resolve({
        error: error instanceof Error ? error.message : 'Failed to generate speech',
      });
    }
  });
}

function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };

    audio.src = url;
  });
}

export async function generateSpeech(options: TTSOptions): Promise<TTSResult> {
  const validation = validateTTSConfig(options.provider);

  if (!validation.valid) {
    if ('speechSynthesis' in window && options.provider !== 'browser') {
      return generateWithBrowser({ ...options, provider: 'browser' });
    }
    return { error: validation.error };
  }

  switch (options.provider) {
    case 'elevenlabs':
      return generateWithElevenLabs(options);
    case 'openai':
      return generateWithOpenAI(options);
    case 'browser':
      return generateWithBrowser(options);
    default:
      return { error: 'Invalid TTS provider' };
  }
}

export function getVoicesForProvider(provider: TTSProvider): TTSVoice[] {
  switch (provider) {
    case 'elevenlabs':
      return ELEVENLABS_VOICES;
    case 'openai':
      return OPENAI_VOICES;
    case 'browser':
      if ('speechSynthesis' in window) {
        return speechSynthesis.getVoices().map(v => ({
          id: v.name,
          name: v.name,
          provider: 'browser',
          accent: v.lang,
        }));
      }
      return [];
    default:
      return [];
  }
}

export function getAllVoices(): TTSVoice[] {
  const voices: TTSVoice[] = [];

  voices.push(...ELEVENLABS_VOICES);
  voices.push(...OPENAI_VOICES);

  if ('speechSynthesis' in window) {
    voices.push(...speechSynthesis.getVoices().slice(0, 10).map(v => ({
      id: v.name,
      name: v.name,
      provider: 'browser' as TTSProvider,
      accent: v.lang,
    })));
  }

  return voices;
}

export function estimateTTSCost(
  provider: TTSProvider,
  text: string,
  quality: TTSQuality = 'medium'
): number {
  const charCount = text.length;

  const costs = {
    elevenlabs: 0.30 / 1000,
    openai: quality === 'high' ? 0.030 / 1000 : 0.015 / 1000,
    browser: 0,
  };

  return (costs[provider] || 0) * charCount;
}

export function cleanupTTSResources(audioUrls: string[]) {
  audioUrls.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}

export async function batchGenerateSpeech(
  messages: Array<{ text: string; voiceId: string }>,
  provider: TTSProvider,
  onProgress?: (current: number, total: number) => void
): Promise<TTSResult[]> {
  const results: TTSResult[] = [];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const result = await generateSpeech({
      text: message.text,
      voiceId: message.voiceId,
      provider,
    });

    results.push(result);

    if (onProgress) {
      onProgress(i + 1, messages.length);
    }

    if (provider !== 'browser') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
