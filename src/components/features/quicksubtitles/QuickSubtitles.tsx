import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Upload, Play, Pause, Download, Volume2, VolumeX, ChevronDown, Check, ChevronRight, Sparkles, Languages, Eye, Captions } from 'lucide-react';
import { FileUploadZone } from '../../shared/FileUploadZone';
import { ProgressOverlay } from '../../shared/ProgressOverlay';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import type { QuickSubtitlesState } from './types';
import { LANGUAGES, INITIAL_STATE, GENERATION } from './constants';

interface QuickSubtitlesProps {
  onBack: () => void;
}

export const QuickSubtitles = ({ onBack }: QuickSubtitlesProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const [state, setState] = useState<QuickSubtitlesState>(INITIAL_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  const exportedUrl = useMemo(() => (state.exportedBlob ? URL.createObjectURL(state.exportedBlob) : null), [state.exportedBlob]);

  const updateState = useCallback(<K extends keyof QuickSubtitlesState>(
    key: K,
    value: QuickSubtitlesState[K]
  ) => {
    setState(prev => ({ ...prev, [key]: value }));
    setValidationError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (state.uploadedFileUrl) {
        URL.revokeObjectURL(state.uploadedFileUrl);
      }
      if (exportedUrl) {
        URL.revokeObjectURL(exportedUrl);
      }
    };
  }, [state.uploadedFileUrl, exportedUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (state.uploadedFileUrl) {
      URL.revokeObjectURL(state.uploadedFileUrl);
    }
    const url = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      uploadedFile: file,
      uploadedFileUrl: url,
      isGenerated: false,
      exportedBlob: null,
      subtitles: [],
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
      isGenerated: false,
      exportedBlob: null,
      subtitles: [],
    }));
    setValidationError(null);
  }, [state.uploadedFileUrl]);

  const handleVideoUrlChange = useCallback((url: string) => {
    setState(prev => ({
      ...prev,
      videoUrl: url,
      uploadedFile: null,
      uploadedFileUrl: null,
      isGenerated: false,
      exportedBlob: null,
      subtitles: [],
    }));
    setValidationError(null);
  }, []);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      updateState('duration', videoRef.current.duration);
    }
  }, [updateState]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      updateState('currentTime', videoRef.current.currentTime);
    }
  }, [updateState]);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    updateState('isPlaying', !state.isPlaying);
  }, [state.isPlaying, updateState]);

  const handleToggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !state.isMuted;
      updateState('isMuted', !state.isMuted);
    }
  }, [state.isMuted, updateState]);

  const handleGenerate = useCallback(async () => {
    if (!state.uploadedFile && !state.videoUrl) {
      setValidationError(t('quicksubtitles.uploadRequired'));
      return;
    }
    if (!requireSubscription('Quick Subtitles')) return;
    updateState('isGenerating', true);
    updateState('generationProgress', 0);

    progressIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newProgress = prev.generationProgress + GENERATION.PROGRESS_STEP;
        if (newProgress >= GENERATION.MAX_PROGRESS) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return { ...prev, generationProgress: GENERATION.MAX_PROGRESS };
        }
        return { ...prev, generationProgress: newProgress };
      });
    }, GENERATION.INTERVAL_MS);

    setTimeout(() => {
      setValidationError(t('quicksubtitles.serviceNotConfigured'));
      updateState('subtitles', []);
      updateState('exportedBlob', null);
      updateState('isGenerated', false);
      updateState('isGenerating', false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, 2000);
  }, [state.uploadedFile, state.videoUrl, updateState, t]);

  const handleDownload = useCallback(() => {
    if (!exportedUrl) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    a.download = 'quick-subtitles-video.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [exportedUrl]);

  const handleCreateNew = useCallback(() => {
    setState(INITIAL_STATE);
    setValidationError(null);
  }, []);

  const selectedLanguage = LANGUAGES.find(lang => lang.id === state.selectedLanguage) || LANGUAGES[0];
  const hasVideo = state.uploadedFile || state.videoUrl;
  const currentSubtitle = state.subtitles.find(
    sub => state.currentTime >= sub.startTime && state.currentTime <= sub.endTime
  );

  return (
    <div className="min-h-dvh min-h-screen bg-background text-white">
      {state.isGenerating && (
        <ProgressOverlay
          title={t('quicksubtitles.generating')}
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
              className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95 shrink-0"
              type="button"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Captions className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold truncate">{t('home.quickSubtitles')}</h1>
            </div>
          </div>
          <button
            className="hidden sm:flex px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-white items-center gap-2 transition-colors touch-target"
            type="button"
          >
            {t('quicksubtitles.viewRecent')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        {state.isGenerated && state.exportedBlob ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{t('quicksubtitles.videoGenerated')}</h2>
                  <p className="text-sm text-zinc-400">{t('quicksubtitles.videoReady')}</p>
                </div>
              </div>
              <div className="aspect-video max-w-3xl mx-auto bg-black rounded-xl overflow-hidden">
                <video
                  src={exportedUrl ?? undefined}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div
              className="flex items-center justify-center gap-3"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
            >
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors touch-target touch-manipulation active:scale-95"
                type="button"
              >
                <Download className="w-5 h-5" />
                {t('quicksubtitles.downloadVideo')}
              </button>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white rounded-xl font-medium transition-colors touch-target touch-manipulation active:scale-95"
                type="button"
              >
                {t('quicksubtitles.createNew')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="flex-1 order-2 lg:order-1">
              <div className="max-w-4xl space-y-6">
                {validationError && (
                  <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                    {validationError}
                  </div>
                )}

                <div className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Upload className="w-4 h-4 text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold">{t('quicksubtitles.uploadVideo')}</h2>
                  </div>
                  <FileUploadZone
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    uploadedFile={state.uploadedFile}
                    acceptedType="video"
                    showUrlInput={true}
                    videoUrl={state.videoUrl}
                    onVideoUrlChange={handleVideoUrlChange}
                  />
                </div>

                {hasVideo && (
                  <div className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-4 sm:p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Languages className="w-4 h-4 text-amber-400" />
                      </div>
                      <h2 className="text-lg font-semibold">{t('quicksubtitles.selectLanguage')}</h2>
                    </div>

                    <div ref={languageDropdownRef} className="relative">
                      <button
                        onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                        className="w-full bg-zinc-800/80 border border-white/[0.08] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between transition-all touch-manipulation"
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{selectedLanguage.flag}</span>
                          <span className="font-medium">{selectedLanguage.name}</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isLanguageOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isLanguageOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-zinc-800 border border-white/[0.08] rounded-xl shadow-2xl max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                          {LANGUAGES.map(language => (
                            <button
                              key={language.id}
                              onClick={() => {
                                updateState('selectedLanguage', language.id);
                                setIsLanguageOpen(false);
                              }}
                              className="w-full px-4 py-3 hover:bg-white/[0.06] active:bg-white/[0.08] flex items-center justify-between transition-colors first:rounded-t-xl last:rounded-b-xl touch-manipulation"
                              type="button"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{language.flag}</span>
                                <span className="font-medium">{language.name}</span>
                              </div>
                              {state.selectedLanguage === language.id && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="flex items-center justify-center gap-3 mt-6 sm:mt-8 pb-6 lg:pb-0"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
              >
                <button
                  onClick={handleGenerate}
                  disabled={!hasVideo || state.isGenerating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm sm:text-base font-medium text-white flex items-center gap-2 transition-colors touch-target touch-manipulation active:scale-95"
                  type="button"
                >
                  <Sparkles className="w-5 h-5 sm:w-4 sm:h-4" />
                  {state.isGenerating ? t('quicksubtitles.generating') : t('quicksubtitles.generate')}
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2 flex justify-center lg:block">
              <div className="w-full max-w-2xl lg:w-96">
                <div className="bg-zinc-900/50 border border-white/[0.06] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4 text-zinc-400" />
                    <h2 className="text-sm font-medium text-zinc-400">{t('quicksubtitles.preview')}</h2>
                  </div>

                  {hasVideo ? (
                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                      <video
                        ref={videoRef}
                        src={state.uploadedFileUrl || state.videoUrl}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        className="w-full h-full object-contain"
                      />
                      <canvas ref={canvasRef} className="hidden" />

                      {currentSubtitle && (
                        <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4">
                          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg max-w-[90%]">
                            <p className="text-white text-base sm:text-lg font-bold text-center leading-tight">{currentSubtitle.text}</p>
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4">
                        <button
                          onClick={handlePlayPause}
                          className="w-12 h-12 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors touch-manipulation active:scale-95"
                          type="button"
                        >
                          {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <button
                          onClick={handleToggleMute}
                          className="w-10 h-10 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors touch-manipulation active:scale-95"
                          type="button"
                        >
                          {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-zinc-800/50 rounded-xl flex items-center justify-center border-2 border-dashed border-zinc-700/50">
                      <div className="text-center text-zinc-500 p-4">
                        <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">{t('quicksubtitles.uploadToPreview')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
