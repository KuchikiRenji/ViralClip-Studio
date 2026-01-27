import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react';
import { ProgressOverlay } from '../../shared/ProgressOverlay';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { UploadTab } from './UploadTab';
import { BackgroundTab } from './BackgroundTab';
import { SubtitleTab } from './SubtitleTab';
import { VideoPreview } from './VideoPreview';
import { GeneratedView } from './GeneratedView';
import type { SplitScreenState } from './types';
import {
  TABS,
  SUBTITLE_TEMPLATES,
  BACKGROUND_VIDEOS,
  INITIAL_STATE,
  GENERATION,
} from './constants';
import { scriptService } from '../../../services/api';
interface SplitScreenProps {
  onBack: () => void;
}

export const SplitScreen = ({ onBack }: SplitScreenProps) => {
  const { t } = useTranslation();
  const { requireSubscription, navigateToPricing } = usePaywall();
  const [state, setState] = useState<SplitScreenState>(INITIAL_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scriptProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const updateState = useCallback(<K extends keyof SplitScreenState>(
    key: K,
    value: SplitScreenState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
    setValidationError(null);
  }, []);
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (scriptProgressIntervalRef.current) {
        clearInterval(scriptProgressIntervalRef.current);
      }
      if (state.uploadedFileUrl) {
        URL.revokeObjectURL(state.uploadedFileUrl);
      }
      if (state.customBackgroundUrl) {
        URL.revokeObjectURL(state.customBackgroundUrl);
      }
    };
  }, [state.uploadedFileUrl, state.customBackgroundUrl]);
  const handleFileSelect = useCallback((file: File) => {
    if (state.uploadedFileUrl) {
      URL.revokeObjectURL(state.uploadedFileUrl);
    }
    const url = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      uploadedFile: file,
      uploadedFileUrl: url,
    }));
    setValidationError(null);
  }, [state.uploadedFileUrl]);
  const handleFileRemove = useCallback(() => {
    if (state.uploadedFileUrl) {
      URL.revokeObjectURL(state.uploadedFileUrl);
    }
    setState(prev => ({
      ...prev,
      uploadedFile: null,
      uploadedFileUrl: null,
    }));
  }, [state.uploadedFileUrl]);
  const handleBackgroundFileUpload = useCallback((file: File) => {
    if (state.customBackgroundUrl) {
      URL.revokeObjectURL(state.customBackgroundUrl);
    }
    const url = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      customBackgroundFile: file,
      customBackgroundUrl: url,
    }));
  }, [state.customBackgroundUrl]);
  const handleGenerate = useCallback(() => {
    if (!state.uploadedFile && !state.videoUrl) {
      setValidationError(t('splitscreen.uploadRequired'));
      updateState('currentTab', 'upload');
      return;
    }
    
    // Check if background video is selected
    const hasBackground = (state.backgroundSource === 'upload' && state.customBackgroundUrl) ||
                          (state.backgroundSource === 'library' && state.selectedBackground);
    if (!hasBackground) {
      setValidationError('Please select or upload a background video first.');
      updateState('currentTab', 'background');
      return;
    }
    
    if (!requireSubscription('Split Screen')) {
      return;
    }
    
    updateState('isGenerating', true);
    updateState('generationProgress', 0);
    progressIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newProgress = prev.generationProgress + GENERATION.PROGRESS_STEP;
        if (newProgress >= GENERATION.MAX_PROGRESS) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return { ...prev, generationProgress: GENERATION.MAX_PROGRESS, isGenerating: false, isGenerated: true };
        }
        return { ...prev, generationProgress: newProgress };
      });
    }, GENERATION.INTERVAL_MS);
  }, [state.uploadedFile, state.videoUrl, state.backgroundSource, state.customBackgroundUrl, state.selectedBackground, updateState, requireSubscription, t]);

  const handleGenerateScript = useCallback(async () => {
    const prompt = state.scriptPrompt.trim();
    if (!prompt) {
      setValidationError('Add a script prompt first.');
      return;
    }

    if (!requireSubscription('Split Screen')) {
      return;
    }

    updateState('isGenerating', true);
    updateState('generationProgress', 1); // Start at 1%
    
    // Start progress animation from 1% to 99% while waiting for API
    scriptProgressIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newProgress = Math.min(prev.generationProgress + GENERATION.PROGRESS_STEP, 99);
        return { ...prev, generationProgress: newProgress };
      });
    }, GENERATION.INTERVAL_MS);
    
    try {
      const result = await scriptService.generateScript({
        prompt,
        type: 'custom',
        tone: 'casual',
        duration_seconds: 60,
        include_hooks: true,
        include_cta: false,
      });
      
      // Clear the progress interval
      if (scriptProgressIntervalRef.current) {
        clearInterval(scriptProgressIntervalRef.current);
        scriptProgressIntervalRef.current = null;
      }
      
      updateState('generatedScript', result.script.trim());
      updateState('generationProgress', 100); // Complete at 100%
    } catch (err) {
      // Clear the progress interval on error
      if (scriptProgressIntervalRef.current) {
        clearInterval(scriptProgressIntervalRef.current);
        scriptProgressIntervalRef.current = null;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate script';
      if (errorMessage.includes('SUBSCRIPTION_REQUIRED') || errorMessage.includes('402')) {
        navigateToPricing();
      } else {
        setValidationError(errorMessage);
      }
    } finally {
      updateState('isGenerating', false);
    }
  }, [state.scriptPrompt, t, updateState, requireSubscription]);
  const handleCreateNew = useCallback(() => {
    if (state.uploadedFileUrl) {
      URL.revokeObjectURL(state.uploadedFileUrl);
    }
    if (state.customBackgroundUrl) {
      URL.revokeObjectURL(state.customBackgroundUrl);
    }
    setState(INITIAL_STATE);
    setValidationError(null);
  }, [state.uploadedFileUrl, state.customBackgroundUrl]);
  const goToNextTab = useCallback(() => {
    const currentIndex = TABS.findIndex(tab => tab.id === state.currentTab);
    if (currentIndex < TABS.length - 1) {
      updateState('currentTab', TABS[currentIndex + 1].id);
    }
  }, [state.currentTab, updateState]);
  const goToPrevTab = useCallback(() => {
    const currentIndex = TABS.findIndex(tab => tab.id === state.currentTab);
    if (currentIndex > 0) {
      updateState('currentTab', TABS[currentIndex - 1].id);
    }
  }, [state.currentTab, updateState]);
  const getSelectedTemplate = useCallback(() => {
    const base =
      SUBTITLE_TEMPLATES.find(t => t.id === state.selectedSubtitleTemplate) ||
      SUBTITLE_TEMPLATES[0];

    // Merge user overrides (font/color/stroke/bg) into the base template
    // Preserve template properties: weight, style, transform
    return {
      ...base,
      fontFamily: state.subtitleFont || base.fontFamily,
      color:
        base.color === 'gradient' || base.color === 'split'
          ? base.color
          : state.subtitleColor || base.color,
      strokeWidth: state.strokeSize ?? base.strokeWidth,
      strokeColor: state.strokeColor || base.strokeColor,
      bgColor: state.subtitleBgColor || base.bgColor,
      // Preserve template-specific properties
      weight: base.weight,
      style: base.style,
      transform: base.transform,
    };
  }, [
    state.selectedSubtitleTemplate,
    state.subtitleFont,
    state.subtitleColor,
    state.strokeSize,
    state.strokeColor,
    state.subtitleBgColor,
  ]);
  const getBackgroundVideoSrc = useCallback((): string | undefined => {
    if (state.backgroundSource === 'upload' && state.customBackgroundUrl) {
      return state.customBackgroundUrl;
    }
    const selected = BACKGROUND_VIDEOS.find(bg => bg.id === state.selectedBackground);
    return selected?.src;
  }, [state.backgroundSource, state.customBackgroundUrl, state.selectedBackground]);

  const getBackgroundPoster = useCallback((): string | undefined => {
    if (state.backgroundSource === 'upload' && state.customBackgroundUrl) return undefined;
    const selected = BACKGROUND_VIDEOS.find(bg => bg.id === state.selectedBackground);
    return selected?.thumbnail;
  }, [state.backgroundSource, state.customBackgroundUrl, state.selectedBackground]);
  const currentTabIndex = TABS.findIndex(tab => tab.id === state.currentTab);
  const isLastTab = currentTabIndex === TABS.length - 1;
  const isFirstTab = currentTabIndex === 0;
  return (
    <div className="min-h-dvh min-h-screen bg-background text-white">
      {state.isGenerating && (
        <ProgressOverlay
          title={t('splitscreen.generating')}
          progress={state.generationProgress}
        />
      )}
      <header 
        className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-white/[0.06] px-4 sm:px-6 py-3 sm:py-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target touch-manipulation active:scale-95"
              type="button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold truncate">{t('splitscreen.title')}</h1>
          </div>
          <button
            className="hidden sm:flex px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-white items-center gap-2 transition-colors touch-target"
            type="button"
          >
            {t('splitscreen.viewRecentlyCreated')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {!state.isGenerated && (
          <nav className="flex items-center gap-2 mt-3 sm:mt-4 overflow-x-auto scrollbar-hide pb-1 touch-pan-x snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {TABS.map((tab, index) => (
              <Fragment key={tab.id}>
                <button
                  onClick={() => updateState('currentTab', tab.id)}
                  className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap snap-start touch-manipulation active:scale-95 flex-shrink-0 ${
                    state.currentTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:text-white active:bg-zinc-800'
                  }`}
                  type="button"
                >
                  <span>{tab.icon}</span>
                  <span className="hidden xs:inline">{tab.label}</span>
                  <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                </button>
                {index < TABS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 hidden xs:block" />
                )}
              </Fragment>
            ))}
          </nav>
        )}
      </header>
      <main className="p-4 sm:p-6">
        {state.isGenerated ? (
          <GeneratedView
            subtitlesEnabled={state.subtitlesEnabled}
            mainVideoUrl={state.uploadedFileUrl || state.videoUrl}
            backgroundVideoSrc={getBackgroundVideoSrc()}
            backgroundPoster={getBackgroundPoster()}
            template={getSelectedTemplate()}
            subtitlePosition={state.subtitlePosition}
            subtitleCustomPosition={state.subtitleCustomPosition}
            subtitleSize={state.subtitleSize}
            splitRatio={state.splitRatio}
            splitVariant={state.splitVariant}
            scriptText={state.generatedScript || state.scriptPrompt}
            mainVolume={state.mainVolume}
            backgroundVolume={state.backgroundVolume}
            onCreateNew={handleCreateNew}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="flex-1 order-2 lg:order-1">
              <div className="max-w-4xl">
                {validationError && (
                  <div className="mb-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {validationError}
                  </div>
                )}
                {state.currentTab === 'upload' && (
                  <UploadTab
                    splitVariant={state.splitVariant}
                      onSplitVariantChange={(variant) => {
                        updateState('splitVariant', variant);
                        const nextMainPlacement = variant === 'vertical' ? 'left' : 'top';
                        const nextBgPlacement = variant === 'vertical' ? 'right' : 'bottom';
                        updateState('mainVideoPlacement', nextMainPlacement);
                        updateState('customBackgroundPlacement', nextBgPlacement);
                      }}
                    scriptPrompt={state.scriptPrompt}
                    generatedScript={state.generatedScript}
                    onScriptPromptChange={(value) => updateState('scriptPrompt', value)}
                    onGenerateScript={handleGenerateScript}
                    uploadedFile={state.uploadedFile}
                    videoUrl={state.videoUrl}
                    placement={state.mainVideoPlacement}
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    onVideoUrlChange={(url) => updateState('videoUrl', url)}
                    onPlacementChange={(placement) => updateState('mainVideoPlacement', placement)}
                  />
                )}
                {state.currentTab === 'background' && (
                  <BackgroundTab
                    backgroundSource={state.backgroundSource}
                    selectedBackground={state.selectedBackground}
                    backgrounds={BACKGROUND_VIDEOS}
                    customBackgroundFile={state.customBackgroundFile}
                    customPlacement={state.customBackgroundPlacement}
                    onSourceChange={(source) => updateState('backgroundSource', source)}
                    onBackgroundSelect={(id) => {
                      // Toggle: if clicking the same video, deselect it
                      if (state.selectedBackground === id) {
                        updateState('selectedBackground', '');
                      } else {
                        updateState('selectedBackground', id);
                      }
                    }}
                    onFileUpload={handleBackgroundFileUpload}
                    onFileRemove={() => {
                      if (state.customBackgroundUrl) {
                        URL.revokeObjectURL(state.customBackgroundUrl);
                      }
                      setState(prev => ({
                        ...prev,
                        customBackgroundFile: null,
                        customBackgroundUrl: null,
                      }));
                    }}
                    onPlacementChange={(placement) => updateState('customBackgroundPlacement', placement)}
                  />
                )}
                {state.currentTab === 'subtitle' && (
                  <SubtitleTab
                    enabled={state.subtitlesEnabled}
                    onEnabledChange={(enabled: boolean) => updateState('subtitlesEnabled', enabled)}
                    templates={SUBTITLE_TEMPLATES}
                    selectedTemplate={state.selectedSubtitleTemplate}
                    onTemplateSelect={(id: string) => {
                      const template = SUBTITLE_TEMPLATES.find(t => t.id === id);
                      if (template) {
                        // Update template selection
                        updateState('selectedSubtitleTemplate', id);
                        // Initialize colors from template (user can customize after)
                        if (template.color !== 'gradient' && template.color !== 'split') {
                          updateState('subtitleColor', template.color);
                        }
                        updateState('strokeColor', template.strokeColor);
                        updateState('strokeSize', template.strokeWidth);
                        updateState('subtitleBgColor', template.bgColor);
                        updateState('subtitleFont', template.fontFamily);
                      }
                    }}
                    enableDrag={state.enableSubtitleDrag}
                    onDragChange={(enabled: boolean) => updateState('enableSubtitleDrag', enabled)}
                    position={state.subtitlePosition}
                    onPositionChange={(pos: SplitScreenState['subtitlePosition']) =>
                      updateState('subtitlePosition', pos)
                    }
                    customPosition={state.subtitleCustomPosition}
                    onCustomPositionChange={(pos: SplitScreenState['subtitleCustomPosition']) =>
                      updateState('subtitleCustomPosition', pos)
                    }
                    font={state.subtitleFont}
                    onFontChange={(font: string) => updateState('subtitleFont', font)}
                    color={state.subtitleColor}
                    onColorChange={(color: string) => updateState('subtitleColor', color)}
                    size={state.subtitleSize}
                    onSizeChange={(size: number) => updateState('subtitleSize', size)}
                    strokeSize={state.strokeSize}
                    onStrokeSizeChange={(size: number) => updateState('strokeSize', size)}
                    strokeColor={state.strokeColor}
                    onStrokeColorChange={(color: string) => updateState('strokeColor', color)}
                    bgColor={state.subtitleBgColor}
                    onBgColorChange={(color: string) => updateState('subtitleBgColor', color)}
                  />
                )}
              </div>
              <div 
                className="flex items-center justify-center gap-3 mt-6 sm:mt-8 pb-6 lg:pb-0"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
              >
                {!isFirstTab && (
                  <button
                    onClick={goToPrevTab}
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target touch-manipulation active:scale-95"
                    type="button"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                {isLastTab ? (
                  <button
                    onClick={handleGenerate}
                    className="px-6 sm:px-6 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg text-sm sm:text-base font-medium text-white flex items-center gap-2 transition-colors touch-target touch-manipulation active:scale-95"
                    type="button"
                  >
                    <Sparkles className="w-5 h-5 sm:w-4 sm:h-4" />
                    {t('splitscreen.generate')}
                  </button>
                ) : (
                  <button
                    onClick={goToNextTab}
                    className="px-6 sm:px-6 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg text-sm sm:text-base font-medium text-white flex items-center gap-2 transition-colors touch-target touch-manipulation active:scale-95"
                    type="button"
                  >
                    {t('splitscreen.next')}
                    <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="order-1 lg:order-2 flex justify-center lg:block">
              <VideoPreview
                mainVideoUrl={state.uploadedFileUrl || state.videoUrl || undefined}
                backgroundVideoSrc={getBackgroundVideoSrc()}
                backgroundPoster={getBackgroundPoster()}
                mainVideoPlacement={state.mainVideoPlacement}
                template={getSelectedTemplate()}
                subtitlesEnabled={state.subtitlesEnabled}
                subtitlePosition={state.subtitlePosition}
                subtitleCustomPosition={state.subtitleCustomPosition}
                subtitleSize={state.subtitleSize}
                enableSubtitleDrag={state.enableSubtitleDrag}
                isPlaying={state.isPlaying}
                isMuted={state.isMuted}
                currentTime={state.currentTime}
                duration={state.duration}
                mainVolume={state.mainVolume}
                backgroundVolume={state.backgroundVolume}
                splitRatio={state.splitRatio}
                splitVariant={state.splitVariant}
                subtitleText={state.generatedScript || undefined}
                onPlayingChange={(playing) => updateState('isPlaying', playing)}
                onMutedChange={(muted) => updateState('isMuted', muted)}
                onTimeUpdate={(time) => updateState('currentTime', time)}
                onDurationChange={(duration) => updateState('duration', duration)}
                onMainVolumeChange={(volume) => updateState('mainVolume', volume)}
                onBackgroundVolumeChange={(volume) => updateState('backgroundVolume', volume)}
                onSplitRatioChange={(ratio) => updateState('splitRatio', ratio)}
                onSubtitleCustomPositionChange={(pos) => updateState('subtitleCustomPosition', pos)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};