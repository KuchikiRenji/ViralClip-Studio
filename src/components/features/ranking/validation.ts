import { FileValidationResult } from './types';

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const ALLOWED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_AUDIO_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];
const MAX_VIDEO_DURATION = 600;
const MIN_RESOLUTION = 720;
const MIN_DURATION = 2;

export const validateVideoFile = async (file: File): Promise<FileValidationResult> => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (!ALLOWED_VIDEO_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported video format. Allowed formats: ${ALLOWED_VIDEO_FORMATS.join(', ')}`,
    };
  }

  try {
    const metadata = await getVideoMetadata(file);

    if (metadata.duration > MAX_VIDEO_DURATION) {
      return {
        valid: false,
        error: `Video duration exceeds maximum allowed duration of ${MAX_VIDEO_DURATION} seconds`,
      };
    }

    const warnings: string[] = [];

    if (metadata.width < MIN_RESOLUTION || metadata.height < MIN_RESOLUTION) {
      warnings.push('Video resolution is low. For best quality, use videos with at least 720p resolution.');
    }

    if (metadata.duration < MIN_DURATION) {
      warnings.push('Video is very short. Consider using longer clips for better results.');
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata,
    };
  } catch {
    return {
      valid: false,
      error: 'Failed to read video file. The file may be corrupted or in an unsupported format.',
    };
  }
};

export const validateAudioFile = async (file: File): Promise<FileValidationResult> => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (!ALLOWED_AUDIO_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported audio format. Allowed formats: ${ALLOWED_AUDIO_FORMATS.join(', ')}`,
    };
  }

  try {
    const metadata = await getAudioMetadata(file);

    return {
      valid: true,
      metadata: {
        duration: metadata.duration,
        width: 0,
        height: 0,
        size: file.size,
        format: file.type,
      },
    };
  } catch {
    return {
      valid: false,
      error: 'Failed to read audio file. The file may be corrupted or in an unsupported format.',
    };
  }
};

interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
}

const getVideoMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        format: file.type,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
};

const getAudioMetadata = (file: File): Promise<{ duration: number }> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve({ duration: audio.duration });
    };

    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio metadata'));
    };

    audio.src = URL.createObjectURL(file);
  });
};

const SUPPORTED_PLATFORMS = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be'];

export const validateVideoURL = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === '') {
    return { valid: false, error: 'URL cannot be empty' };
  }

  try {
    const urlObj = new URL(url);

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    const hostname = urlObj.hostname.toLowerCase();
    const isSupported = SUPPORTED_PLATFORMS.some((platform) => hostname.includes(platform));

    if (!isSupported) {
      return {
        valid: false,
        error: 'URL must be from TikTok, Instagram, or YouTube',
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};
