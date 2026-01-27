import { Platform } from './types';
export { GENERATION } from '../../../constants/generation';
export const PLATFORM_PATTERNS: { platform: Platform; patterns: RegExp[] }[] = [
  {
    platform: 'youtube',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    ],
  },
  {
    platform: 'instagram',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
    ],
  },
  {
    platform: 'tiktok',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
      /(?:https?:\/\/)?(?:vm\.)?tiktok\.com\/([a-zA-Z0-9]+)/,
      /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/t\/([a-zA-Z0-9]+)/,
    ],
  },
];
export const PLATFORM_CONFIG: Record<Platform, { name: string; color: string; bgClass: string }> = {
  youtube: { name: 'YouTube', color: 'text-red-500', bgClass: 'bg-red-500/20' },
  instagram: { name: 'Instagram', color: 'text-pink-500', bgClass: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' },
  tiktok: { name: 'TikTok', color: 'text-white', bgClass: 'bg-black' },
  unknown: { name: 'Unknown', color: 'text-zinc-400', bgClass: 'bg-zinc-800' },
};
export const QUALITY_OPTIONS = [
  { id: '1080p', label: '1080p HD', fileSize: '~150 MB' },
  { id: '720p', label: '720p HD', fileSize: '~80 MB' },
  { id: '480p', label: '480p SD', fileSize: '~40 MB' },
  { id: '360p', label: '360p', fileSize: '~20 MB' },
  { id: 'audio', label: 'Audio Only (MP3)', fileSize: '~5 MB' },
];







