import { useRef, useEffect, Fragment } from 'react';
import {
  ArrowLeft, ChevronRight, ChevronDown, Sparkles,
  Check, Download, RefreshCw, AlertCircle, Loader2,
} from 'lucide-react';
import type { StoryVideoProps } from './StoryVideoTypes';
import { TABS } from './StoryVideoConstants';
import { useStoryVideoState } from './useStoryVideoState';
import { useStoryVideoHandlers } from './useStoryVideoHandlers';
import { useStoryVideoExport } from './useStoryVideoExport';
import { GeneralTab, SubtitlesTab, BackgroundTab, AudioTab } from './tabs';
import { StoryVideoPreview } from './StoryVideoPreview';
import { useTranslation } from '../../../hooks/useTranslation';
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
export const StoryVideo = ({ onBack }: StoryVideoProps) => {
  const { t } = useTranslation();
  const { state, setState, updateState, resetState } = useStoryVideoState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    togglePlay,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    seekVideo,
    handleGenerate,
    previewVoice,
    generateAIScript,
    handleBackgroundUpload,
    handleMusicUpload,
  } = useStoryVideoHandlers({
    state,
    updateState,
    setState,
    videoRef,
    audioRef,
  });
  const { handleExportVideo, handleDownloadExported } = useStoryVideoExport({
    state,
    setState,
    videoRef,
    audioRef,
  });
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      setState(prev => ({ ...prev, currentTime: 0, isPlaying: false }));
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [state.selectedBackground, state.uploadedBackgroundUrl, setState]);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.musicVolume;
    }
  }, [state.musicVolume]);
  useEffect(() => {
    return () => {
      if (state.uploadedBackgroundUrl) {
        URL.revokeObjectURL(state.uploadedBackgroundUrl);
      }
      if (state.uploadedMusicUrl) {
        URL.revokeObjectURL(state.uploadedMusicUrl);
      }
      window.speechSynthesis.cancel();
    };
  }, [state.uploadedBackgroundUrl, state.uploadedMusicUrl]);
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);
  const isLastTab = state.currentTab === 'audio';
  const isFirstTab = state.currentTab === 'general';
  const renderTabButton = (tab: typeof TABS[number], index: number) => {
    const isActive = state.currentTab === tab.id;
    const currentIndex = TABS.findIndex(t => t.id === state.currentTab);
    const isPast = currentIndex > index;
    return (
      <Fragment key={tab.id}>
        <button
          onClick={() => updateState('currentTab', tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            isActive
              ? 'bg-blue-600 text-white'
              : isPast
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="text-xs">{tab.icon}</span>
          {t(tab.labelKey)}
        </button>
        {index < TABS.length - 1 && (
          <ChevronRight size={16} className="text-zinc-600" />
        )}
      </Fragment>
    );
  };
  const handleNext = () => {
    const currentIndex = TABS.findIndex(t => t.id === state.currentTab);
    if (currentIndex < TABS.length - 1) {
      updateState('currentTab', TABS[currentIndex + 1].id);
    }
  };
  const handleBack = () => {
    const currentIndex = TABS.findIndex(t => t.id === state.currentTab);
    if (currentIndex > 0) {
      updateState('currentTab', TABS[currentIndex - 1].id);
    }
  };
  const renderGeneratingOverlay = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <RefreshCw size={48} className="text-blue-500 animate-spin mb-6" />
      <h2 className="text-2xl font-bold mb-2">{t('storyVideo.generating')}</h2>
      <p className="text-zinc-400 mb-6">{t('storyVideo.generatingSubtitle')}</p>
      <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-100"
          style={{ width: `${state.generationProgress}%` }}
        />
      </div>
      <span className="text-sm text-zinc-500 mt-2">{state.generationProgress}%</span>
    </div>
  );
  const renderGeneratedView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-400 sm:hidden" />
          <Check size={40} className="text-emerald-400 hidden sm:block" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('storyVideo.generated')}</h1>
        <p className="text-zinc-400 text-sm sm:text-base">{t('storyVideo.generatedSubtitle')}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start w-full max-w-xl sm:max-w-none justify-center">
        <div className="flex justify-center">
          <StoryVideoPreview
            state={state}
            videoRef={videoRef}
            audioRef={audioRef}
            togglePlay={togglePlay}
            toggleMute={toggleMute}
            handleTimeUpdate={handleTimeUpdate}
            handleLoadedMetadata={handleLoadedMetadata}
            seekVideo={seekVideo}
            formatTime={formatTime}
          />
        </div>
        <div className="space-y-4 w-full sm:w-56">
          {state.isExporting ? (
            <div className="w-full py-3 bg-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {t('storyVideo.exporting')} {Math.round(state.exportProgress)}%
            </div>
          ) : state.exportedBlob ? (
            <button 
              onClick={handleDownloadExported}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Download size={18} />
              {t('storyVideo.downloadVideo')}
            </button>
          ) : (
            <button 
              onClick={handleExportVideo}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Download size={18} />
              {t('storyVideo.exportVideo')}
            </button>
          )}
          <button
            onClick={resetState}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
          >
            {t('storyVideo.createNew')}
          </button>
        </div>
      </div>
    </div>
  );
  if (state.isGenerating) {
    return (
      <div className="min-h-screen bg-background text-white">
        {renderGeneratingOverlay()}
      </div>
    );
  }
  if (state.isGenerated) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 active:bg-zinc-600 transition-colors touch-target active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-semibold">{t('storyVideo.title')}</h1>
          </div>
        </header>
        {renderGeneratedView()}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 active:bg-zinc-600 active:scale-95 transition-all touch-target"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold">{t('storyVideo.title')}</h1>
            </div>
            <button className="hidden sm:flex px-4 py-2 border border-zinc-700 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 items-center gap-2 transition-colors">
              {t('storyVideo.viewRecent')}
              <ChevronDown size={14} />
            </button>
          </header>
          <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
            {TABS.map((tab, index) => renderTabButton(tab, index))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 sm:p-6">
              <div className="flex-1 min-w-0 order-2 lg:order-1">
                {state.currentTab === 'general' && (
                  <GeneralTab
                    state={state}
                    updateState={updateState}
                    generateAIScript={generateAIScript}
                  />
                )}
                {state.currentTab === 'subtitles' && (
                  <SubtitlesTab
                    state={state}
                    updateState={updateState}
                  />
                )}
                {state.currentTab === 'background' && (
                  <BackgroundTab
                    state={state}
                    updateState={updateState}
                    setState={setState}
                    handleBackgroundUpload={handleBackgroundUpload}
                  />
                )}
                {state.currentTab === 'audio' && (
                  <AudioTab
                    state={state}
                    updateState={updateState}
                    setState={setState}
                    previewVoice={previewVoice}
                    handleMusicUpload={handleMusicUpload}
                  />
                )}
                {state.validationError && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{state.validationError}</p>
                  </div>
                )}
                <div className="flex items-center justify-center gap-4 mt-8 pb-8">
                  {!isFirstTab && (
                    <button
                      onClick={handleBack}
                      className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 active:bg-zinc-600 transition-colors touch-target active:scale-95"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <button
                    onClick={isLastTab ? handleGenerate : handleNext}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-full flex items-center gap-2 transition-colors touch-target active:scale-95"
                  >
                    {isLastTab ? (
                      <>
                        <Sparkles size={16} />
                        {t('storyVideo.generateStory')}
                      </>
                    ) : (
                      <>
                        {t('storyVideo.next')}
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="order-1 lg:order-2 flex justify-center lg:block">
                <StoryVideoPreview
                  state={state}
                  videoRef={videoRef}
                  audioRef={audioRef}
                  togglePlay={togglePlay}
                  toggleMute={toggleMute}
                  handleTimeUpdate={handleTimeUpdate}
                  handleLoadedMetadata={handleLoadedMetadata}
                  seekVideo={seekVideo}
                  formatTime={formatTime}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};