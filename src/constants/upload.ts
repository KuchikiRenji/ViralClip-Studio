import { API_URLS, API_KEYS } from './apiKeys';

export const MAX_UPLOAD_SIZE_MB = 500;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'] as const;
export const SUPPORTED_AUDIO_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mp3'] as const;
export const SUPPORTED_IMAGE_FORMATS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'] as const;

export const BACKGROUND_REMOVER_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const VOCAL_REMOVER_MAX_SIZE_BYTES = 50 * 1024 * 1024;

export const APIFY_BASE_URL = API_URLS.APIFY;
export const APIFY_TOKEN = API_KEYS.APIFY;
export const APIFY_ACTORS = {
  INSTAGRAM: 'apify/instagram-reels-scraper',
  TIKTOK: 'apify/tiktok-scraper',
  YOUTUBE: 'apify/youtube-scraper',
} as const;
export const VIDEO_DOWNLOAD_TIMEOUT_MS = 60000;
export const MAX_RETRIES = 10;

export const VOCAL_REMOVER_DOWNLOAD_DELAY_MS = 500;

export const BACKGROUND_REMOVER_PROGRESS = {
  INITIAL: 10,
  INCREMENT: 5,
  MAX_SIMULATED: 90,
  PROCESSING_START: 10,
  PROCESSING_MAX: 95,
  COMPLETE: 100,
  INTERVAL_MS: 200,
} as const;

export const WAV_FILE_CONSTANTS = {
  HEADER_SIZE: 44,
  RIFF_OFFSET: 0,
  FILE_SIZE_OFFSET: 4,
  WAVE_OFFSET: 8,
  FMT_OFFSET: 12,
  FMT_SIZE_OFFSET: 16,
  AUDIO_FORMAT_OFFSET: 20,
  NUM_CHANNELS_OFFSET: 22,
  SAMPLE_RATE_OFFSET: 24,
  BYTE_RATE_OFFSET: 28,
  BLOCK_ALIGN_OFFSET: 32,
  BITS_PER_SAMPLE_OFFSET: 34,
  DATA_OFFSET: 36,
  DATA_SIZE_OFFSET: 40,
  DATA_START: 44,
  PCM_FORMAT: 1,
  BITS_PER_SAMPLE: 16,
  BYTES_PER_SAMPLE: 2,
  FMT_SUBCHUNK_SIZE: 16,
  STEREO_MIX_FACTOR: 0.5,
  MONO_ATTENUATION_FACTOR: 0.5,
  SAMPLE_MIN: -1,
  SAMPLE_MAX: 1,
  INT16_MIN: 0x8000,
  INT16_MAX: 0x7fff,
} as const;