import { useCallback, useRef } from 'react';
import type { StoryVideoState } from './StoryVideoTypes';
import { usePaywall } from '../../../hooks/usePaywall';
import {
  GENERATION,
  MAX_BACKGROUND_FILE_SIZE_MB,
  MAX_MUSIC_FILE_SIZE_MB,
  BYTES_PER_MB,
  VOICE_PREVIEW_TEXT,
  VOICE_OPTIONS,
} from './StoryVideoConstants';
import type { SocialType } from './StoryVideoTypes';
import { scriptService } from '../../../services/api/scriptService';

interface UseStoryVideoHandlersProps {
  state: StoryVideoState;
  updateState: <K extends keyof StoryVideoState>(key: K, value: StoryVideoState[K]) => void;
  setState: React.Dispatch<React.SetStateAction<StoryVideoState>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export const useStoryVideoHandlers = ({
  state,
  updateState,
  setState,
  videoRef,
  audioRef,
}: UseStoryVideoHandlersProps) => {
  const { requireSubscription } = usePaywall();
  // ... existing code ...
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (state.isPlaying) {
      videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    } else {
      videoRef.current.play();
      if (audioRef.current && state.backgroundMusicEnabled) {
        audioRef.current.currentTime = videoRef.current.currentTime;
        audioRef.current.play();
      }
    }
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [state.isPlaying, state.backgroundMusicEnabled, videoRef, audioRef, setState]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !state.isMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = !state.isMuted;
    }
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, [state.isMuted, videoRef, audioRef, setState]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      updateState('currentTime', videoRef.current.currentTime);
    }
  }, [videoRef, updateState]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      updateState('duration', videoRef.current.duration);
    }
  }, [videoRef, updateState]);

  const seekVideo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * state.duration;
    videoRef.current.currentTime = newTime;
    updateState('currentTime', newTime);
  }, [state.duration, videoRef, updateState]);

  const validateBeforeGenerate = useCallback((): string | null => {
    if (!state.script.trim()) {
      return 'Please add a script in the General tab before generating.';
    }
    if (state.backgroundSource === 'upload' && !state.uploadedBackgroundFile) {
      return 'Please upload a background video or select one from the library.';
    }
    return null;
  }, [state.script, state.backgroundSource, state.uploadedBackgroundFile]);

  const handleGenerate = useCallback(() => {
    const error = validateBeforeGenerate();
    if (error) {
      setState(prev => ({ ...prev, validationError: error }));
      return;
    }
    if (!requireSubscription('Story Video')) return;
    setState(prev => ({ ...prev, isGenerating: true, generationProgress: 0, validationError: null }));
    const interval = setInterval(() => {
      setState(prev => {
        const newProgress = prev.generationProgress + GENERATION.PROGRESS_STEP;
        if (newProgress >= GENERATION.MAX_PROGRESS) {
          clearInterval(interval);
          return { ...prev, isGenerating: false, generationProgress: 100, isGenerated: true };
        }
        return { ...prev, generationProgress: newProgress };
      });
    }, GENERATION.FAST_INTERVAL_MS);
  }, [validateBeforeGenerate, setState]);

  const previewVoice = useCallback(() => {
    if (state.isPreviewingVoice) {
      window.speechSynthesis.cancel();
      setState(prev => ({ ...prev, isPreviewingVoice: false }));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(VOICE_PREVIEW_TEXT);
    const voices = window.speechSynthesis.getVoices();
    const voiceIndex = VOICE_OPTIONS.findIndex(v => v.id === state.selectedVoice);
    if (voices[voiceIndex]) {
      utterance.voice = voices[voiceIndex];
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setState(prev => ({ ...prev, isPreviewingVoice: false }));
    utterance.onerror = () => setState(prev => ({ ...prev, isPreviewingVoice: false }));
    setState(prev => ({ ...prev, isPreviewingVoice: true }));
    window.speechSynthesis.speak(utterance);
  }, [state.isPreviewingVoice, state.selectedVoice, setState]);

  const generateAIScript = useCallback(async () => {
    if (!state.aiPrompt.trim()) {
      setState(prev => ({ ...prev, validationError: 'Please enter a prompt first' }));
      return;
    }
    if (!requireSubscription('Story Video')) return;
    
    setState(prev => ({ ...prev, isGeneratingScript: true, validationError: null }));
    
    try {
      const typeMap: Record<SocialType, 'story' | 'reddit' | 'educational' | 'promotional'> = {
        reddit: 'reddit',
        instagram: 'story',
        twitter: 'story',
        threads: 'story'
      };

      const result = await scriptService.generateScript({
        prompt: state.aiPrompt,
        type: typeMap[state.socialType] || 'story',
        tone: 'dramatic',
        duration_seconds: 60,
        include_hooks: true,
      });

      setState(prev => ({
        ...prev,
        script: result.script,
        isGeneratingScript: false,
        aiPrompt: '',
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isGeneratingScript: false,
        validationError: err instanceof Error ? err.message : 'Failed to generate script',
      }));
    }
  }, [state.aiPrompt, state.socialType, setState]);

  const handleBackgroundUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileSizeMB = file.size / BYTES_PER_MB;
    if (fileSizeMB > MAX_BACKGROUND_FILE_SIZE_MB) {
      setState(prev => ({ ...prev, validationError: `File too large. Max size is ${MAX_BACKGROUND_FILE_SIZE_MB}MB.` }));
      return;
    }
    if (state.uploadedBackgroundUrl) {
      URL.revokeObjectURL(state.uploadedBackgroundUrl);
    }
    const url = URL.createObjectURL(file);
    setState(prev => ({ ...prev, uploadedBackgroundFile: file, uploadedBackgroundUrl: url }));
  }, [state.uploadedBackgroundUrl, setState]);

  const handleMusicUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileSizeMB = file.size / BYTES_PER_MB;
    if (fileSizeMB > MAX_MUSIC_FILE_SIZE_MB) {
      setState(prev => ({ ...prev, validationError: `File too large. Max size is ${MAX_MUSIC_FILE_SIZE_MB}MB.` }));
      return;
    }
    if (state.uploadedMusicUrl) {
      URL.revokeObjectURL(state.uploadedMusicUrl);
    }
    const url = URL.createObjectURL(file);
    setState(prev => ({ ...prev, uploadedMusicFile: file, uploadedMusicUrl: url }));
  }, [state.uploadedMusicUrl, setState]);

  return {
    togglePlay,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    seekVideo,
    validateBeforeGenerate,
    handleGenerate,
    previewVoice,
    generateAIScript,
    handleBackgroundUpload,
    handleMusicUpload,
  };
};