import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { VideoControls } from '../../shared/VideoControls';
import { SubtitleDisplay } from './SubtitlePreview';
import type { SplitVariant, SubtitleTemplate, SubtitlePosition, VideoPlacement, SubtitleCustomPosition } from './types';
import { Volume2, GripHorizontal } from 'lucide-react';

interface VideoPreviewProps {
  mainVideoUrl: string | undefined;
  backgroundVideoSrc: string | undefined;
  backgroundPoster?: string;
  mainVideoPlacement: VideoPlacement;
  template: SubtitleTemplate;
  subtitlesEnabled: boolean;
  subtitlePosition: SubtitlePosition;
  subtitleCustomPosition: SubtitleCustomPosition;
  subtitleSize: number;
  enableSubtitleDrag: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  mainVolume: number;
  backgroundVolume: number;
  splitRatio: number;
  splitVariant: SplitVariant;
  subtitleText?: string;
  onPlayingChange: (playing: boolean) => void;
  onMutedChange: (muted: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onMainVolumeChange: (volume: number) => void;
  onBackgroundVolumeChange: (volume: number) => void;
  onSplitRatioChange: (ratio: number) => void;
  onSubtitleCustomPositionChange: (position: SubtitleCustomPosition) => void;
}
export const VideoPreview = ({
  mainVideoUrl,
  backgroundVideoSrc,
  backgroundPoster,
  mainVideoPlacement,
  template,
  subtitlesEnabled,
  subtitlePosition,
  subtitleCustomPosition,
  subtitleSize,
  enableSubtitleDrag,
  isPlaying,
  isMuted,
  currentTime,
  duration,
  mainVolume,
  backgroundVolume,
  splitRatio,
  splitVariant,
  subtitleText,
  onPlayingChange,
  onMutedChange,
  onTimeUpdate,
  onDurationChange,
  onMainVolumeChange,
  onBackgroundVolumeChange,
  onSplitRatioChange,
  onSubtitleCustomPositionChange,
}: VideoPreviewProps) => {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef2 = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isDraggingSubtitle, setIsDraggingSubtitle] = useState(false);
  const [bgVideoError, setBgVideoError] = useState(false);
  const [bgVideoLoading, setBgVideoLoading] = useState(false);
  const [previousPoster, setPreviousPoster] = useState<string | undefined>(backgroundPoster);
  useEffect(() => {
    const mainVideo = mainVideoRef.current;
    const bgVideo = bgVideoRef.current;
    const bgVideo2 = bgVideoRef2.current;
    if (isPlaying) {
      mainVideo?.play().catch(() => onPlayingChange(false));
      bgVideo?.play().catch(() => {});
      bgVideo2?.play().catch(() => {});
    } else {
      mainVideo?.pause();
      bgVideo?.pause();
      bgVideo2?.pause();
    }
  }, [isPlaying, onPlayingChange]);
  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.muted = isMuted;
      mainVideoRef.current.volume = mainVolume;
    }
    if (bgVideoRef.current) {
      bgVideoRef.current.muted = isMuted;
      bgVideoRef.current.volume = backgroundVolume;
    }
    if (bgVideoRef2.current) {
      bgVideoRef2.current.muted = isMuted;
      bgVideoRef2.current.volume = backgroundVolume;
    }
  }, [isMuted, mainVolume, backgroundVolume]);
  const handleTimeUpdate = useCallback(() => {
    if (mainVideoRef.current) {
      const time = mainVideoRef.current.currentTime;
      onTimeUpdate(time);
      if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - time) > 0.5) {
        bgVideoRef.current.currentTime = time;
      }
      if (bgVideoRef2.current && Math.abs(bgVideoRef2.current.currentTime - time) > 0.5) {
        bgVideoRef2.current.currentTime = time;
      }
    }
  }, [onTimeUpdate]);
  const handleLoadedMetadata = useCallback(() => {
    if (mainVideoRef.current) {
      onDurationChange(mainVideoRef.current.duration);
    }
  }, [onDurationChange]);
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
      if (bgVideoRef2.current) {
        bgVideoRef2.current.currentTime = newTime;
      }
      onTimeUpdate(newTime);
    }
  }, [duration, onTimeUpdate]);
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingSplit(true);
    e.preventDefault();
  }, []);
  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeY = clientY - rect.top;
    const newRatio = Math.max(0.2, Math.min(0.8, relativeY / rect.height));
    onSplitRatioChange(newRatio);
  }, [isDraggingSplit, onSplitRatioChange]);
  const handleDragEnd = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);
  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDraggingSplit, handleDragMove, handleDragEnd]);

  const handleSubtitleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!enableSubtitleDrag) return;
    setIsDraggingSubtitle(true);
    e.preventDefault();
    e.stopPropagation();
  }, [enableSubtitleDrag]);

  const handleSubtitleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingSubtitle || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    const newX = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
    onSubtitleCustomPositionChange({ x: Math.round(newX), y: Math.round(newY) });
  }, [isDraggingSubtitle, onSubtitleCustomPositionChange]);

  const handleSubtitleDragEnd = useCallback(() => {
    setIsDraggingSubtitle(false);
  }, []);

  useEffect(() => {
    if (isDraggingSubtitle) {
      window.addEventListener('mousemove', handleSubtitleDragMove);
      window.addEventListener('mouseup', handleSubtitleDragEnd);
      window.addEventListener('touchmove', handleSubtitleDragMove);
      window.addEventListener('touchend', handleSubtitleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleSubtitleDragMove);
      window.removeEventListener('mouseup', handleSubtitleDragEnd);
      window.removeEventListener('touchmove', handleSubtitleDragMove);
      window.removeEventListener('touchend', handleSubtitleDragEnd);
    };
  }, [isDraggingSubtitle, handleSubtitleDragMove, handleSubtitleDragEnd]);

  const getSubtitleStyle = useCallback((): React.CSSProperties => {
    if (subtitlePosition === 'custom') {
      return {
        position: 'absolute',
        left: `${subtitleCustomPosition.x}%`,
        top: `${subtitleCustomPosition.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: enableSubtitleDrag ? 'grab' : 'default',
      };
    }
    const positionStyles: Record<string, React.CSSProperties> = {
      top: { position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' },
      center: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
      bottom: { position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)' },
    };
    return positionStyles[subtitlePosition] || positionStyles.bottom;
  }, [subtitlePosition, subtitleCustomPosition, enableSubtitleDrag]);

  // Handle smooth video transitions when background changes
  useEffect(() => {
    // Keep previous poster visible during transition
    if (backgroundPoster) {
      setPreviousPoster(backgroundPoster);
    }
    
    // Reset error state
    setBgVideoError(false);
    setBgVideoLoading(true);
    
    // Preload new video before switching
    const preloadVideo = (videoElement: HTMLVideoElement | null) => {
      if (!videoElement || !backgroundVideoSrc) return;
      
      // Set source and preload
      videoElement.src = backgroundVideoSrc;
      videoElement.load();
      
      // Wait for video to be ready before showing
      const handleCanPlay = () => {
        setBgVideoLoading(false);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
      };
      
      const handleError = () => {
        setBgVideoLoading(false);
        setBgVideoError(true);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
      };
      
      videoElement.addEventListener('canplay', handleCanPlay, { once: true });
      videoElement.addEventListener('error', handleError, { once: true });
      
      // If video is already loaded, show immediately
      if (videoElement.readyState >= 3) {
        setBgVideoLoading(false);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
      }
    };
    
    preloadVideo(bgVideoRef.current);
    preloadVideo(bgVideoRef2.current);
    
    // Fallback: if loading takes too long, show anyway
    const timeout = setTimeout(() => {
      setBgVideoLoading(false);
    }, 2000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [backgroundVideoSrc, backgroundPoster]);

  // Helper to check if URL is external (not a blob URL)
  const isExternalUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const isVertical = splitVariant === 'vertical';
  const isMainOnFirst = isVertical ? mainVideoPlacement === 'left' : mainVideoPlacement === 'top';
  const splitStartPercent = Math.max(20, Math.min(80, splitRatio * 100));
  const firstStyle = isVertical ? { width: `${splitStartPercent}%` } : { height: `${splitStartPercent}%` };
  const secondStyle = isVertical ? { width: `${100 - splitStartPercent}%` } : { height: `${100 - splitStartPercent}%` };

  // Derive a short subtitle snippet (up to 6 words) based on current playback time
  const subtitleSnippet = useMemo(() => {
    if (!subtitleText) return undefined;

    const content = subtitleText.replace(/\s+/g, ' ').trim();
    if (!content) return undefined;

    const words = content.split(' ').filter(Boolean);
    if (words.length === 0) return undefined;

    // Use a natural reading pace independent of script length
    const TARGET_WORDS_PER_SECOND = 1.5; // ~1.5 words/sec for comfortable reading
    const rawIndex = Math.floor(currentTime * TARGET_WORDS_PER_SECOND);
    const index = Math.min(rawIndex, Math.max(0, words.length - 1));

    // Take a window of up to 6 words starting at the computed index
    const start = Math.max(0, index);
    const end = Math.min(words.length, start + 6);

    return words.slice(start, end).join(' ');
  }, [subtitleText, currentTime]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[280px] lg:w-[280px] flex-shrink-0">
      <div 
        ref={containerRef}
        className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800"
      >
        <div className={`absolute inset-0 ${isVertical ? 'flex flex-row' : 'flex flex-col'}`}>
          <div className="overflow-hidden bg-zinc-900" style={firstStyle}>
            {isMainOnFirst ? (
              mainVideoUrl ? (
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
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                  Upload a video
                </div>
              )
            ) : (
              <>
                {/* Show poster image during loading or as fallback */}
                {(bgVideoLoading || bgVideoError || !backgroundVideoSrc) && (previousPoster || backgroundPoster) && (
                  <img
                    src={backgroundPoster || previousPoster}
                    alt="Background"
                    className={`w-full h-full object-cover opacity-90 transition-opacity duration-300 ${
                      bgVideoLoading ? 'opacity-100' : 'opacity-90'
                    }`}
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {/* Video element - hidden during loading to prevent flicker */}
                {backgroundVideoSrc && !bgVideoError && (
                <video
                  ref={bgVideoRef}
                  src={backgroundVideoSrc}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      bgVideoLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                  loop
                  muted
                  autoPlay
                  playsInline
                    preload="metadata"
                    poster={backgroundPoster || previousPoster || undefined}
                    crossOrigin={isExternalUrl(backgroundVideoSrc) ? "anonymous" : undefined}
                  onError={(e) => {
                      if (e.currentTarget.readyState > 0) {
                        console.warn('Background video failed to load:', backgroundVideoSrc);
                      }
                      setBgVideoError(true);
                      setBgVideoLoading(false);
                    e.currentTarget.style.display = 'none';
                    }}
                    onCanPlay={() => {
                      setBgVideoLoading(false);
                    }}
                    onLoadStart={() => {
                      setBgVideoError(false);
                  }}
                />
                )}
                {/* Fallback when no video or poster */}
                {!backgroundVideoSrc && !backgroundPoster && !previousPoster && (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
                  Select background
                </div>
                )}
              </>
            )}
          </div>

          <div className="overflow-hidden bg-zinc-950" style={secondStyle}>
            {!isMainOnFirst ? (
              mainVideoUrl ? (
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
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                  Upload a video
                </div>
              )
            ) : (
              <>
                {/* Show poster image during loading or as fallback */}
                {(bgVideoLoading || bgVideoError || !backgroundVideoSrc) && (previousPoster || backgroundPoster) && (
                  <img
                    src={backgroundPoster || previousPoster}
                    alt="Background"
                    className={`w-full h-full object-cover opacity-90 transition-opacity duration-300 ${
                      bgVideoLoading ? 'opacity-100' : 'opacity-90'
                    }`}
                    loading="eager"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                {/* Video element - hidden during loading to prevent flicker */}
                {backgroundVideoSrc && !bgVideoError && (
                <video
                    ref={bgVideoRef2}
                  src={backgroundVideoSrc}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      bgVideoLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                  loop
                  muted
                  autoPlay
                  playsInline
                    preload="metadata"
                    poster={backgroundPoster || previousPoster || undefined}
                    crossOrigin={isExternalUrl(backgroundVideoSrc) ? "anonymous" : undefined}
                  onError={(e) => {
                      if (e.currentTarget.readyState > 0) {
                        console.warn('Background video failed to load:', backgroundVideoSrc);
                      }
                      setBgVideoError(true);
                      setBgVideoLoading(false);
                    e.currentTarget.style.display = 'none';
                    }}
                    onCanPlay={() => {
                      setBgVideoLoading(false);
                    }}
                    onLoadStart={() => {
                      setBgVideoError(false);
                  }}
                />
                )}
                {/* Fallback when no video or poster */}
                {!backgroundVideoSrc && !backgroundPoster && !previousPoster && (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
                  Select background
                </div>
                )}
              </>
            )}
          </div>
        </div>

        <div
          className={`absolute z-20 flex items-center justify-center group ${isVertical ? 'inset-y-0 w-6 -ml-3 cursor-col-resize' : 'inset-x-0 h-6 -mt-3 cursor-row-resize'}`}
          style={isVertical ? { left: `${splitStartPercent}%` } : { top: `${splitStartPercent}%` }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className={`${isVertical ? 'h-full w-0.5' : 'w-full h-0.5'} bg-white/20 group-hover:bg-blue-500/50 transition-colors absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80 shadow-sm group-hover:scale-110 transition-transform">
            <GripHorizontal className="w-4 h-4" />
          </div>
        </div>

        {subtitlesEnabled && template.id !== 'none' && (
          <div
            ref={subtitleRef}
            className={`z-25 select-none ${enableSubtitleDrag && subtitlePosition === 'custom' ? 'cursor-grab active:cursor-grabbing' : ''} ${isDraggingSubtitle ? 'cursor-grabbing' : ''}`}
            style={getSubtitleStyle()}
            onMouseDown={subtitlePosition === 'custom' ? handleSubtitleDragStart : undefined}
            onTouchStart={subtitlePosition === 'custom' ? handleSubtitleDragStart : undefined}
          >
            <SubtitleDisplay
              template={template}
              position={subtitlePosition === 'custom' ? 'center' : subtitlePosition}
              fontSize={subtitleSize}
              text={subtitleSnippet}
            />
            {enableSubtitleDrag && subtitlePosition === 'custom' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-50" />
            )}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <VideoControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={() => onPlayingChange(!isPlaying)}
            onMuteToggle={() => onMutedChange(!isMuted)}
            onSeek={handleSeek}
          />
        </div>
      </div>
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 space-y-3">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Audio Mix</h3>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white">Main Video</span>
            <span className="text-zinc-500">{Math.round(mainVolume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={mainVolume}
              onChange={(e) => onMainVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white">Background</span>
            <span className="text-zinc-500">{Math.round(backgroundVolume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={backgroundVolume}
              onChange={(e) => onBackgroundVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};