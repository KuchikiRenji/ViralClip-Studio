export interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export interface QuickSubtitlesState {
  videoUrl: string;
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  selectedLanguage: string;
  subtitles: SubtitleSegment[];
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isGenerating: boolean;
  generationProgress: number;
  isGenerated: boolean;
  exportedBlob: Blob | null;
}