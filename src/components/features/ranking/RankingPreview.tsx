import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Move, Hash, Award, Star, Trophy, Crown } from 'lucide-react';
import { RankingConfig, RichTextFormat, VideoSource } from './types';
import {
  applyEasing,
  getTransitionProgress,
  isInTransition,
  getFadeOpacity,
  getSlideTransform,
  getWipeClipPath,
  getZoomScale,
  getBlurAmount,
} from './transitionUtils';

/**
 * Convert our timing function to CSS-compatible timing function
 * CSS doesn't support 'bounce' directly, so we use a cubic-bezier approximation
 */
function getCSSTimingFunction(timingFunction: string): string {
  switch (timingFunction) {
    case 'linear':
      return 'linear';
    case 'ease-in':
      return 'ease-in';
    case 'ease-out':
      return 'ease-out';
    case 'ease-in-out':
      return 'ease-in-out';
    case 'bounce':
      // Bounce effect approximated with cubic-bezier
      // This is a rough approximation - the actual bounce is handled by JS calculations
      return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    default:
      return 'ease-in-out';
  }
}
interface RankingPreviewProps {
  config: RankingConfig;
  textFormat: RichTextFormat;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onTitlePositionChange?: (x: number, y: number) => void;
  titlePosition?: { x: number; y: number };
}
// Ranking Graphic Display Component for Preview
function RankingGraphicDisplay({ rank, graphic }: { rank: number; graphic: RankingConfig['rankingGraphic'] }) {
  if (!graphic) return null;

  const RANKING_STYLE_COLORS: Record<string, string> = {
    number: '#3b82f6',
    badge: '#8b5cf6',
    medal: '#f59e0b',
    trophy: '#10b981',
    custom: '#ec4899',
  };

  const RANKING_ICONS: Record<string, typeof Hash> = {
    number: Hash,
    badge: Award,
    medal: Star,
    trophy: Trophy,
    custom: Crown,
  };

  const color = RANKING_STYLE_COLORS[graphic.style] || '#3b82f6';
  const Icon = RANKING_ICONS[graphic.style] || Hash;
  
  // Calculate position (using percentage-based positioning)
  // Constrain to top area to avoid overlapping with video
  const getPositionStyle = () => {
    const sizePercent = (graphic.size / 1080) * 100; // Assuming base width of 1080px
    const padding = sizePercent * 0.2;
    // Constrain to top 30% of container to avoid video area overlap
    const maxTopPercent = 30;
    
    switch (graphic.position) {
      case 'top-left':
        return { top: `${Math.min(padding, maxTopPercent)}%`, left: `${padding}%` };
      case 'top-right':
        return { top: `${Math.min(padding, maxTopPercent)}%`, right: `${padding}%` };
      case 'bottom-left':
        // For bottom positions, place in top area instead to avoid video overlap
        return { top: `${Math.min(padding + 5, maxTopPercent)}%`, left: `${padding}%` };
      case 'bottom-right':
        // For bottom positions, place in top area instead to avoid video overlap
        return { top: `${Math.min(padding + 5, maxTopPercent)}%`, right: `${padding}%` };
      case 'center':
        // Center in top area, not full container
        return { top: `${maxTopPercent / 2}%`, left: '50%', transform: 'translate(-50%, -50%)' };
      default:
        return { top: `${Math.min(padding, maxTopPercent)}%`, left: `${padding}%` };
    }
  };

  const sizePx = graphic.size * (window.innerWidth / 1080); // Scale based on viewport
  const isAnimated = graphic.animation;

  return (
    <div
      className="absolute z-30 flex items-center justify-center pointer-events-none"
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        ...getPositionStyle(),
        animation: isAnimated ? 'pulse 2s ease-in-out infinite' : undefined,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center text-white font-bold shadow-lg"
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${color} 0%, ${adjustColorBrightness(color, -20)} 100%)`,
          boxShadow: `0 4px 16px ${color}80`,
        }}
      >
        {graphic.style === 'number' ? (
          <span style={{ fontSize: `${sizePx * 0.6}px` }}>{rank}</span>
        ) : (
          <Icon size={sizePx * 0.5} style={{ marginRight: graphic.style === 'badge' ? '0' : '0' }} />
        )}
      </div>
      {graphic.style !== 'number' && (
        <span
          className="absolute text-white font-bold"
          style={{
            fontSize: `${sizePx * 0.4}px`,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {rank}
        </span>
      )}
    </div>
  );
}

function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export const RankingPreview = ({
  config,
  textFormat,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onTitlePositionChange,
  titlePosition = { x: 50, y: 8 },
}: RankingPreviewProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isDraggingTitle, setIsDraggingTitle] = useState(false);
  const [localTitlePos, setLocalTitlePos] = useState(titlePosition);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const videosWithSrc = useMemo(() => {
    return config.videos.filter((v: VideoSource) => v.link || v.file);
  }, [config.videos]);
  
  // Calculate video time ranges based on clipDuration
  const videoTimeRanges = useMemo(() => {
    let accumulatedTime = 0;
    const VIDEO_DURATION_PER_CLIP_SECONDS = 5;
    return videosWithSrc.map((video: VideoSource, index: number) => {
      const clipDuration = video.clipDuration || VIDEO_DURATION_PER_CLIP_SECONDS;
      const range = {
        start: accumulatedTime,
        end: accumulatedTime + clipDuration,
        videoIndex: index,
        clipDuration,
      };
      accumulatedTime += clipDuration;
      return range;
    });
  }, [videosWithSrc]);
  
  const currentVideoIndex = useMemo(() => {
    if (videoTimeRanges.length === 0) return -1;
    const currentRange = videoTimeRanges.find(
      (range: { start: number; end: number; videoIndex: number; clipDuration: number }) => currentTime >= range.start && currentTime < range.end
    );
    return currentRange ? currentRange.videoIndex : -1;
  }, [currentTime, videoTimeRanges]);
  
  // Calculate transition state
  const transitionState = useMemo(() => {
    if (videoTimeRanges.length === 0 || config.transitionSettings.type === 'none') {
      return { inTransition: false, fromIndex: -1, toIndex: -1, progress: 0 };
    }
    
    const transitionDuration = config.transitionSettings.duration;
    
    // Check each video boundary for transition
    for (let i = 0; i < videoTimeRanges.length - 1; i++) {
      const range = videoTimeRanges[i];
      const videoEndTime = range.end;
      
      if (isInTransition(currentTime, videoEndTime, transitionDuration)) {
        const rawProgress = getTransitionProgress(currentTime, videoEndTime, transitionDuration);
        const easedProgress = applyEasing(rawProgress, config.transitionSettings.timingFunction);
        
        return {
          inTransition: true,
          fromIndex: i,
          toIndex: i + 1,
          progress: easedProgress,
        };
      }
    }
    
    return { inTransition: false, fromIndex: -1, toIndex: -1, progress: 0 };
  }, [currentTime, videoTimeRanges, config.transitionSettings]);
  
  // Sync localTitlePos with titlePosition prop when it changes externally
  useEffect(() => {
    setLocalTitlePos(titlePosition);
  }, [titlePosition]);

  // Handle background music playback
  useEffect(() => {
    if (!config.backgroundMusic?.url) {
      // Clean up if music is removed
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      return;
    }

    // Create or update audio element for background music
    if (!backgroundMusicRef.current) {
      const audio = document.createElement('audio');
      audio.loop = true;
      audio.preload = 'auto';
      backgroundMusicRef.current = audio;
    }

    const audio = backgroundMusicRef.current;
    audio.src = config.backgroundMusic.url;
    
    // Set volume (0-1 range, config.backgroundMusic.volume is 0-100)
    audio.volume = (config.backgroundMusic.volume || 50) / 100;

    // Handle play/pause sync with video
    // Background music should play when video is playing, regardless of video mute state
    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Background music play failed:', err);
      });
    } else {
      audio.pause();
    }

    return () => {
      // Cleanup on unmount
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.src = '';
      }
    };
  }, [config.backgroundMusic, isPlaying]);

  // Handle background music volume and fade effects
  useEffect(() => {
    if (!backgroundMusicRef.current || !config.backgroundMusic) return;

    const audio = backgroundMusicRef.current;
    const musicConfig = config.backgroundMusic;
    const baseVolume = (musicConfig.volume || 50) / 100;

    // Calculate current volume with fade in/out
    let currentVolume = baseVolume;

    if (musicConfig.fadeIn && currentTime < 2) {
      // Fade in over first 2 seconds
      currentVolume = baseVolume * Math.min(currentTime / 2, 1);
    }

    if (musicConfig.fadeOut && duration > 0 && currentTime > duration - 2) {
      // Fade out over last 2 seconds
      const fadeOutStart = duration - 2;
      const fadeOutProgress = (currentTime - fadeOutStart) / 2;
      currentVolume = baseVolume * (1 - Math.min(fadeOutProgress, 1));
    }

    // Apply ducking if enabled (lower volume when videos have audio)
    if (musicConfig.ducking) {
      const duckAmount = (musicConfig.duckingAmount || 50) / 100;
      // For now, we'll apply ducking - in a real implementation, you'd detect video audio
      currentVolume = currentVolume * (1 - duckAmount * 0.5);
    }

    // Sync audio playback time with video timeline (loop the music)
    if (isPlaying && audio.duration > 0) {
      const targetTime = currentTime % audio.duration;
      if (Math.abs(audio.currentTime - targetTime) > 0.5) {
        audio.currentTime = targetTime;
      }
    }

    audio.volume = Math.max(0, Math.min(1, currentVolume));
  }, [config.backgroundMusic, currentTime, duration, isPlaying]);
  useEffect(() => {
    if (currentVideoIndex < 0) return;
    
    const currentRange = videoTimeRanges[currentVideoIndex];
    if (!currentRange) return;
    
    videoRefs.current.forEach((video, id) => {
      const videoIndex = videosWithSrc.findIndex((v: VideoSource) => v.id === id);
      
      // Skip if video not found in videosWithSrc
      if (videoIndex === -1) {
        video.pause();
        return;
      }
      
      const videoSource = videosWithSrc[videoIndex];
      
      // Safety check: ensure videoSource exists
      if (!videoSource) {
        video.pause();
        return;
      }
      
      if (videoIndex === currentVideoIndex) {
        // Calculate the time within this video clip
        const timeInClip = currentTime - currentRange.start;
        const trimStart = videoSource.trimStart || 0;
        const targetTime = trimStart + timeInClip;
        
        // Seek to correct position if needed
        if (Math.abs(video.currentTime - targetTime) > 0.2) {
          video.currentTime = Math.min(targetTime, video.duration || Infinity);
        }
        
        if (isPlaying && video.paused) {
          video.play().catch(() => {
            // Autoplay might fail, ignore
          });
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
        video.muted = isMuted;
      } else {
        video.pause();
        // Reset to trim start or 0
        video.currentTime = videoSource.trimStart || 0;
      }
    });
  }, [isPlaying, currentVideoIndex, currentTime, isMuted, videosWithSrc, videoTimeRanges]);
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(Math.max(0, Math.min(duration, newTime)));
  };
  const handleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Fallback: try to exit if we're already in fullscreen
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } catch (e) {
          console.error('Failed to exit fullscreen:', e);
        }
      }
    }
  }, []);
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  const handleTitleDragStart = useCallback((e: React.MouseEvent) => {
    if (!config.enableTitleDrag) return;
    e.preventDefault();
    setIsDraggingTitle(true);
  }, [config.enableTitleDrag]);
  const handleTitleDrag = useCallback((e: React.MouseEvent) => {
    if (!isDraggingTitle || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    const clampedY = Math.max(5, Math.min(40, y));
    setLocalTitlePos({ x: clampedX, y: clampedY });
  }, [isDraggingTitle]);
  const handleTitleDragEnd = useCallback(() => {
    if (isDraggingTitle) {
      setIsDraggingTitle(false);
      onTitlePositionChange?.(localTitlePos.x, localTitlePos.y);
    }
  }, [isDraggingTitle, localTitlePos, onTitlePositionChange]);
  useEffect(() => {
    if (isDraggingTitle) {
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const clampedX = Math.max(10, Math.min(90, x));
        const clampedY = Math.max(5, Math.min(40, y));
        setLocalTitlePos({ x: clampedX, y: clampedY });
      };
      const handleMouseUp = () => {
        setIsDraggingTitle(false);
        onTitlePositionChange?.(localTitlePos.x, localTitlePos.y);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingTitle, localTitlePos, onTitlePositionChange]);
  // Create blob URLs for file uploads
  useEffect(() => {
    const urls: Record<string, string> = {};
    const currentUrls: string[] = [];
    
    config.videos.forEach((video: VideoSource) => {
      if (video.file) {
        try {
          // Revoke old URL if it exists
          const oldUrl = fileUrls[video.id];
          if (oldUrl && oldUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(oldUrl);
            } catch (e) {
              // Ignore errors when revoking old URLs
            }
          }
          
          // Create new blob URL
          const newUrl = URL.createObjectURL(video.file);
          urls[video.id] = newUrl;
          currentUrls.push(newUrl);
        } catch (error) {
          console.error('Failed to create blob URL for video:', video.id, error);
        }
      }
    });
    
    setFileUrls(urls);
    
    return () => {
      // Cleanup: revoke all blob URLs
      currentUrls.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          // Ignore errors during cleanup
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.videos]); // Intentionally not including fileUrls to avoid infinite loop
  const getVideoSrc = (video: VideoSource): string | undefined => {
    if (video.file) {
      const url = fileUrls[video.id];
      // Ensure blob URL is still valid
      if (url && url.startsWith('blob:')) {
        return url;
      }
      // If no URL yet, return undefined (will be set by useEffect)
      return undefined;
    }
    return video.link;
  };
  return (
    <div className="h-full flex flex-col bg-surface-darkest p-2 min-[375px]:p-3 sm:p-4">
      <div className="flex-1 flex items-center justify-center min-h-0">
        {videosWithSrc.length === 0 ? (
          <div className="w-full max-w-md text-center py-8">
            <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-6">
              <Play size={40} className="text-zinc-500" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-8">
              <h3 className="text-xl font-semibold text-white">Ready to create rankings</h3>
              <span className="text-zinc-400 text-base bg-zinc-800/30 px-3 py-1 rounded-full">Add videos to preview</span>
            </div>
            <p className="text-zinc-400 text-base mb-8">Start by adding videos to see your ranking preview</p>
            <div className="w-full max-w-xs aspect-[9/16] rounded-lg bg-zinc-900/20 border-2 border-dashed border-zinc-700 flex items-center justify-center mx-auto">
              <span className="text-zinc-500 text-sm">Preview area</span>
            </div>
          </div>
        ) : (
        <div 
          ref={containerRef}
          className={`w-full aspect-[9/16] rounded-lg overflow-hidden relative ${isFullscreen ? '!w-screen !h-screen !max-h-screen !rounded-none' : ''}`}
          style={{ 
            backgroundColor: config.background, 
            maxHeight: isFullscreen ? '100vh' : 'calc(100% - 80px)', 
            position: 'relative',
            ...(isFullscreen ? { width: '100vw', height: '100vh', aspectRatio: 'auto' } : {})
          }}
          onMouseMove={handleTitleDrag}
          onMouseUp={handleTitleDragEnd}
          onMouseLeave={handleTitleDragEnd}
        >
          {config.title && (
            <div
              className={`absolute px-4 z-10 ${config.enableTitleDrag ? 'cursor-move' : ''} ${isDraggingTitle ? 'select-none' : ''}`}
              style={{
                left: `${localTitlePos.x}%`,
                top: `${localTitlePos.y}%`,
                transform: 'translate(-50%, 0)',
                fontFamily: textFormat.fontFamily,
                fontSize: `${textFormat.fontSize * 0.6}px`,
                fontWeight: textFormat.bold ? 'bold' : 'normal',
                fontStyle: textFormat.italic ? 'italic' : 'normal',
                color: textFormat.color,
                textAlign: textFormat.alignment,
                textShadow: config.titleStroke > 0 
                  ? `${config.titleStroke}px ${config.titleStroke}px 0 ${config.titleStrokeColor}, -${config.titleStroke}px -${config.titleStroke}px 0 ${config.titleStrokeColor}, ${config.titleStroke}px -${config.titleStroke}px 0 ${config.titleStrokeColor}, -${config.titleStroke}px ${config.titleStroke}px 0 ${config.titleStrokeColor}`
                  : 'none',
              }}
              onMouseDown={handleTitleDragStart}
            >
              {config.enableTitleDrag && (
                <Move size={12} className="absolute -top-4 left-1/2 -translate-x-1/2 text-white/50" />
              )}
              {config.title}
            </div>
          )}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-zinc-900/80 overflow-hidden z-0"
            style={{ height: `${config.videoHeight}%` }}
          >
              {videosWithSrc.map((video: VideoSource, index: number) => {
                const src = getVideoSrc(video);
                if (!src) {
                  // If file is still loading, show placeholder
                  if (video.file) {
                    return (
                      <div
                        key={video.id}
                        className="absolute inset-0 flex items-center justify-center bg-zinc-800/30"
                      >
                        <div className="text-zinc-500 text-sm">Loading video...</div>
                      </div>
                    );
                  }
                  return null;
                }
                
                // Check if this is a link (not a file) - these can't be displayed directly
                const isLink = video.link && !video.file;
                if (isLink) {
                  // Show placeholder for link videos since they can't be displayed directly
                  return (
                    <div
                      key={video.id}
                      className="absolute inset-0 flex items-center justify-center bg-zinc-800/50"
                      style={{
                        opacity: currentVideoIndex === index ? 1 : 0,
                        zIndex: currentVideoIndex === index ? 10 : 0,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      <div className="text-center p-6">
                        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                          <Play size={32} className="text-blue-400" />
                        </div>
                        <p className="text-white font-medium mb-2">Video Link Added</p>
                        <p className="text-zinc-400 text-xs mb-3 max-w-xs">
                          {video.link?.includes('tiktok.com') && 'TikTok'}
                          {video.link?.includes('instagram.com') && 'Instagram'}
                          {video.link?.includes('youtube.com') || video.link?.includes('youtu.be') ? 'YouTube' : ''}
                        </p>
                        <p className="text-zinc-500 text-xs">
                          Download and upload as file to preview
                        </p>
                      </div>
                    </div>
                  );
                }
                
                // Determine opacity and transforms based on transition
                let opacity = 0;
                let transform = '';
                let clipPath = '';
                let filter = '';
                let zIndex = index;
                
                if (transitionState.inTransition) {
                  const { fromIndex, toIndex, progress } = transitionState;
                  
                  if (index === fromIndex || index === toIndex) {
                    const isFrom = index === fromIndex;
                    
                    switch (config.transitionSettings.type) {
                      case 'fade':
                        opacity = getFadeOpacity(progress, isFrom);
                        break;
                      case 'wipe-left':
                      case 'wipe-right':
                      case 'wipe-up':
                      case 'wipe-down': {
                        const direction = config.transitionSettings.type.split('-')[1] as 'left' | 'right' | 'up' | 'down';
                        opacity = isFrom ? 1 : 1;
                        clipPath = getWipeClipPath(progress, direction, 100, 100, isFrom);
                        zIndex = isFrom ? 1 : 2;
                        break;
                      }
                      case 'slide-left':
                      case 'slide-right': {
                        const direction = config.transitionSettings.type.split('-')[1] as 'left' | 'right';
                        const { translateX, translateY } = getSlideTransform(progress, direction, isFrom);
                        opacity = 1;
                        transform = `translate(${translateX}%, ${translateY}%)`;
                        zIndex = isFrom ? 1 : 2;
                        break;
                      }
                      case 'zoom-in':
                      case 'zoom-out': {
                        const type = config.transitionSettings.type.split('-')[1] as 'in' | 'out';
                        const scale = getZoomScale(progress, type, isFrom);
                        opacity = 1;
                        transform = `scale(${scale})`;
                        zIndex = isFrom ? 1 : 2;
                        break;
                      }
                      case 'blur': {
                        const blur = getBlurAmount(progress, isFrom);
                        opacity = 1;
                        filter = `blur(${blur}px)`;
                        zIndex = isFrom ? 1 : 2;
                        break;
                      }
                      case 'glitch': {
                        const jitter = Math.sin(progress * Math.PI * 10) * (1 - progress) * 2;
                        opacity = 1 - progress * 0.3;
                        transform = `translateX(${jitter}px)`;
                        zIndex = isFrom ? 1 : 2;
                        break;
                      }
                      case 'rotate': {
                        const angle = progress * 360;
                        opacity = 1;
                        transform = `rotate(${isFrom ? -angle : angle}deg)`;
                        zIndex = isFrom ? 1 : 2;
                        break;
                      }
                      case 'cube': {
                        const scale = 1 - Math.sin(progress * Math.PI) * 0.3;
                        opacity = Math.sin(progress * Math.PI);
                        transform = `scaleX(${scale})`;
                        zIndex = isFrom ? 1 : 2;
                        break;
                      }
                      case 'none':
                      default:
                        opacity = index === currentVideoIndex ? 1 : 0;
                        break;
                    }
                  }
                } else {
                  // Normal playback - no transition
                  opacity = index === currentVideoIndex ? 1 : 0;
                }
                
                // Get CSS-compatible timing function
                const cssTimingFunction = getCSSTimingFunction(config.transitionSettings.timingFunction);
                
                const isExternalUrl = src && (src.startsWith('http://') || src.startsWith('https://'));
                
                return (
                  <video
                    key={video.id}
                    ref={(el) => {
                      if (el) videoRefs.current.set(video.id, el);
                    }}
                    src={src}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      opacity,
                      transform,
                      clipPath: clipPath || undefined,
                      filter: filter || undefined,
                      zIndex,
                      // CSS transition for smoothness - actual values are controlled by our JS calculations
                      // The transition duration and timing function match the settings
                      transition: transitionState.inTransition 
                        ? `opacity ${config.transitionSettings.duration}s ${cssTimingFunction}, transform ${config.transitionSettings.duration}s ${cssTimingFunction}, filter ${config.transitionSettings.duration}s ${cssTimingFunction}`
                        : 'opacity 0.3s ease-in-out',
                    }}
                    loop
                    muted={isMuted}
                    playsInline
                    crossOrigin={isExternalUrl ? "anonymous" : undefined}
                    preload="metadata"
                    onError={(e) => {
                      console.warn('Video failed to load:', src, e);
                      // Hide video on error
                      if (e.currentTarget) {
                        e.currentTarget.style.display = 'none';
                      }
                    }}
                  />
                );
              })}
              {config.captionsEnabled && currentVideoIndex >= 0 && (
              <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                <span className="bg-black/70 text-white text-sm px-3 py-1 rounded">
                  Video {currentVideoIndex + 1} of {videosWithSrc.length}
                </span>
              </div>
            )}
            
            {/* Render ranking graphics */}
            {config.rankingGraphic && currentVideoIndex >= 0 && (
              <RankingGraphicDisplay
                rank={currentVideoIndex + 1}
                graphic={config.rankingGraphic}
              />
            )}
            
            {/* Fullscreen Controls Overlay */}
            {isFullscreen && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 z-50">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={onPlayPause}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                    type="button"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
                    type="button"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  <button 
                    onClick={handleFullscreen}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm" 
                    type="button"
                    aria-label="Exit fullscreen"
                  >
                    <Minimize2 size={24} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div
                  className="mt-3 h-1.5 bg-white/20 rounded-full cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      <div className="mt-2 min-[375px]:mt-3 sm:mt-4 space-y-1.5 min-[375px]:space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onPlayPause}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
            type="button"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
            type="button"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <span className="text-xs text-zinc-400 ml-auto">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button 
            onClick={handleFullscreen}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors" 
            type="button"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
        <div
          className="h-1 bg-zinc-800 rounded-full cursor-pointer"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};