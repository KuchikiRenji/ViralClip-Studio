import { useCallback } from 'react';
import type { TextStoryState, Message, MessageSender, RecentStory } from './types';
import { createInitialMessage, VOICE_PREVIEW_TEXT, DEFAULT_MESSAGE_DELAY_MS, TYPING_INDICATOR_DURATION_MS } from './constants';
import { generateAIConversation, AIGenerationOptions } from './aiGenerationUtils';
interface UseTextStoryControlsProps {
  state: TextStoryState;
  setState: React.Dispatch<React.SetStateAction<TextStoryState>>;
  updateState: <K extends keyof TextStoryState>(key: K, value: TextStoryState[K]) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}
export const useTextStoryControls = ({
  state,
  setState,
  updateState,
  videoRef,
}: UseTextStoryControlsProps) => {
  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => msg.id === id ? { ...msg, ...updates } : msg),
    }));
  }, [setState]);
  const addMessage = useCallback(() => {
    setState(prev => {
      const lastMessage = prev.messages[prev.messages.length - 1];
      const nextSender: MessageSender = lastMessage?.sender === 'left' ? 'right' : 'left';
      return {
        ...prev,
        messages: [...prev.messages, createInitialMessage(nextSender)],
      };
    });
  }, [setState]);
  const deleteMessage = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== id),
    }));
  }, [setState]);
  const duplicateMessage = useCallback((id: string) => {
    setState(prev => {
      const index = prev.messages.findIndex(msg => msg.id === id);
      if (index === -1) return prev;
      const original = prev.messages[index];
      const duplicate: Message = {
        ...original,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      const newMessages = [...prev.messages];
      newMessages.splice(index + 1, 0, duplicate);
      return { ...prev, messages: newMessages };
    });
  }, [setState]);
  const swapAllMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => ({
        ...msg,
        sender: msg.sender === 'left' ? 'right' : 'left',
      })),
    }));
  }, [setState]);
  const reorderMessages = useCallback((newMessages: Message[]) => {
    setState(prev => ({ ...prev, messages: newMessages }));
  }, [setState]);
  const parseScript = useCallback((script: string) => {
    const lines = script.trim().split('\n').filter(line => line.trim());
    const parsedMessages: Message[] = lines.map((line, index) => {
      const sender: MessageSender = index % 2 === 0 ? 'left' : 'right';
      return createInitialMessage(sender, line.trim());
    });
    if (parsedMessages.length > 0) {
      setState(prev => ({ ...prev, messages: parsedMessages }));
    }
  }, [setState]);
  const generateAIScript = useCallback(async (options?: AIGenerationOptions) => {
    const prompt = options?.prompt || state.aiPrompt.trim();

    if (!prompt) {
      updateState('validationError', 'Please enter a prompt for AI generation');
      return;
    }

    setState(prev => ({
      ...prev,
      isGenerating: true,
      generationProgress: 0,
      validationError: null,
    }));

    try {
      const result = await generateAIConversation({
        prompt,
        provider: options?.provider || 'openai',
        temperature: options?.temperature || 0.8,
        maxMessages: options?.maxMessages || 8,
        conversationStyle: options?.conversationStyle || 'casual',
        messageLength: options?.messageLength || 'medium',
      });

      if (result.error) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          validationError: result.error,
        }));
        return;
      }

      if (result.messages.length === 0) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          validationError: 'No messages generated. Please try again.',
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        messages: result.messages,
        isGenerating: false,
        generationProgress: 100,
        currentTab: 'script',
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        validationError: error instanceof Error ? error.message : 'Failed to generate conversation',
      }));
    }
  }, [state.aiPrompt, setState, updateState]);
  const handleProfilePhotoSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setState(prev => {
      if (prev.profilePhoto) {
        URL.revokeObjectURL(prev.profilePhoto);
      }
      return {
        ...prev,
        profilePhotoFile: file,
        profilePhoto: url,
      };
    });
  }, [setState]);
  const handleProfilePhotoRemove = useCallback(() => {
    setState(prev => {
      if (prev.profilePhoto) {
        URL.revokeObjectURL(prev.profilePhoto);
      }
      return {
        ...prev,
        profilePhotoFile: null,
        profilePhoto: null,
      };
    });
  }, [setState]);
  const handleBackgroundFileSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setState(prev => {
      if (prev.uploadedBackgroundUrl) {
        URL.revokeObjectURL(prev.uploadedBackgroundUrl);
      }
      return {
        ...prev,
        uploadedBackgroundFile: file,
        uploadedBackgroundUrl: url,
      };
    });
  }, [setState]);
  const handleBackgroundFileRemove = useCallback(() => {
    setState(prev => {
      if (prev.uploadedBackgroundUrl) {
        URL.revokeObjectURL(prev.uploadedBackgroundUrl);
      }
      return {
        ...prev,
        uploadedBackgroundFile: null,
        uploadedBackgroundUrl: null,
      };
    });
  }, [setState]);
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !state.isMuted;
    }
    updateState('isMuted', !state.isMuted);
  }, [state.isMuted, updateState, videoRef]);
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      updateState('currentTime', videoRef.current.currentTime);
    }
  }, [updateState, videoRef]);
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      updateState('duration', isFinite(duration) ? duration : 15);
    }
  }, [updateState, videoRef]);
  const seekVideo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * state.duration;
    videoRef.current.currentTime = newTime;
    updateState('currentTime', newTime);
  }, [state.duration, updateState, videoRef]);
  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  }, [videoRef]);
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (state.isPlaying) {
      videoRef.current.pause();
      updateState('isPlaying', false);
    } else {
      videoRef.current.play().catch(() => {
        updateState('isPlaying', false);
      });
      updateState('isPlaying', true);
    }
  }, [state.isPlaying, updateState, videoRef]);
  const handleVideoEnded = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      visibleMessageIndex: -1,
      isTyping: false,
    }));
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [setState, videoRef]);
  const handlePreviewVoice = useCallback((side: 'left' | 'right') => {
    if (state.isPreviewingVoice) {
      speechSynthesis.cancel();
      setState(prev => ({ ...prev, isPreviewingVoice: false }));
      return;
    }
    const sampleMessage = state.messages.find(m => m.sender === side && m.content.trim());
    const text = sampleMessage?.content || VOICE_PREVIEW_TEXT;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    const voiceId = side === 'left' ? state.leftVoice : state.rightVoice;
    const matchedVoice = voices.find(v => v.name.toLowerCase().includes(voiceId));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.onend = () => {
      setState(prev => ({ ...prev, isPreviewingVoice: false }));
    };
    setState(prev => ({ ...prev, isPreviewingVoice: true }));
    speechSynthesis.speak(utterance);
  }, [state.messages, state.leftVoice, state.rightVoice, state.isPreviewingVoice, setState]);
  const loadRecentStory = useCallback((story: RecentStory) => {
    setState(prev => ({
      ...prev,
      contactName: story.contactName,
      selectedTemplate: story.template,
      darkMode: story.darkMode,
      messages: story.messages,
      currentTab: 'templates',
      isGenerated: false,
      generationProgress: 0,
    }));
  }, [setState]);
  return {
    updateMessage,
    addMessage,
    deleteMessage,
    duplicateMessage,
    swapAllMessages,
    reorderMessages,
    parseScript,
    generateAIScript,
    handleProfilePhotoSelect,
    handleProfilePhotoRemove,
    handleBackgroundFileSelect,
    handleBackgroundFileRemove,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    seekVideo,
    toggleFullscreen,
    togglePlay,
    handleVideoEnded,
    handlePreviewVoice,
    loadRecentStory,
  };
};