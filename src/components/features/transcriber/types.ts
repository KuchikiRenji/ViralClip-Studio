export interface TranscriptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}
export interface TranscriberState {
  videoFile: File | null;
  videoUrl: string;
  videoObjectUrl: string | null;
  isTranscribing: boolean;
  transcriptionProgress: number;
  segments: TranscriptionSegment[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedFormat: ExportFormat;
  error: string | null;
}
export type ExportFormat = 'srt' | 'vtt' | 'txt' | 'json';
export interface TranscriberProps {
  onBack: () => void;
}







