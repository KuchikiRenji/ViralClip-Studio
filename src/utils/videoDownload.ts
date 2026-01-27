import { invokeEdgeFunction } from '@/lib/supabase';
import {
  APIFY_ACTORS,
  MAX_RETRIES
} from '../constants/upload';

export type PlatformType = 'instagram' | 'tiktok' | 'youtube';

export interface VideoDownloadRequest {
  url: string;
  platform: PlatformType;
  quality?: string;
}

export interface VideoDownloadResponse {
  success: boolean;
  title?: string;
  thumbnail?: string;
  duration?: string;
  downloadUrl?: string;
  error?: string;
}

interface ApifyStatusResponse {
  data: {
    status: 'SUCCEEDED' | 'FAILED' | 'RUNNING';
  };
}

interface ApifyInstagramResult {
  caption?: string;
  displayUrl?: string;
  videoUrl?: string;
}

interface ApifyTikTokResult {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface ApifyYouTubeResult {
  title?: string;
  thumbnail?: string;
  duration?: string;
  videoUrl?: string;
}

type ApifyActorInput = Record<string, unknown>;

const PLATFORM_PATTERNS = {
  instagram: /instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/,
  tiktok: /tiktok\.com\/@[\w.-]+\/video\/\d+/i,
  youtube: /(youtube\.com\/watch\?v=|youtu\.be\/)/i,
} as const;

export const detectPlatform = (url: string): PlatformType | null => {
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) {
      return platform as PlatformType;
    }
  }
  return null;
};

const MAX_URL_LENGTH = 2048;
const ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;

const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (url.length > MAX_URL_LENGTH) return false;
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol as typeof ALLOWED_PROTOCOLS[number]);
  } catch {
    return false;
  }
};

const callApifyActor = async (
  actorId: string,
  input: ApifyActorInput
): Promise<ApifyInstagramResult | ApifyTikTokResult | ApifyYouTubeResult> => {
  const run = await invokeEdgeFunction<{ data: { id: string } }>('apify-proxy', {
    path: `/acts/${actorId}/runs`,
    method: 'POST',
    body: {
      ...input,
      proxy: { useApifyProxy: true },
    }
  });

  const runId = run.data.id;

  let retries = 0;
  while (retries < MAX_RETRIES) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await invokeEdgeFunction<ApifyStatusResponse>('apify-proxy', {
      path: `/actor-runs/${runId}`,
      method: 'GET'
    });
    if (status.data.status === 'SUCCEEDED') {
      const results = await invokeEdgeFunction<Array<ApifyInstagramResult | ApifyTikTokResult | ApifyYouTubeResult>>('apify-proxy', {
        path: `/actor-runs/${runId}/dataset/items`,
        method: 'GET'
      });
      if (!results || results.length === 0) throw new Error('No results returned from Apify');
      return results[0];
    }
    
    if (status.data.status === 'FAILED') throw new Error('Video download failed');
    retries++;
  }
  throw new Error('Download timeout');
};

const DEFAULT_INSTAGRAM_DURATION = '0:30';
const DEFAULT_TIKTOK_DURATION = '0:15';

const downloadInstagramVideo = async (url: string): Promise<VideoDownloadResponse> => {
  try {
    const result = await callApifyActor(APIFY_ACTORS.INSTAGRAM, {
      startUrls: [url],
      quality: 'highest',
      compression: 'none',
    }) as ApifyInstagramResult;
    return {
      success: true,
      title: result.caption || 'Instagram Video',
      thumbnail: result.displayUrl,
      duration: DEFAULT_INSTAGRAM_DURATION,
      downloadUrl: result.videoUrl || result.displayUrl,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Instagram download failed' };
  }
};

const MAX_TIKTOK_RETRIES = 10;
const downloadTikTokVideo = async (url: string): Promise<VideoDownloadResponse> => {
  try {
    const result = await callApifyActor(APIFY_ACTORS.TIKTOK, {
      startUrls: [{ url }],
      maxRequestRetries: MAX_TIKTOK_RETRIES,
    }) as ApifyTikTokResult;
    return {
      success: true,
      title: result.text || 'TikTok Video',
      thumbnail: result.imageUrl,
      duration: DEFAULT_TIKTOK_DURATION,
      downloadUrl: result.videoUrl,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'TikTok download failed' };
  }
};

const downloadYouTubeVideo = async (url: string): Promise<VideoDownloadResponse> => {
  try {
    const result = await callApifyActor(APIFY_ACTORS.YOUTUBE, {
      videos: [{ url }],
    }) as ApifyYouTubeResult;
    return {
      success: true,
      title: result.title || 'YouTube Video',
      thumbnail: result.thumbnail,
      duration: result.duration || '0:00',
      downloadUrl: result.videoUrl,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'YouTube download failed' };
  }
};

export const downloadVideo = async (
  request: VideoDownloadRequest
): Promise<VideoDownloadResponse> => {
  if (!validateUrl(request.url)) return { success: false, error: 'Invalid URL format' };
  const platform = detectPlatform(request.url);
  if (!platform || platform !== request.platform) return { success: false, error: 'URL does not match selected platform' };

  switch (request.platform) {
    case 'instagram': return downloadInstagramVideo(request.url);
    case 'tiktok': return downloadTikTokVideo(request.url);
    case 'youtube': return downloadYouTubeVideo(request.url);
    default: return { success: false, error: 'Unsupported platform' };
  }
};
