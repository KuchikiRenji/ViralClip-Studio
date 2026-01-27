import { useState, useRef, useEffect } from 'react';
import { GeneratedClip } from './clipHelpers';
export type TabType = 'upload' | 'clips';
export interface AutoClippingState {
  activeTab: TabType;
  videoLink: string;
  uploadedFile: File | null;
  uploadedVideoUrl: string | null;
  isDragging: boolean;
  isAnalyzing: boolean;
  analysisProgress: number;
  generatedClips: GeneratedClip[];
  selectedClips: Set<string>;
  previewClip: GeneratedClip | null;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  isExtracting: boolean;
  extractionProgress: number;
}
const INITIAL_STATE: AutoClippingState = {
  activeTab: 'upload',
  videoLink: '',
  uploadedFile: null,
  uploadedVideoUrl: null,
  isDragging: false,
  isAnalyzing: false,
  analysisProgress: 0,
  generatedClips: [],
  selectedClips: new Set(),
  previewClip: null,
  isPlaying: false,
  isMuted: false,
  currentTime: 0,
  isExtracting: false,
  extractionProgress: 0,
};
export const useAutoClippingState = () => {
  const [state, setState] = useState<AutoClippingState>(INITIAL_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    return () => {
      if (state.uploadedVideoUrl) {
        URL.revokeObjectURL(state.uploadedVideoUrl);
      }
    };
  }, [state.uploadedVideoUrl]);
  useEffect(() => {
    if (state.uploadedFile) {
      if (state.uploadedVideoUrl) {
        URL.revokeObjectURL(state.uploadedVideoUrl);
      }
      setState(prev => ({
        ...prev,
        uploadedVideoUrl: URL.createObjectURL(state.uploadedFile),
      }));
    }
  }, [state.uploadedFile]);
  const updateState = (updates: Partial<AutoClippingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };
  return {
    state,
    setState,
    updateState,
    fileInputRef,
    videoRef,
    previewVideoRef,
  };
};







