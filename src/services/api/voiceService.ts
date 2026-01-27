import { supabase, invokeEdgeFunction } from '../../lib/supabase';
import { ttsService } from './ttsService';

export interface VoicePreset {
  id: string;
  name: string;
  gender: 'male' | 'female';
  accent: string;
  style: string;
  sampleUrl?: string;
}

export interface EmotionSetting {
  id: string;
  name: string;
  description: string;
  intensity: number;
}

export interface VoiceProfile {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sample_file_id: string | null;
  model_id: string | null;
  provider: 'openai' | 'elevenlabs' | 'replicate';
  status: 'pending' | 'processing' | 'ready' | 'failed';
  settings: { speed: number; pitch: number };
  sample_duration_seconds: number | null;
  usage_count: number;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm'];

export const voiceCloneService = {
  async uploadSample(file: File): Promise<ApiResponse<{ sampleId: string; duration: number }>> {
    const validation = voiceProcessingService.validateAudioFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${user.id}/voice-samples/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: mediaFile, error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: user.id,
        bucket: 'uploads',
        path: filePath,
        filename: fileName,
        original_filename: file.name,
        mime_type: file.type,
        media_type: 'audio',
        size_bytes: file.size,
        is_processed: false,
      })
      .select('id')
      .single();

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { 
      success: true, 
      data: { 
        sampleId: mediaFile.id, 
        duration: 0,
      } 
    };
  },

  async createVoiceProfile(
    name: string, 
    sampleFileId: string,
    description?: string
  ): Promise<ApiResponse<VoiceProfile>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('voice_profiles')
      .insert({
        user_id: user.id,
        name,
        description,
        sample_file_id: sampleFileId,
        status: 'pending',
        provider: 'openai',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as VoiceProfile };
  },

  async getVoiceProfiles(): Promise<ApiResponse<VoiceProfile[]>> {
    const { data, error } = await supabase
      .from('voice_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as VoiceProfile[] };
  },

  async deleteVoiceProfile(id: string): Promise<ApiResponse<void>> {
    const { error } = await supabase
      .from('voice_profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  async getEmotions(): Promise<ApiResponse<EmotionSetting[]>> {
    return {
      success: true,
      data: [
        { id: 'neutral', name: 'Neutral', description: 'Natural, balanced tone', intensity: 0.5 },
        { id: 'happy', name: 'Happy', description: 'Upbeat and cheerful', intensity: 0.7 },
        { id: 'sad', name: 'Sad', description: 'Melancholic and somber', intensity: 0.6 },
        { id: 'excited', name: 'Excited', description: 'Energetic and enthusiastic', intensity: 0.8 },
        { id: 'calm', name: 'Calm', description: 'Peaceful and soothing', intensity: 0.4 },
      ],
    };
  },
};

export const textToSpeechService = {
  async generateSpeech(
    text: string,
    voiceId: string,
    settings?: {
      speed?: number;
      pitch?: number;
      emotion?: string;
    }
  ): Promise<ApiResponse<{ jobId: string; audioUrl?: string; duration: number }>> {
    if (!text.trim()) {
      return { success: false, error: 'Text is required to generate speech' };
    }

    try {
      const result = await ttsService.generateWithVoice(
        text,
        voiceId as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        { speed: settings?.speed }
      );

      return {
        success: true,
        data: {
          jobId: result.job_id,
          audioUrl: result.audio_url,
          duration: text.length / 15,
        },
      };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'TTS generation failed' 
      };
    }
  },

  async getVoicePresets(): Promise<ApiResponse<VoicePreset[]>> {
    const voices = ttsService.getAvailableVoices();
    
    return {
      success: true,
      data: voices.map(v => ({
        id: v.id,
        name: v.name,
        gender: ['onyx', 'echo'].includes(v.id) ? 'male' as const : 'female' as const,
        accent: 'American',
        style: v.description,
      })),
    };
  },

  async getVoiceSample(voiceId: string): Promise<ApiResponse<string>> {
    if (!voiceId.trim()) {
      return { success: false, error: 'Voice id is required' };
    }

    try {
      const result = await ttsService.generateWithVoice(
        'Hello! This is a sample of my voice. I hope you like how I sound.',
        voiceId as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
      );

      return { success: true, data: result.audio_url };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to get voice sample' 
      };
    }
  },
};

export const voiceProcessingService = {
  async analyzeVoiceSample(file: File): Promise<ApiResponse<{
    quality: 'poor' | 'good' | 'excellent';
    duration: number;
    clarity: number;
    recommendations: string[];
  }>> {
    const validation = this.validateAudioFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const duration = await this.getAudioDuration(file);
    const quality = duration >= 30 ? 'excellent' : duration >= 10 ? 'good' : 'poor';
    const clarity = quality === 'excellent' ? 0.9 : quality === 'good' ? 0.7 : 0.5;

    const recommendations: string[] = [];
    if (duration < 10) {
      recommendations.push('Record at least 10 seconds for better voice cloning');
    }
    if (duration < 30) {
      recommendations.push('30+ seconds of audio produces the best results');
    }

    return {
      success: true,
      data: {
        quality,
        duration,
        clarity,
        recommendations,
      },
    };
  },

  validateAudioFile(file: File): { valid: boolean; error?: string } {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'Audio file must be less than 50MB' };
    }
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return { valid: false, error: 'Unsupported audio format. Use WAV, MP3, M4A, or WebM' };
    }
    return { valid: true };
  },

  async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
        URL.revokeObjectURL(audio.src);
      };
      audio.onerror = () => {
        resolve(0);
        URL.revokeObjectURL(audio.src);
      };
      audio.src = URL.createObjectURL(file);
    });
  },
};
