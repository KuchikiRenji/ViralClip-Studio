export interface MediaAsset {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'transition';
  src: string;
  thumbnail?: string;
  title: string;
  duration?: number;
  fileSize?: string;
  resolution?: string;
  createdAt: string;
}

export interface StockMediaItem {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnail: string;
  src: string;
  duration?: number;
  author: string;
  source: 'pexels' | 'unsplash' | 'pixabay';
  category: string;
  tags: string[];
  orientation?: 'landscape' | 'portrait' | 'square';
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  thumbnail: string;
  duration?: string;
  createdAt: string;
  size: string;
}

export interface ViralClip {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  score: number;
  duration: number;
}

