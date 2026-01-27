import { invokeEdgeFunction } from '@/lib/supabase';

type ScriptType = 'story' | 'reddit' | 'educational' | 'promotional' | 'custom' | 'chat-story';
type ScriptTone = 'casual' | 'professional' | 'humorous' | 'dramatic' | 'inspirational';

interface GenerateScriptRequest {
  prompt: string;
  type: ScriptType;
  tone?: ScriptTone;
  duration_seconds?: number;
  language?: string;
  include_hooks?: boolean;
  include_cta?: boolean;
}

interface ScriptSection {
  type: 'hook' | 'intro' | 'body' | 'climax' | 'cta' | 'outro';
  content: string;
  estimated_duration: number;
}

interface GenerateScriptResponse {
  job_id: string;
  status: 'completed' | 'failed';
  title: string;
  script: string;
  sections: ScriptSection[];
  estimated_total_duration: number;
  word_count: number;
  credits_used: number;
}

type GenerateScriptFunctionResponse = Partial<Pick<
  GenerateScriptResponse,
  'job_id' | 'title' | 'script' | 'sections' | 'estimated_total_duration' | 'word_count' | 'credits_used'
>>;

async function generateScriptWithBackend(request: GenerateScriptRequest): Promise<GenerateScriptResponse> {
  let prompt = request.prompt;

  if (request.type === 'reddit' && (prompt.includes('reddit.com') || prompt.includes('redd.it'))) {
    try {
      const redditData = await invokeEdgeFunction<{ title?: string; content?: string; author?: string; subreddit?: string }>('reddit-fetch', { url: prompt });
      if (redditData?.title && redditData?.content) {
        prompt = `Reddit Post Title: ${String(redditData.title)}\n\nContent: ${String(redditData.content)}\n\nAuthor: ${String(redditData.author ?? '')}\nSubreddit: r/${String(redditData.subreddit ?? '')}`;
      }
    } catch {
      prompt = request.prompt;
    }
  }

  const data = await invokeEdgeFunction<GenerateScriptFunctionResponse>('generate-script', {
    prompt,
    type: request.type,
    tone: request.tone,
    duration_seconds: request.duration_seconds,
    language: request.language,
    include_hooks: request.include_hooks,
    include_cta: request.include_cta
  });

  return {
    job_id: data?.job_id || `local-${Date.now()}`,
    status: 'completed',
    title: data?.title || 'Untitled Script',
    script: data?.script || '',
    sections: data?.sections || [],
    estimated_total_duration: data?.estimated_total_duration || request.duration_seconds || 60,
    word_count: data?.word_count || (data?.script || '').split(' ').length,
    credits_used: data?.credits_used || 1
  };
}

export const scriptService = {
  async generateScript(request: GenerateScriptRequest): Promise<GenerateScriptResponse> {
    return generateScriptWithBackend(request);
  },

  async generateStoryScript(
    prompt: string,
    options?: {
      tone?: ScriptTone;
      duration?: number;
      language?: string;
    }
  ): Promise<GenerateScriptResponse> {
    return this.generateScript({
      prompt,
      type: 'story',
      tone: options?.tone || 'dramatic',
      duration_seconds: options?.duration || 60,
      language: options?.language,
      include_hooks: true,
    });
  },

  async generateRedditScript(
    prompt: string,
    options?: {
      tone?: ScriptTone;
      duration?: number;
      language?: string;
    }
  ): Promise<GenerateScriptResponse> {
    return this.generateScript({
      prompt,
      type: 'reddit',
      tone: options?.tone || 'casual',
      duration_seconds: options?.duration || 90,
      language: options?.language,
      include_hooks: true,
    });
  },

  async generateEducationalScript(
    topic: string,
    options?: {
      duration?: number;
      language?: string;
    }
  ): Promise<GenerateScriptResponse> {
    return this.generateScript({
      prompt: topic,
      type: 'educational',
      tone: 'professional',
      duration_seconds: options?.duration || 120,
      language: options?.language,
      include_cta: true,
    });
  },

  async generatePromotionalScript(
    productDescription: string,
    options?: {
      tone?: ScriptTone;
      duration?: number;
      language?: string;
    }
  ): Promise<GenerateScriptResponse> {
    return this.generateScript({
      prompt: productDescription,
      type: 'promotional',
      tone: options?.tone || 'professional',
      duration_seconds: options?.duration || 30,
      language: options?.language,
      include_hooks: true,
      include_cta: true,
    });
  },
};
