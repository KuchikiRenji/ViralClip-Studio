import { ExportFormat } from './types';
export const TRANSCRIPTION_INTERVAL_MS = 100;
export const TRANSCRIPTION_PROGRESS_STEP = 1;
export const MAX_PROGRESS = 100;
export const EXPORT_FORMATS: { value: ExportFormat; label: string; extension: string }[] = [
  { value: 'srt', label: 'SubRip (.srt)', extension: 'srt' },
  { value: 'vtt', label: 'WebVTT (.vtt)', extension: 'vtt' },
  { value: 'txt', label: 'Plain Text (.txt)', extension: 'txt' },
  { value: 'json', label: 'JSON (.json)', extension: 'json' },
];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
export const MAX_FILE_SIZE_MB = 500;







