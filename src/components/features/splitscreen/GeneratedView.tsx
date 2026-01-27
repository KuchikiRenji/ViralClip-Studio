import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Check, Download, Play, Pause, Volume2, VolumeX, Maximize2, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { SubtitleDisplay } from './SubtitlePreview';
import type { SplitVariant, SubtitleCustomPosition, SubtitleTemplate, SubtitlePosition } from './types';
import { useTranslation } from '../../../hooks/useTranslation';
import { downloadBlob } from '../../../utils/videoExport';
interface GeneratedViewProps {
  subtitlesEnabled: boolean;
  mainVideoUrl: string | null;
  backgroundVideoSrc: string | undefined;
  backgroundPoster?: string;
  template: SubtitleTemplate;
  subtitlePosition: SubtitlePosition;
  subtitleCustomPosition: SubtitleCustomPosition;
  subtitleSize: number;
  splitRatio: number;
  splitVariant: SplitVariant;
  scriptText: string;
  mainVolume: number;
  backgroundVolume: number;
  onCreateNew: () => void;
}
export const GeneratedView = ({
  subtitlesEnabled,
  mainVideoUrl,
  backgroundVideoSrc,
  backgroundPoster,
  template,
  subtitlePosition,
  subtitleCustomPosition,
  subtitleSize,
  splitRatio,
  splitVariant,
  scriptText,
  mainVolume,
  backgroundVolume,
  onCreateNew,
}: GeneratedViewProps) => {
  const { t } = useTranslation();
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'recording' | 'encoding'>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const exportPercent = useMemo(() => {
    return Math.max(0, Math.min(100, Math.round(exportProgress)));
  }, [exportProgress]);
  useEffect(() => {
    const mainVideo = mainVideoRef.current;
    const bgVideo = bgVideoRef.current;
    if (isPlaying) {
      mainVideo?.play();
      bgVideo?.play();
    } else {
      mainVideo?.pause();
      bgVideo?.pause();
    }
  }, [isPlaying]);
  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.muted = isMuted;
      mainVideoRef.current.volume = mainVolume;
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.muted = isMuted;
      bgVideoRef.current.volume = backgroundVolume;
    }
  }, [isMuted, mainVolume, backgroundVolume]);
  const handleTimeUpdate = useCallback(() => {
    if (mainVideoRef.current) {
      const time = mainVideoRef.current.currentTime;
      setCurrentTime(time);
      if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - time) > 0.5) {
        bgVideoRef.current.currentTime = time;
      }
    }
  }, []);
  const handleLoadedMetadata = useCallback(() => {
    if (mainVideoRef.current) {
      setDuration(mainVideoRef.current.duration);
    }
  }, []);
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mainVideoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      mainVideoRef.current.currentTime = newTime;
      if (bgVideoRef.current) {
        bgVideoRef.current.currentTime = newTime;
      }
      setCurrentTime(newTime);
    }
  }, [duration]);
  const handleDownload = async () => {
    setIsDownloading(true);
    console.log('🔍 Download button clicked');
    console.log('generatedVideoUrl:', generatedVideoUrl);
    console.log('mainVideoUrl:', mainVideoUrl);

    const link = document.createElement('a');
    link.href = generatedVideoUrl || mainVideoUrl || '';
    link.download = 'split-screen-video.mp4';
    console.log('Downloading from:', link.href);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  const handleExport = useCallback(async () => {
    if (exportStatus !== 'idle') return;
    if (!mainVideoUrl || !backgroundVideoSrc) {
      setExportError(t('splitscreen.exportMissingMedia'));
      return;
    }

    setExportError(null);
    setExportProgress(0);
    setExportStatus('encoding');

    const durationSeconds = Math.max(1, duration || 15);
    const fps = 30;
    const ratio = Math.max(0.1, Math.min(0.9, splitRatio));

    try {
      console.log('🎬 Using server-side FFmpeg for split-screen export');

      const mainVideoBlob = await fetch(mainVideoUrl).then(r => r.blob());
      const bgVideoBlob = await fetch(backgroundVideoSrc).then(r => r.blob());

      const formData = new FormData();
      formData.append('mainVideo', mainVideoBlob, 'main.mp4');
      formData.append('backgroundVideo', bgVideoBlob, 'background.mp4');

      const exportConfigData = {
        splitVariant,
        splitRatio: ratio,
        subtitles: subtitlesEnabled && template.id !== 'none' ? {
          enabled: true,
          scriptText,
          template: {
            fontFamily: template.fontFamily,
            color: template.color,
            strokeColor: template.strokeColor,
            strokeWidth: template.strokeWidth,
            bgColor: template.bgColor,
            style: template.style,
            weight: template.weight,
            transform: template.transform,
          },
          position: subtitlePosition,
          customPosition: subtitlePosition === 'custom' ? subtitleCustomPosition : undefined,
          size: subtitleSize,
        } : undefined,
        mainVolume: isMuted ? 0 : mainVolume,
        backgroundVolume: isMuted ? 0 : backgroundVolume,
        durationSeconds,
        fps,
      };

      formData.append('config', JSON.stringify(exportConfigData));

      console.log('📤 Uploading videos to server for processing...');
      console.log('📋 Export config being sent:', JSON.stringify(exportConfigData, null, 2));

      const response = await fetch('/api/export-split-screen-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const result = await response.json();

      console.log('📥 Downloading processed video...');
      console.log('Result from server:', result);

      const videoResponse = await fetch(result.url);
      const exportedBlob = await videoResponse.blob();

      console.log('📦 Creating blob URL for generated video...');
      const blobUrl = URL.createObjectURL(exportedBlob);
      console.log('🎥 Generated video blob URL:', blobUrl);

      setGeneratedVideoUrl(blobUrl);
      console.log('✅ setGeneratedVideoUrl called with:', blobUrl);

      downloadBlob(exportedBlob, `split-screen_${Date.now()}.mp4`);

      setExportStatus('idle');
      setExportProgress(100);

      console.log('✅ Split-screen export completed successfully');
    } catch (e) {
      console.error('❌ Split-screen export error:', e);
      setExportStatus('idle');
      setExportProgress(0);
      setExportError(e instanceof Error ? e.message : t('splitscreen.exportFailed'));
    }
  }, [
    backgroundVideoSrc,
    duration,
    exportStatus,
    isMuted,
    mainVideoUrl,
    mainVolume,
    scriptText,
    splitRatio,
    splitVariant,
    subtitleCustomPosition.x,
    subtitleCustomPosition.y,
    subtitlePosition,
    subtitleSize,
    subtitlesEnabled,
    t,
    template,
    backgroundVolume,
  ]);
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isVertical = splitVariant === 'vertical';
  const splitPercent = Math.max(20, Math.min(80, splitRatio * 100));
  
  // Calculate subtitle snippet based on current time (same logic as preview)
  const subtitleSnippet = useMemo(() => {
    if (!scriptText || !subtitlesEnabled || template.id === 'none') return undefined;

    const content = scriptText.trim();
    if (!content) return undefined;

    const words = content.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length === 0) return undefined;

    // Match preview behaviour: ~1.5 words/sec, max 6 words visible
    const TARGET_WORDS_PER_SECOND = 1.5;
    const rawIndex = Math.floor(currentTime * TARGET_WORDS_PER_SECOND);
    const index = Math.min(rawIndex, Math.max(0, words.length - 1));
    const start = Math.max(0, index);
    const end = Math.min(words.length, start + 6);

    return words.slice(start, end).join(' ');
  }, [scriptText, currentTime, subtitlesEnabled, template.id]);
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8 sm:py-12 px-4">
      <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 sm:mb-6">
        <Check className="w-8 sm:w-10 h-8 sm:h-10 text-emerald-400" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('splitscreen.videoGenerated')}</h2>
      <p className="text-zinc-400 mb-6 sm:mb-8 text-sm sm:text-base">{t('splitscreen.videoReady')}</p>
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start w-full max-w-xl sm:max-w-none justify-center">
        <div className="w-full max-w-[280px] aspect-[9/16] bg-black rounded-xl overflow-hidden relative shadow-2xl border border-zinc-800">
          {generatedVideoUrl ? (
            <video
              ref={mainVideoRef}
              src={generatedVideoUrl}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              autoPlay
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
          ) : (
            <div className={`absolute inset-0 ${isVertical ? 'flex flex-row' : 'flex flex-col'}`}>
              <div
                className="overflow-hidden bg-zinc-900"
                style={isVertical ? { width: `${splitPercent}%` } : { height: `${splitPercent}%` }}
              >
                {mainVideoUrl ? (
                  <video
                    ref={mainVideoRef}
                    src={mainVideoUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    autoPlay
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                    {t('splitscreen.noVideo')}
                  </div>
                )}
              </div>
              <div
                className="overflow-hidden bg-zinc-950"
                style={isVertical ? { width: `${100 - splitPercent}%` } : { height: `${100 - splitPercent}%` }}
              >
                {backgroundVideoSrc ? (
                  <video
                    ref={bgVideoRef}
                    src={backgroundVideoSrc}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    autoPlay
                    playsInline
                    poster={backgroundPoster || undefined}
                    crossOrigin={(backgroundVideoSrc.startsWith('http://') || backgroundVideoSrc.startsWith('https://')) ? "anonymous" : undefined}
                    preload="none"
                    onError={(e) => {
                      // Only log error if video was actually trying to load
                      if (e.currentTarget.readyState > 0) {
                        console.warn('Background video failed to load:', backgroundVideoSrc);
                      }
                      if (bgVideoRef.current) {
                        bgVideoRef.current.style.display = 'none';
                      }
                    }}
                  />
                ) : backgroundPoster ? (
                  <img
                    src={backgroundPoster}
                    alt="Background"
                    className="w-full h-full object-cover opacity-90"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800" />
                )}
              </div>
            </div>
          )}
          {!generatedVideoUrl && (
            <div
              className={`absolute z-20 ${isVertical ? 'inset-y-0 w-0.5' : 'inset-x-0 h-0.5'} bg-white/20`}
              style={isVertical ? { left: `${splitPercent}%` } : { top: `${splitPercent}%` }}
            />
          )}
          {!generatedVideoUrl && subtitlesEnabled && template.id !== 'none' && subtitleSnippet && (
            <SubtitleDisplay
              template={template}
              position={subtitlePosition}
              fontSize={subtitleSize}
              text={subtitleSnippet}
              customPosition={subtitlePosition === 'custom' ? subtitleCustomPosition : undefined}
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                type="button"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                type="button"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-white text-xs ml-auto">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
            <div
              className="mt-2 h-1 bg-zinc-700 rounded-full cursor-pointer"
              onClick={handleSeek}
              role="slider"
              aria-valuenow={currentTime}
              aria-valuemin={0}
              aria-valuemax={duration}
              tabIndex={0}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full sm:w-auto">
          {exportStatus !== 'idle' && (
            <div className="p-3 rounded-xl bg-zinc-800/60 border border-white/10">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{exportStatus === 'recording' ? t('splitscreen.exportRecording') : t('splitscreen.exportEncoding')}</span>
                <span className="font-mono text-zinc-200">{exportPercent}%</span>
              </div>
              <div className="mt-2 h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${exportPercent}%` }} />
              </div>
            </div>
          )}
          {exportError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="min-w-0">{exportError}</span>
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={exportStatus !== 'idle'}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-colors"
            type="button"
          >
            {exportStatus === 'idle' ? (
              <Download className="w-5 h-5" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            {t('splitscreen.exportMp4')}
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-colors"
            type="button"
          >
            {isDownloading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isDownloading ? t('splitscreen.processing') : t('splitscreen.downloadVideo')}
          </button>
          <button
            onClick={onCreateNew}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium text-white transition-colors"
            type="button"
          >
            {t('splitscreen.createNewVideo')}
          </button>
        </div>
      </div>
    </div>
  );
};