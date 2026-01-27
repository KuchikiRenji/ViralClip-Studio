export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'unknown';
export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  platform: Platform;
  formats: VideoFormat[];
}
export interface VideoFormat {
  id: string;
  quality: string;
  format: string;
  fileSize: string;
  hasAudio: boolean;
}
export interface DownloaderState {
  url: string;
  isAnalyzing: boolean;
  analysisProgress: number;
  videoInfo: VideoInfo | null;
  selectedFormat: string;
  isDownloading: boolean;
  downloadProgress: number;
  error: string | null;
  downloadedBlob: Blob | null;
}
export interface DownloaderProps {
  onBack: () => void;
  defaultPlatform?: Platform;
}







