import { invokeEdgeFunction } from '@/lib/supabase';

export interface GenerateImageRequest {
  prompt: string;
  n?: number;
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface GeneratedImageResponse {
  created: number;
  data: {
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }[];
}

export const imageService = {
  async generateImage(request: GenerateImageRequest): Promise<GeneratedImageResponse> {
    const requestBody = {
      model: 'dall-e-3',
      prompt: request.prompt,
      n: 1,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'vivid',
      response_format: 'b64_json', // Use base64 to avoid URL timeout issues
    };

    console.log('📤 Sending image generation request:', {
      prompt: request.prompt.substring(0, 50) + '...',
      size: requestBody.size,
      quality: requestBody.quality,
      style: requestBody.style
    });

    try {
      const response = await invokeEdgeFunction<GeneratedImageResponse>('openai-proxy', {
        path: '/images/generations',
        method: 'POST',
        body: requestBody
      });

      console.log('✅ Image generation successful:', {
        hasData: !!response.data,
        imageCount: response.data?.length || 0
      });

      return response;
    } catch (error) {
      console.error('❌ Image generation failed:', error);
      throw error;
    }
  },
};
