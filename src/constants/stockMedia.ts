import { StockMediaItem } from '../types';
export const STOCK_VIDEOS: StockMediaItem[] = [
  {
    id: 'v1',
    title: 'Minecraft Parkour Neon',
    thumbnail: 'https://images.pexels.com/photos/5928014/pexels-photo-5928014.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://videos.pexels.com/video-files/5928014/5928014-uhd_1080_1920_30fps.mp4',
    duration: 655,
    category: 'gaming',
    tags: ['minecraft', 'parkour', 'gameplay'],
  },
  {
    id: 'v2',
    title: 'Cyberpunk City Drive',
    thumbnail: 'https://images.pexels.com/photos/4678261/pexels-photo-4678261.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://videos.pexels.com/video-files/4678261/4678261-hd_1080_1920_30fps.mp4',
    duration: 900,
    category: 'urban',
    tags: ['gta', 'night', 'city', 'drive'],
  },
  {
    id: 'v3',
    title: 'Satisfying Soap Cutting',
    thumbnail: 'https://images.pexels.com/photos/8063953/pexels-photo-8063953.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://videos.pexels.com/video-files/8063953/8063953-hd_1080_1920_30fps.mp4',
    duration: 180,
    category: 'abstract',
    tags: ['asmr', 'satisfying', 'soap'],
  },
  {
    id: 'v4',
    title: 'Minimal Workspace',
    thumbnail: 'https://images.pexels.com/photos/14402560/pexels-photo-14402560.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://videos.pexels.com/video-files/14402560/14402560-uhd_1080_1920_30fps.mp4',
    duration: 600,
    category: 'lifestyle',
    tags: ['faceless', 'aesthetic', 'workspace'],
  },
  {
    id: 'v5',
    title: 'Deep Ocean Drone',
    thumbnail: 'https://images.pexels.com/photos/2025634/pexels-photo-2025634.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
    url: 'https://videos.pexels.com/video-files/2025634/2025634-hd_1080_1920_30fps.mp4',
    duration: 540,
    category: 'nature',
    tags: ['ocean', 'nature', 'cinematic'],
  },
];
export const STOCK_IMAGES: StockMediaItem[] = [];
export const STOCK_AUDIO: StockMediaItem[] = [];
export const STOCK_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'Grid' },
  { id: 'nature', label: 'Nature', icon: 'Mountain' },
  { id: 'urban', label: 'Urban', icon: 'Building' },
  { id: 'gaming', label: 'Gaming', icon: 'Gamepad2' },
  { id: 'abstract', label: 'Abstract', icon: 'Shapes' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'Coffee' },
  { id: 'fitness', label: 'Fitness', icon: 'Dumbbell' },
];
export const AUDIO_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'electronic', label: 'Electronic' },
  { id: 'lofi', label: 'Lo-Fi' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'acoustic', label: 'Acoustic' },
  { id: 'trap', label: 'Trap' },
  { id: 'corporate', label: 'Corporate' },
];
export const ORIENTATION_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'square', label: 'Square' },
];