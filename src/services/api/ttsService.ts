import { invokeEdgeFunctionBlob } from '@/lib/supabase';
import { TTS_CREDITS_PER_1000_CHARS } from '../../constants/voice';

type Voice = string;
type TTSModel = 'tts-1' | 'tts-1-hd';
type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';

interface TTSRequest {
  text: string;
  voice?: Voice;
  speed?: number;
  model?: TTSModel;
  response_format?: AudioFormat;
}

interface TTSResponse {
  job_id: string;
  status: 'completed' | 'failed';
  file_id: string;
  audio_url: string;
  size_bytes: number;
  format: AudioFormat;
  voice: Voice;
  credits_used: number;
}

interface TTSConfig {
  voices: { id: string; name: string; description: string; provider: 'openai' | 'elevenlabs' }[];
  models: TTSModel[];
  formats: AudioFormat[];
  credits_per_1000_chars: number;
}

const OPENAI_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

export const ttsService = {
  async generateSpeech(request: TTSRequest): Promise<TTSResponse> {
    const voice = request.voice || 'alloy';
    const isOpenAIVoice = OPENAI_VOICES.includes(voice);

    const maxLength = isOpenAIVoice ? 4000 : 5000;
    if (request.text.length > maxLength) {
      return this.generateSplitSpeech(request, maxLength);
    }

    if (isOpenAIVoice) {
      return this.generateOpenAI(request);
    } else {
      return this.generateElevenLabs(request);
    }
  },

  async generateSplitSpeech(request: TTSRequest, maxLength: number): Promise<TTSResponse> {
    const chunks: string[] = [];
    let currentText = request.text;

    while (currentText.length > 0) {
      if (currentText.length <= maxLength) {
        chunks.push(currentText);
        break;
      }

      let splitIndex = currentText.lastIndexOf('. ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf(', ', maxLength);
      if (splitIndex === -1) splitIndex = currentText.lastIndexOf(' ', maxLength);
      if (splitIndex === -1) splitIndex = maxLength;

      chunks.push(currentText.substring(0, splitIndex + 1));
      currentText = currentText.substring(splitIndex + 1).trim();
    }

    const responses = await Promise.all(
      chunks.map(chunk => this.generateSpeech({ ...request, text: chunk }))
    );

    return responses[0]; 
  },

  async generateOpenAI(request: TTSRequest): Promise<TTSResponse> {
    const blob = await invokeEdgeFunctionBlob('openai-proxy', {
      path: '/audio/speech',
      method: 'POST',
      body: {
        model: request.model || 'tts-1',
        input: request.text,
        voice: request.voice,
        speed: request.speed || 1.0,
        response_format: request.response_format || 'mp3',
      }
    });

    const url = URL.createObjectURL(blob);

    return {
      job_id: `openai-${Date.now()}`,
      status: 'completed',
      file_id: `local-${Date.now()}`,
      audio_url: url,
      size_bytes: blob.size,
      format: request.response_format || 'mp3',
      voice: request.voice as Voice,
      credits_used: this.estimateCredits(request.text),
    };
  },

  async generateElevenLabs(request: TTSRequest): Promise<TTSResponse> {
    const voiceId = request.voice || '21m00Tcm4TlvDq8ikWAM';
    const modelId = 'eleven_multilingual_v2';

    const blob = await invokeEdgeFunctionBlob('elevenlabs-proxy', {
      path: `/text-to-speech/${voiceId}`,
      method: 'POST',
      body: {
        text: request.text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }
    });

    const url = URL.createObjectURL(blob);

    return {
      job_id: `elevenlabs-${Date.now()}`,
      status: 'completed',
      file_id: `local-${Date.now()}`,
      audio_url: url,
      size_bytes: blob.size,
      format: 'mp3',
      voice: request.voice as Voice,
      credits_used: this.estimateCredits(request.text),
    };
  },

  async getConfig(): Promise<TTSConfig> {
    return {
      voices: this.getAvailableVoices(),
      models: ['tts-1', 'tts-1-hd'],
      formats: ['mp3', 'aac', 'flac', 'opus', 'pcm', 'wav'],
      credits_per_1000_chars: TTS_CREDITS_PER_1000_CHARS,
    };
  },

  async generateWithVoice(
    text: string,
    voice: Voice,
    options?: {
      speed?: number;
      hd?: boolean;
      format?: AudioFormat;
    }
  ): Promise<TTSResponse> {
    if (!text.trim()) {
      throw new Error('Text cannot be empty for TTS generation');
    }
    return this.generateSpeech({
      text,
      voice,
      speed: options?.speed || 1.0,
      model: options?.hd ? 'tts-1-hd' : 'tts-1',
      response_format: options?.format || 'mp3',
    });
  },

  estimateCredits(text: string): number {
    return Math.max(1, Math.ceil(text.length / 1000) * TTS_CREDITS_PER_1000_CHARS);
  },

  getAvailableVoices(): { id: string; name: string; description: string; provider: 'openai' | 'elevenlabs' }[] {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', provider: 'openai' },
      { id: 'echo', name: 'Echo', description: 'Warm and conversational', provider: 'openai' },
      { id: 'fable', name: 'Fable', description: 'Expressive and dramatic', provider: 'openai' },
      { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative', provider: 'openai' },
      { id: 'nova', name: 'Nova', description: 'Friendly and upbeat', provider: 'openai' },
      { id: 'shimmer', name: 'Shimmer', description: 'Clear and professional', provider: 'openai' },
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'American, calm', provider: 'elevenlabs' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'American, strong', provider: 'elevenlabs' },
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'American, soft', provider: 'elevenlabs' },
      { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'American, well-rounded', provider: 'elevenlabs' },
      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'American, young', provider: 'elevenlabs' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', description: 'American, deep', provider: 'elevenlabs' },
      { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', description: 'American, crisp', provider: 'elevenlabs' },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'American, deep', provider: 'elevenlabs' },
      { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', description: 'American, raspy', provider: 'elevenlabs' },
    ];
  },
};
