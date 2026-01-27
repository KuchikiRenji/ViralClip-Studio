import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import {
  ArrowLeft, ChevronRight, Sparkles, X
} from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  TABS,
  GENERATION,
  DEFAULT_MESSAGE_DELAY_MS,
  TYPING_SPEED_CPS,
  RECENT_STORIES,
} from './constants';
import { TextStoryProps, RecentStory } from './types';
import { TextStoryPreview } from './TextStoryPreview';
import { usePaywall } from '../../../../hooks/usePaywall';
import { TextStoryControls } from './TextStoryControls';
import { GeneratingOverlay } from './GeneratingOverlay';
import { GeneratedView } from './GeneratedView';
import { TextStoryHeader } from './TextStoryHeader';
import { useTextStoryState } from './useTextStoryState';
import { useTextStoryExport } from './useTextStoryExport';
import { useTextStoryControls } from './useTextStoryControls';
import { TemplateBuilder } from './TemplateBuilder';

export const TextStory = ({ onBack }: TextStoryProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const { state, setState, updateState, resetState } = useTextStoryState();
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { handleExportVideo, handleDownloadExported } = useTextStoryExport({
    state,
    setState,
    videoRef,
  });
  const {
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
  } = useTextStoryControls({
    state,
    setState,
    updateState,
    videoRef,
  });

  useEffect(() => {
    if (!state.isPlaying && state.currentTime === 0) {
       return;
    }
    const messagesWithContent = state.messages.filter(m => m.content.trim());
    let accumulatedTime = 0;
    let foundIndex = -1;
    let typing = false;
    let currentTypingText = '';

    for (let i = 0; i < messagesWithContent.length; i++) {
      const msg = messagesWithContent[i];
      const delay = msg.delay || DEFAULT_MESSAGE_DELAY_MS / 1000;
      const typingDuration = Math.max(0.5, msg.content.length / TYPING_SPEED_CPS);
      const readDelay = 0.5;

      const typeStart = accumulatedTime;
      const msgVisible = typeStart + typingDuration;
      const nextStart = msgVisible + delay + readDelay;

      if (state.currentTime >= msgVisible) {
        foundIndex = i;
      } else if (state.currentTime >= typeStart && state.currentTime < msgVisible) {
        foundIndex = i;
        typing = true;
        const typingProgress = (state.currentTime - typeStart) / typingDuration;
        const charsToShow = Math.floor(typingProgress * msg.content.length);
        currentTypingText = msg.content.slice(0, charsToShow);
      } else if (state.currentTime >= typeStart) {
        foundIndex = Math.max(foundIndex, i);
      }

      accumulatedTime = nextStart;
    }

    if (foundIndex !== state.visibleMessageIndex || typing !== state.isTyping || currentTypingText !== state.currentTypingText) {
        setState(prev => ({
          ...prev,
          visibleMessageIndex: foundIndex,
          isTyping: typing,
          currentTypingText: currentTypingText
        }));
    }
  }, [state.currentTime, state.messages, state.isPlaying, state.visibleMessageIndex, state.isTyping, state.currentTypingText, setState]);

  const formatTime = useCallback((seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleGenerate = useCallback(() => {
    const hasContent = state.messages.some(m => m.content.trim());
    if (!hasContent) {
      setState(prev => ({ ...prev, validationError: t('textStory.validation.noMessages') }));
      return;
    }
    if (!requireSubscription('Text Story')) return;
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
  }, [state.messages, setState, t]);

  const resetStory = useCallback(() => {
    if (state.profilePhoto) {
      URL.revokeObjectURL(state.profilePhoto);
    }
    if (state.uploadedBackgroundUrl) {
      URL.revokeObjectURL(state.uploadedBackgroundUrl);
    }
    resetState();
  }, [resetState, state.profilePhoto, state.uploadedBackgroundUrl]);

  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (state.validationError) {
      const timeout = setTimeout(() => {
        setState(prev => ({ ...prev, validationError: null }));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [state.validationError]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      updateState('currentTime', 0);
      updateState('isPlaying', false);
    }
  }, [state.selectedBackground, state.uploadedBackgroundUrl, updateState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecentDropdown(false);
      }
    };
    if (showRecentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRecentDropdown]);

  const handleLoadRecentStory = useCallback((story: RecentStory) => {
    loadRecentStory(story);
    setShowRecentDropdown(false);
  }, [loadRecentStory]);

  const handleLaunchTemplateBuilder = useCallback(() => {
    setShowTemplateBuilder(true);
  }, []);

  const handleTemplateBuilderComplete = useCallback((_templateBuilderState: unknown) => {
    setShowTemplateBuilder(false);
  }, []);

  const handleTemplateBuilderBack = useCallback(() => {
    setShowTemplateBuilder(false);
  }, []);

  const handleVideoError = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const error = video.error;

    if (error?.code === 1) {
      return;
    }

    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
    }));

    setTimeout(() => {
      videoRef.current?.load();
    }, 1000);
  }, [videoRef, setState]);

  const renderTabButton = (tab: typeof TABS[number], index: number) => {
    const isActive = state.currentTab === tab.id;
    const currentIndex = TABS.findIndex(t => t.id === state.currentTab);
    const isPast = currentIndex > index;
    return (
      <>
        <button
          onClick={() => updateState('currentTab', tab.id)}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all touch-target whitespace-nowrap snap-start ${
            isActive
              ? 'bg-blue-600 text-white'
              : isPast
                ? 'text-zinc-400 hover:text-white active:bg-zinc-800'
                : 'text-zinc-500 hover:text-zinc-300 active:bg-zinc-800'
          }`}
          type="button"
        >
          <span className="text-xs sm:text-sm">{tab.emoji}</span>
          <span className="hidden sm:inline">{t(tab.labelKey)}</span>
        </button>
        {index < TABS.length - 1 && (
          <>
            <ChevronRight size={14} className="text-zinc-600 flex-shrink-0 sm:hidden" />
            <ChevronRight size={16} className="text-zinc-600 flex-shrink-0 hidden sm:block" />
          </>
        )}
      </>
    );
  };

  const handleNext = useCallback(() => {
    const currentIndex = TABS.findIndex(t => t.id === state.currentTab);
    if (currentIndex < TABS.length - 1) {
      updateState('currentTab', TABS[currentIndex + 1].id);
    }
  }, [state.currentTab, updateState]);

  const handleBack = useCallback(() => {
    const currentIndex = TABS.findIndex(t => t.id === state.currentTab);
    if (currentIndex > 0) {
      updateState('currentTab', TABS[currentIndex - 1].id);
    }
  }, [state.currentTab, updateState]);

  const isLastTab = state.currentTab === 'background';
  const isFirstTab = state.currentTab === 'templates';

  if (state.isGenerating) {
    return (
      <div className="min-h-screen bg-background text-white">
        <GeneratingOverlay generationProgress={state.generationProgress} />
      </div>
    );
  }

  if (state.isGenerated) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col">
        <TextStoryHeader
          showRecentDropdown={false}
          onBack={onBack}
          onToggleRecentDropdown={() => {}}
          onLoadRecentStory={handleLoadRecentStory}
          onViewAllStories={onBack}
          recentStories={RECENT_STORIES}
        />
        <GeneratedView
          state={state}
          videoRef={videoRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onVideoEnded={handleVideoEnded}
          onVideoError={handleVideoError}
          onSeek={seekVideo}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onExportVideo={handleExportVideo}
          onDownloadExported={handleDownloadExported}
          onResetStory={resetStory}
          formatTime={formatTime}
        />
      </div>
    );
  }

  if (showTemplateBuilder) {
    return (
      <TemplateBuilder
        onBack={handleTemplateBuilderBack}
        onComplete={handleTemplateBuilderComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={dropdownRef}>
            <TextStoryHeader
              showRecentDropdown={showRecentDropdown}
              onBack={onBack}
              onToggleRecentDropdown={() => setShowRecentDropdown(!showRecentDropdown)}
              onLoadRecentStory={handleLoadRecentStory}
              onViewAllStories={() => {
                setShowRecentDropdown(false);
                onBack();
              }}
              recentStories={RECENT_STORIES}
            />
          </div>
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 overflow-x-auto scrollbar-hide touch-pan-x">
            {TABS.map((tab, index) => (
              <Fragment key={tab.id}>
                {renderTabButton(tab, index)}
              </Fragment>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6">
              <TextStoryControls
                state={state}
                updateState={updateState}
                updateMessage={updateMessage}
                addMessage={addMessage}
                deleteMessage={deleteMessage}
                duplicateMessage={duplicateMessage}
                swapAllMessages={swapAllMessages}
                parseScript={parseScript}
                generateAIScript={generateAIScript}
                onProfilePhotoSelect={handleProfilePhotoSelect}
                onProfilePhotoRemove={handleProfilePhotoRemove}
                onBackgroundFileSelect={handleBackgroundFileSelect}
                onBackgroundFileRemove={handleBackgroundFileRemove}
                onPreviewVoice={handlePreviewVoice}
                onReorderMessages={reorderMessages}
                onLaunchTemplateBuilder={handleLaunchTemplateBuilder}
              />
              <div className="flex items-center justify-center gap-4 mt-8 pb-8 lg:hidden order-3 safe-area-inset-bottom">
                {!isFirstTab && (
                  <button
                    onClick={handleBack}
                    className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 active:bg-zinc-600 transition-colors touch-target active:scale-95"
                    type="button"
                  >
                    <ArrowLeft size={20} className="sm:hidden" />
                    <ArrowLeft size={18} className="hidden sm:block" />
                  </button>
                )}
                <button
                  onClick={isLastTab ? handleGenerate : handleNext}
                  className="px-6 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-full flex items-center gap-2 transition-colors touch-target active:scale-95"
                  type="button"
                >
                  {isLastTab ? (
                    <>
                      <Sparkles size={18} className="sm:hidden" />
                      <Sparkles size={16} className="hidden sm:block" />
                      {t('textStory.generateStory')}
                    </>
                  ) : (
                    <>
                      {t('textStory.next')}
                      <ChevronRight size={18} className="sm:hidden" />
                      <ChevronRight size={16} className="hidden sm:block" />
                    </>
                  )}
                </button>
              </div>
              <div className="order-1 lg:order-2">
                <TextStoryPreview
                  state={state}
                  videoRef={videoRef}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onVideoEnded={handleVideoEnded}
                  onVideoError={handleVideoError}
                  onSeek={seekVideo}
                  onTogglePlay={togglePlay}
                  onToggleMute={toggleMute}
                  onToggleFullscreen={toggleFullscreen}
                  formatTime={formatTime}
                />
              </div>
            </div>
            {state.validationError && (
              <div className="mx-6 mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <X size={16} />
                {state.validationError}
              </div>
            )}
            <div className="hidden lg:flex items-center justify-end gap-4 p-6 border-t border-zinc-800">
                {!isFirstTab && (
                  <button
                    onClick={handleBack}
                    className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors touch-target"
                    type="button"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <button
                  onClick={isLastTab ? handleGenerate : handleNext}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-full flex items-center gap-2 transition-colors touch-target active:scale-95"
                  type="button"
                >
                  {isLastTab ? (
                    <>
                      <Sparkles size={16} />
                      {t('textStory.generateStory')}
                    </>
                  ) : (
                    <>
                      {t('textStory.next')}
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
