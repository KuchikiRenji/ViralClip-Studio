import type { ViewType, CreationMode } from '../types';

export type { ViewType, CreationMode };

export const VIEW_PATHS: Record<ViewType, string> = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  'forgot-password': '/forgot-password',
  'reset-password': '/reset-password',
  'auth-callback': '/auth/callback',
  home: '/home',
  library: '/library',
  profile: '/profile',
  pricing: '/pricing',
  services: '/services',
  'edit-video': '/edit-video',
  'create-story': '/create-story',
  'create-image': '/create-image',
  'video-ranking': '/video-ranking',
  'text-story': '/text-story',
  'story-video': '/story-video',
  'split-screen': '/split-screen',
  'auto-clipping': '/auto-clipping',
  'voice-clone': '/voice-clone',
  'video-transcriber': '/video-transcriber',
  'video-downloader': '/video-downloader',
  'download-instagram': '/download-instagram',
  'download-tiktok': '/download-tiktok',
  'download-youtube': '/download-youtube',
  'quick-subtitles': '/quick-subtitles',
  'reddit-video': '/reddit-video',
  'background-remover': '/background-remover',
  'vocal-remover': '/vocal-remover',
  'mp3-converter': '/mp3-converter',
  'video-compressor': '/video-compressor',
  'audio-balancer': '/audio-balancer',
  'speech-enhancer': '/speech-enhancer',
  'veo3-video': '/veo3-video',
  'clash': '/clash'
};

export const normalizePath = (path: string): string => {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
};

export const PATH_TO_VIEW = Object.entries(VIEW_PATHS).reduce<Record<string, ViewType>>((acc, [view, path]) => {
  acc[path] = view as ViewType;
  return acc;
}, {});

export const buildUrl = (view: ViewType, mode?: CreationMode): string => {
  const path = VIEW_PATHS[view] ?? '/';
  if (mode) {
    return `${path}?mode=${mode}`;
  }
  return path;
};

export const resolveViewFromLocation = (path: string): ViewType => {
  const normalized = normalizePath(path);
  return PATH_TO_VIEW[normalized] ?? 'landing';
};

export const resolveCreationMode = (search: string, fallback: CreationMode): CreationMode => {
  if (!search) {
    return fallback;
  }
  const params = new URLSearchParams(search);
  const modeParam = params.get('mode');
  if (modeParam === 'story' || modeParam === 'text-story' || modeParam === 'ranking' || modeParam === 'split-screen' || modeParam === 'conversation' || modeParam === 'viral-clips' || modeParam === 'text' || modeParam === 'reddit' || modeParam === 'instagram' || modeParam === 'x' || modeParam === 'gameplay') {
    return modeParam;
  }
  return fallback;
};
