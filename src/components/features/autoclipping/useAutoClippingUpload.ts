import { useCallback } from 'react';
import { RefObject } from 'react';
import { AutoClippingState } from './useAutoClippingState';
import { usePaywall } from '../../../hooks/usePaywall';
import { TIMING } from '../../../constants/timing';
import { transcriptionService } from '../../../services/api/transcriptionService';
import { clipReasoningService } from '../../../services/api/clipReasoningService';
import { ffmpegEngine } from '../../../lib/ffmpegEngine';
import {
  generateClipsFromAudio,
  generateFallbackClipsForFile,
  generateClipsFromLink,
  GeneratedClip,
} from './clipHelpers';

interface UseAutoClippingUploadProps {
  state: AutoClippingState;
  updateState: (updates: Partial<AutoClippingState>) => void;
  videoRef: RefObject<HTMLVideoElement>;
  onAnalysisComplete: (clips: GeneratedClip[]) => void;
}

export const useAutoClippingUpload = ({
  state,
  updateState,
  videoRef,
  onAnalysisComplete,
}: UseAutoClippingUploadProps) => {
  const { requireSubscription } = usePaywall();
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    updateState({ isDragging: true });
  }, [updateState]);

  const handleDragLeave = useCallback(() => {
    updateState({ isDragging: false });
  }, [updateState]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    updateState({ isDragging: false });
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      updateState({ uploadedFile: file });
    }
  }, [updateState]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateState({ uploadedFile: file });
    }
  }, [updateState]);

  const handleVideoLoaded = useCallback(() => {
  }, []);

  const performAnalysis = useCallback(async () => {
    if (!state.uploadedFile && !state.videoLink) return;
    if (!requireSubscription('Auto Clipping')) return;
    
    updateState({ isAnalyzing: true, analysisProgress: 10 });
    
    try {
      let clips: GeneratedClip[] = [];

      if (state.uploadedFile) {
        // Advanced AI Analysis Flow
        updateState({ analysisProgress: 20 });
        
        // 1. Extract Audio
        await ffmpegEngine.load();
        updateState({ analysisProgress: 30 });
        const audioBlob = await ffmpegEngine.extractAudio(state.uploadedFile);
        if (!audioBlob) throw new Error('Failed to extract audio');
        
        updateState({ analysisProgress: 45 });
        const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });
        
        // 2. Transcribe
        const transcription = await transcriptionService.transcribe(audioFile);
        updateState({ analysisProgress: 70 });
        
        // 3. Find Viral Moments using LLM
        const duration = videoRef.current?.duration || 0;
        const viralMoments = await clipReasoningService.findViralMoments(transcription.text, duration);
        updateState({ analysisProgress: 90 });
        
        clips = viralMoments.map((m, i) => ({
          id: `clip_${i}_${Date.now()}`,
          title: m.title,
          startTimeSeconds: m.start,
          endTimeSeconds: m.end,
          duration: `${Math.floor(m.end - m.start)}s`,
          score: m.score,
          thumbnail: '',
          reason: m.reason
        }));

        if (clips.length === 0) {
          clips = generateFallbackClipsForFile(duration || TIMING.DEFAULT_VIDEO_DURATION_SECONDS);
        }
      } else {
        // Fallback for links for now
        clips = await generateClipsFromLink();
      }

      updateState({ analysisProgress: 100 });
      setTimeout(() => {
        updateState({
          isAnalyzing: false,
          activeTab: 'clips',
          generatedClips: clips,
        });
        onAnalysisComplete(clips);
      }, TIMING.DELAY_MS.MEDIUM);
    } catch (error) {
      console.error('Advanced clipping failed, falling back to audio analysis:', error);
      // Fallback to basic audio analysis if advanced fails
      if (state.uploadedFile) {
        const duration = videoRef.current?.duration || TIMING.DEFAULT_VIDEO_DURATION_SECONDS;
        const basicClips = await generateClipsFromAudio(state.uploadedFile, duration);
        updateState({
          isAnalyzing: false,
          activeTab: 'clips',
          generatedClips: basicClips,
        });
        onAnalysisComplete(basicClips);
      } else {
      updateState({
          isAnalyzing: false,
        analysisProgress: 0,
      });
      }
    }
  }, [state.uploadedFile, state.videoLink, updateState, videoRef, onAnalysisComplete]);

  return {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handleVideoLoaded,
    performAnalysis,
  };
};
