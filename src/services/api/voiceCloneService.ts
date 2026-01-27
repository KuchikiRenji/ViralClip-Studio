import { invokeEdgeFunctionFormData } from '@/lib/supabase';

export interface AddVoiceResponse {
  voice_id: string;
}

export const voiceCloneService = {
  async addVoice(name: string, files: File[], description?: string): Promise<AddVoiceResponse> {
    console.log('📤 Starting voice cloning via edge function...', {
      name,
      fileCount: files.length,
      hasDescription: !!description
    });

    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    
    // ElevenLabs requires specific file handling. Append files to FormData.
    files.forEach((file) => {
      formData.append('files', file);
      console.log('📎 Added file to FormData:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
    });

    try {
      // Use edge function instead of direct API call for security and proper API key handling
      const response = await invokeEdgeFunctionFormData<AddVoiceResponse>(
        'elevenlabs-proxy',
        formData,
        undefined, // customHeaders
        { path: '/voices/add' } // options
      );

      console.log('✅ Voice cloning successful:', {
        voice_id: response.voice_id
      });

      return response;
    } catch (error) {
      console.error('❌ Voice cloning error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Voice cloning failed';
      throw new Error(errorMessage);
    }
  },
};
