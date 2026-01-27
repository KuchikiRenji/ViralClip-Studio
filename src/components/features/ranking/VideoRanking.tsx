import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, ChevronRight, CheckCircle, Download, Plus } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { RankingConfig, VideoSource, RichTextFormat } from './types';
import { RankingConfigPanel } from './RankingConfig';
import { RankingPreview } from './RankingPreview';
import { createVideoBlob, downloadBlob, generateFilename, ExportProgress } from '../../../utils/videoExport';
import {
  applyEasing,
  getTransitionProgress,
  isInTransition,
  applyTransitionToCanvas,
} from './transitionUtils';
import { renderRankingOnCanvas } from './rankingGraphicsUtils';

const VIDEO_DURATION_PER_CLIP_SECONDS = 5;

interface VideoRankingProps {
  onBack: () => void;
}

const INITIAL_CONFIG: RankingConfig = {
  title: '',
  titleStroke: 2,
  titleStrokeColor: '#000000',
  videoHeight: 80,
  background: '#2b2a2a',
  videos: [
    { id: 'video_1', type: 'link', clipDuration: 5 },
    { id: 'video_2', type: 'link', clipDuration: 5 },
  ],
  enableTitleDrag: false,
  captionsEnabled: false,
  transitionSettings: {
    type: 'fade',
    duration: 0.5,
    timingFunction: 'ease-in-out',
  },
  exportSettings: {
    quality: '1080p',
    format: 'webm',
    fps: 30,
  },
  rankingGraphic: undefined,
  overlays: [],
};
const INITIAL_TEXT_FORMAT: RichTextFormat = {
  bold: false,
  italic: false,
  fontFamily: 'Oswald',
  fontSize: 24,
  color: '#ffffff',
  alignment: 'center',
};
export const VideoRanking = ({ onBack }: VideoRankingProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const [config, setConfig] = useState<RankingConfig>(INITIAL_CONFIG);
  const [textFormat, setTextFormat] = useState<RichTextFormat>(INITIAL_TEXT_FORMAT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [titlePosition, setTitlePosition] = useState({ x: 50, y: 8 });
  const [generationProgress, setGenerationProgress] = useState(0);
  const generationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videosWithSrc = config.videos.filter(v => v.link || v.file);
  const duration = videosWithSrc.reduce((total, video) => {
    return total + (video.clipDuration || VIDEO_DURATION_PER_CLIP_SECONDS);
  }, 0) || 1;
  useEffect(() => {
    return () => {
      if (generationIntervalRef.current) {
        clearInterval(generationIntervalRef.current);
      }
    };
  }, []);
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (isPlaying && duration > 0) {
        setCurrentTime((t) => {
          if (t >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return t + dt;
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, duration]);
  const handleConfigChange = useCallback((updates: Partial<RankingConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);
  const handleTextFormatChange = useCallback((updates: Partial<RichTextFormat>) => {
    setTextFormat((prev) => ({ ...prev, ...updates }));
  }, []);
  const handleTitleChange = useCallback((title: string) => {
    setConfig((prev) => ({ ...prev, title }));
  }, []);
  const handleVideoUpdate = useCallback((id: string, updates: Partial<VideoSource>) => {
    setConfig((prev) => ({
      ...prev,
      videos: prev.videos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }));
  }, []);
  const handleVideoMoveUp = useCallback((id: string) => {
    setConfig((prev) => {
      const index = prev.videos.findIndex((v) => v.id === id);
      if (index <= 0) return prev;
      const newVideos = [...prev.videos];
      [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]];
      return { ...prev, videos: newVideos };
    });
  }, []);
  const handleVideoMoveDown = useCallback((id: string) => {
    setConfig((prev) => {
      const index = prev.videos.findIndex((v) => v.id === id);
      if (index < 0 || index >= prev.videos.length - 1) return prev;
      const newVideos = [...prev.videos];
      [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
      return { ...prev, videos: newVideos };
    });
  }, []);
  const handleVideoDelete = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== id),
    }));
  }, []);
  const handleAddVideo = useCallback(() => {
    const MAX_VIDEOS = 5;
    setConfig((prev) => {
      // Check if we can add more videos
      if (prev.videos.length >= MAX_VIDEOS) {
        return prev; // Don't add more videos if limit reached
      }
      const newVideo: VideoSource = {
        id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'link',
        clipDuration: 5,
      };
      return {
        ...prev,
        videos: [...prev.videos, newVideo],
      };
    });
  }, []);
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);
  const handleTitlePositionChange = useCallback((x: number, y: number) => {
    setTitlePosition({ x, y });
  }, []);
  const handleGenerate = useCallback(async () => {
    const exportVideos = config.videos.filter((v) => v.file || v.link);
    if (exportVideos.length === 0) {
      alert('Please add at least one video before generating.');
      return;
    }

    if (!requireSubscription('Video Ranking')) {
      return;
    }
    
    setIsGenerating(true);
    setExportedBlob(null);

    const startTime = Date.now();
    const minDisplayTime = 5000;
    const targetProgress = 0.72;

    await new Promise(resolve => setTimeout(resolve, 50));

    let progressInterval: ReturnType<typeof setInterval> | null = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= targetProgress) {
          if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          return targetProgress;
        }
        // Smoothly animate to 72% over 5 seconds
        const increment = targetProgress / (minDisplayTime / 100);
        return Math.min(prev + increment, targetProgress);
      });
    }, 100);
    
    // Check if we have files to process (for backend processing)
    const videosWithFiles = config.videos.filter((v) => v.file);
    
    // If only links are provided (no files), show loading screen for 5 seconds then stop
    // This is frontend-only behavior regardless of backend
    if (videosWithFiles.length === 0 && exportVideos.some(v => v.link)) {
      // Wait for minimum display time (5 seconds)
      await new Promise(resolve => setTimeout(resolve, minDisplayTime));
      
      // Clear progress interval
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      
      // Complete progress to 100% before hiding
      setGenerationProgress(1);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsGenerating(false);
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Clear progress interval on error
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      setIsGenerating(false);
      return;
    }
    const loadedVideos: HTMLVideoElement[] = [];
    const blobUrls: string[] = [];
    
    for (const video of exportVideos) {
      const videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.preload = 'auto';
      
      if (video.file) {
        const blobUrl = URL.createObjectURL(video.file);
        blobUrls.push(blobUrl);
        videoEl.src = blobUrl;
      } else if (video.link) {
        // Skip link videos for export - they can't be used directly
        console.warn('Skipping link video for export:', video.link);
        continue;
      } else {
        continue;
      }
      
      // Wait for video to be fully loaded and ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Video loading timeout for ${video.id}`));
        }, 30000); // 30 second timeout
        
        const onLoadedData = () => {
          if (videoEl.readyState >= 2) {
            clearTimeout(timeout);
            videoEl.removeEventListener('loadeddata', onLoadedData);
            videoEl.removeEventListener('error', onError);
            resolve();
          }
        };
        
        const onError = () => {
          clearTimeout(timeout);
          videoEl.removeEventListener('loadeddata', onLoadedData);
          videoEl.removeEventListener('error', onError);
          reject(new Error(`Failed to load video ${video.id}`));
        };
        
        videoEl.addEventListener('loadeddata', onLoadedData);
        videoEl.addEventListener('error', onError);
        videoEl.load();
      });
      
      // Ensure video metadata is loaded
      if (videoEl.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 300; // 30 seconds max
          const checkReady = () => {
            attempts++;
            if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error(`Video ${video.id} failed to load metadata`));
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
      }
      
      // Verify video has valid dimensions
      if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
        throw new Error(`Video ${video.id} has invalid dimensions`);
      }
      
      loadedVideos.push(videoEl);
    }
    
    if (loadedVideos.length === 0) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      setIsGenerating(false);
      alert('No valid video files to export. Please upload video files (links cannot be exported directly).');
      return;
    }
    const exportConfig = {
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: 8000000,
      audioBitrate: 128000,
      format: 'webm' as const,
    };
    // Calculate total duration based on clipDuration of each video
    let accumulatedTime = 0;
    const videoTimeRanges: Array<{ start: number; end: number; videoIndex: number; clipDuration: number }> = [];
    exportVideos.forEach((video, index) => {
      const clipDuration = video.clipDuration || VIDEO_DURATION_PER_CLIP_SECONDS;
      videoTimeRanges.push({
        start: accumulatedTime,
        end: accumulatedTime + clipDuration,
        videoIndex: index,
        clipDuration,
      });
      accumulatedTime += clipDuration;
    });
    const totalDurationMs = accumulatedTime * 1000;
    
    // Helper to wait for video seek to complete
    const waitForVideoSeek = (video: HTMLVideoElement, targetTime: number): Promise<void> => {
      return new Promise((resolve) => {
        if (Math.abs(video.currentTime - targetTime) <= 0.05) {
          // Already at correct time
          resolve();
          return;
        }
        
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          // Small delay to ensure frame is ready
          setTimeout(resolve, 10);
        };
        
        const onError = () => {
          video.removeEventListener('error', onError);
          resolve(); // Continue even if seek fails
        };
        
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        
        try {
          video.currentTime = targetTime;
        } catch (e) {
          // If seek fails immediately, resolve anyway
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
          resolve();
        }
        
        // Timeout fallback
        setTimeout(() => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
          resolve();
        }, 500);
      });
    };
    
    const renderFrame = async (currentTimeSeconds: number) => {
      ctx.fillStyle = config.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const videoAreaHeight = (config.videoHeight / 100) * canvas.height;
      const videoAreaY = canvas.height - videoAreaHeight;
      
      // Check for transition
      const transitionDuration = config.transitionSettings.duration;
      let inTransition = false;
      let fromVideoIndex = -1;
      let toVideoIndex = -1;
      let transitionProgress = 0;
      
      // Track current range for captions
      let currentRange: { start: number; end: number; videoIndex: number; clipDuration: number } | undefined;
      
      if (config.transitionSettings.type !== 'none' && transitionDuration > 0) {
        for (let i = 0; i < videoTimeRanges.length - 1; i++) {
          const range = videoTimeRanges[i];
          const videoEndTime = range.end;
          
          if (isInTransition(currentTimeSeconds, videoEndTime, transitionDuration)) {
            inTransition = true;
            fromVideoIndex = i;
            toVideoIndex = i + 1;
            const rawProgress = getTransitionProgress(currentTimeSeconds, videoEndTime, transitionDuration);
            transitionProgress = applyEasing(rawProgress, config.transitionSettings.timingFunction);
            break;
          }
        }
      }
      
      // Render current video or transition
      if (inTransition && fromVideoIndex >= 0 && toVideoIndex < loadedVideos.length) {
        const fromVideo = loadedVideos[fromVideoIndex];
        const toVideo = loadedVideos[toVideoIndex];
        const fromRange = videoTimeRanges[fromVideoIndex];
        const toRange = videoTimeRanges[toVideoIndex];
        // Set currentRange for captions (use "to" video during transition)
        currentRange = toRange;
        
        // Calculate video positions
        const getVideoDrawParams = (video: HTMLVideoElement) => {
          if (!video || video.readyState < 2) return null;
          const videoAspect = video.videoWidth / video.videoHeight;
          const areaAspect = canvas.width / videoAreaHeight;
          let drawWidth = canvas.width;
          let drawHeight = videoAreaHeight;
          let drawX = 0;
          let drawY = videoAreaY;
          if (videoAspect > areaAspect) {
            drawHeight = canvas.width / videoAspect;
            drawY = videoAreaY + (videoAreaHeight - drawHeight) / 2;
          } else {
            drawWidth = videoAreaHeight * videoAspect;
            drawX = (canvas.width - drawWidth) / 2;
          }
          return { drawX, drawY, drawWidth, drawHeight };
        };
        
        // Render "from" video
        if (fromVideo && fromVideo.readyState >= 2 && fromVideo.videoWidth > 0 && fromVideo.videoHeight > 0) {
          const timeInClip = currentTimeSeconds - fromRange.start;
          const trimStart = exportVideos[fromVideoIndex].trimStart || 0;
          const targetTime = Math.max(0, Math.min(trimStart + timeInClip, fromVideo.duration || Infinity));
          
          // Wait for video seek to complete
          await waitForVideoSeek(fromVideo, targetTime);
          
          const fromParams = getVideoDrawParams(fromVideo);
          if (fromParams) {
            ctx.save();
            
            // Apply transition effect (from video perspective)
            // For "from" video: progress increases = less visible (reverse progress)
            if (config.transitionSettings.type === 'fade') {
              ctx.globalAlpha = 1 - transitionProgress;
            } else if (config.transitionSettings.type.startsWith('wipe-')) {
              ctx.globalAlpha = 1;
              // For wipe, "from" video gets clipped more as progress increases
              applyTransitionToCanvas(
                ctx,
                config.transitionSettings.type,
                1 - transitionProgress, // Reverse: 1 = fully visible, 0 = fully hidden
                canvas.width,
                canvas.height,
                fromParams.drawX,
                fromParams.drawY,
                fromParams.drawWidth,
                fromParams.drawHeight
              );
            } else {
              ctx.globalAlpha = 1;
              // For other transitions, use reverse progress for "from" video
              applyTransitionToCanvas(
                ctx,
                config.transitionSettings.type,
                1 - transitionProgress,
                canvas.width,
                canvas.height,
                fromParams.drawX,
                fromParams.drawY,
                fromParams.drawWidth,
                fromParams.drawHeight
              );
            }
            
            try {
              ctx.drawImage(fromVideo, fromParams.drawX, fromParams.drawY, fromParams.drawWidth, fromParams.drawHeight);
            } catch (e) {
              console.warn('Failed to draw from video frame:', e);
            }
            ctx.restore();
          }
        }
        
        // Render "to" video
        if (toVideo && toVideo.readyState >= 2 && toVideo.videoWidth > 0 && toVideo.videoHeight > 0) {
          const timeInClip = currentTimeSeconds - toRange.start;
          const trimStart = exportVideos[toVideoIndex].trimStart || 0;
          const targetTime = Math.max(0, Math.min(trimStart + Math.max(0, timeInClip), toVideo.duration || Infinity));
          
          // Wait for video seek to complete
          await waitForVideoSeek(toVideo, targetTime);
          
          const toParams = getVideoDrawParams(toVideo);
          if (toParams) {
            ctx.save();
            
            // Apply transition effect (to video perspective)
            // For "to" video, progress increases = more visible
            if (config.transitionSettings.type === 'fade') {
              ctx.globalAlpha = transitionProgress;
            } else {
              ctx.globalAlpha = 1;
              // For "to" video, pass progress directly (0 = hidden, 1 = fully visible)
              applyTransitionToCanvas(
                ctx,
                config.transitionSettings.type,
                transitionProgress,
                canvas.width,
                canvas.height,
                toParams.drawX,
                toParams.drawY,
                toParams.drawWidth,
                toParams.drawHeight
              );
            }
            
            try {
              ctx.drawImage(toVideo, toParams.drawX, toParams.drawY, toParams.drawWidth, toParams.drawHeight);
            } catch (e) {
              console.warn('Failed to draw to video frame:', e);
            }
            ctx.restore();
          }
        }
      } else {
        // Normal rendering - no transition
        currentRange = videoTimeRanges.find(
          (range) => currentTimeSeconds >= range.start && currentTimeSeconds < range.end
        );
        
        if (currentRange && currentRange.videoIndex < loadedVideos.length) {
          const currentVideo = loadedVideos[currentRange.videoIndex];
          if (currentVideo && currentVideo.readyState >= 2 && currentVideo.videoWidth > 0 && currentVideo.videoHeight > 0) {
            // Seek video to the correct position within this clip
            const timeInClip = currentTimeSeconds - currentRange.start;
            const trimStart = exportVideos[currentRange.videoIndex].trimStart || 0;
            const targetTime = Math.max(0, Math.min(trimStart + timeInClip, currentVideo.duration || Infinity));
            
            // Wait for video seek to complete
            await waitForVideoSeek(currentVideo, targetTime);
            
            const videoAspect = currentVideo.videoWidth / currentVideo.videoHeight;
            if (videoAspect > 0 && !isNaN(videoAspect) && isFinite(videoAspect)) {
              const areaAspect = canvas.width / videoAreaHeight;
              let drawWidth = canvas.width;
              let drawHeight = videoAreaHeight;
              let drawX = 0;
              let drawY = videoAreaY;
              if (videoAspect > areaAspect) {
                drawHeight = canvas.width / videoAspect;
                drawY = videoAreaY + (videoAreaHeight - drawHeight) / 2;
              } else {
                drawWidth = videoAreaHeight * videoAspect;
                drawX = (canvas.width - drawWidth) / 2;
              }
              ctx.globalAlpha = 1;
              try {
                ctx.drawImage(currentVideo, drawX, drawY, drawWidth, drawHeight);
              } catch (e) {
                // If drawImage fails, draw a placeholder
                ctx.fillStyle = config.background;
                ctx.fillRect(drawX, drawY, drawWidth, drawHeight);
                console.warn('Failed to draw video frame:', e);
              }
            }
          }
        }
      }
      if (config.title) {
        ctx.save();
        ctx.font = `${textFormat.bold ? 'bold' : 'normal'} ${textFormat.italic ? 'italic' : ''} ${textFormat.fontSize * 2}px ${textFormat.fontFamily}`;
        ctx.textAlign = textFormat.alignment;
        ctx.textBaseline = 'top';
        const titleX = (titlePosition.x / 100) * canvas.width;
        const titleY = (titlePosition.y / 100) * canvas.height;
        if (config.titleStroke > 0) {
          ctx.strokeStyle = config.titleStrokeColor;
          ctx.lineWidth = config.titleStroke * 2;
          ctx.strokeText(config.title, titleX, titleY);
        }
        ctx.fillStyle = textFormat.color;
        ctx.fillText(config.title, titleX, titleY);
        ctx.restore();
      }
      if (config.captionsEnabled && loadedVideos.length > 0 && currentRange) {
        ctx.save();
        ctx.font = 'bold 32px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const captionText = `Video ${currentRange.videoIndex + 1} of ${loadedVideos.length}`;
        const captionWidth = ctx.measureText(captionText).width + 40;
        ctx.fillRect((canvas.width - captionWidth) / 2, canvas.height - 100, captionWidth, 50);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(captionText, canvas.width / 2, canvas.height - 65);
        ctx.restore();
      }
      
      // Render ranking graphics if enabled
      if (config.rankingGraphic && currentRange) {
        try {
          // Pass video time to graphic for consistent animation timing
          const graphicWithTime = {
            ...config.rankingGraphic,
            __videoTimeSeconds: currentTimeSeconds,
          };
          renderRankingOnCanvas(
            ctx,
            currentRange.videoIndex + 1,
            graphicWithTime as any,
            canvas.width,
            canvas.height
          );
        } catch (error) {
          console.error('Error rendering ranking graphic:', error);
        }
      }
    };
    // Set up audio context for background music
    let audioContext: AudioContext | null = null;
    let backgroundMusicAudio: HTMLAudioElement | null = null;
    let backgroundMusicSource: MediaElementAudioSourceNode | null = null;
    let backgroundMusicGain: GainNode | null = null;

    if (config.backgroundMusic?.url) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create audio element for background music
        backgroundMusicAudio = document.createElement('audio');
        backgroundMusicAudio.src = config.backgroundMusic.url;
        backgroundMusicAudio.loop = true;
        backgroundMusicAudio.preload = 'auto';
        backgroundMusicAudio.muted = false;
        
        // Wait for audio to be ready
        await new Promise<void>((resolve, reject) => {
          if (!backgroundMusicAudio) {
            reject(new Error('Audio element not created'));
            return;
          }
          backgroundMusicAudio.oncanplaythrough = () => resolve();
          backgroundMusicAudio.onerror = () => reject(new Error('Failed to load audio'));
          backgroundMusicAudio.load();
        });

        // Create media element source (this connects the audio element to Web Audio API)
        backgroundMusicSource = audioContext.createMediaElementSource(backgroundMusicAudio);
        
        // Create gain node for volume control
        backgroundMusicGain = audioContext.createGain();
        
        // Connect: source -> gain -> destination (for MediaStream)
        backgroundMusicSource.connect(backgroundMusicGain);

        // Set initial volume
        const baseVolume = (config.backgroundMusic.volume || 50) / 100;
        backgroundMusicGain.gain.value = baseVolume;
      } catch (error) {
        console.warn('Failed to load background music:', error);
        // Continue without audio if music fails to load
        backgroundMusicAudio = null;
        backgroundMusicSource = null;
        backgroundMusicGain = null;
      }
    }

    try {
      // Start background music if available
      if (backgroundMusicAudio && audioContext) {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        // Start playing the audio element
        try {
          await backgroundMusicAudio.play();
        } catch (error) {
          console.warn('Failed to play background music:', error);
        }
      }

      console.log('🎬 Using server-side FFmpeg for video export');

      const videoSources: Array<{file?: Blob, link?: string}> = [];

      for (const video of exportVideos) {
        if (video.file) {
          videoSources.push({ file: video.file });
        } else if (video.link) {
          videoSources.push({ link: video.link });
        }
      }

      const hasLinks = videoSources.some(v => v.link);

      if (hasLinks) {
        console.log('📥 Downloading link videos...');

        for (let i = 0; i < videoSources.length; i++) {
          if (videoSources[i].link) {
            try {
              const downloadResponse = await fetch('/api/download-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoSources[i].link })
              });

              if (!downloadResponse.ok) {
                throw new Error(`Failed to download video from link: ${videoSources[i].link}`);
              }

              const downloadResult = await downloadResponse.json();
              console.log(`✅ Downloaded video ${i + 1}:`, downloadResult.url);

              const videoBlob = await fetch(downloadResult.url).then(r => r.blob());
              videoSources[i] = { file: videoBlob };
            } catch (error) {
              console.error(`Failed to download video ${i + 1}:`, error);
              throw new Error(`Failed to download video from link. Please ensure the link is valid.`);
            }
          }
        }
      }

      const formData = new FormData();

      for (const video of videoSources) {
        if (video.file) {
          formData.append('videos', video.file);
        }
      }

      if (config.backgroundMusic?.file) {
        formData.append('backgroundMusic', config.backgroundMusic.file);
      }

      const exportConfigData = {
        clipDurations: exportVideos.map(v => v.clipDuration || VIDEO_DURATION_PER_CLIP_SECONDS),
        trimStarts: exportVideos.map(v => v.trimStart || 0),
        title: config.title,
        titlePosition,
        titleStyle: config.title ? {
          fontFamily: textFormat.fontFamily,
          fontSize: textFormat.fontSize,
          color: textFormat.color,
          strokeColor: config.titleStrokeColor,
          strokeWidth: config.titleStroke,
          bold: textFormat.bold,
          italic: textFormat.italic,
        } : undefined,
        background: config.background,
        videoHeight: config.videoHeight,
        fps: exportConfig.fps,
        quality: config.exportSettings.quality,
        transitionSettings: config.transitionSettings,
        backgroundMusic: config.backgroundMusic ? {
          volume: config.backgroundMusic.volume,
          fadeIn: config.backgroundMusic.fadeIn,
          fadeOut: config.backgroundMusic.fadeOut,
          ducking: config.backgroundMusic.ducking,
          duckingAmount: config.backgroundMusic.duckingAmount,
        } : undefined,
        rankingGraphic: config.rankingGraphic,
        overlays: config.overlays,
        // Include full video metadata for captions
        videos: exportVideos.map(v => ({
          clipDuration: v.clipDuration || VIDEO_DURATION_PER_CLIP_SECONDS,
          trimStart: v.trimStart || 0,
          trimEnd: v.trimEnd,
          caption: v.caption
        }))
      };

      formData.append('config', JSON.stringify(exportConfigData));

      console.log('📤 Uploading videos to server...');

      const response = await fetch('/api/export-ranking-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server-side export failed');
      }

      const result = await response.json();
      console.log('✅ Processing complete:', result.url);

      const videoResponse = await fetch(result.url);
      const blob = await videoResponse.blob();
      if (backgroundMusicAudio) {
        backgroundMusicAudio.pause();
        backgroundMusicAudio.currentTime = 0;
      }

      blobUrls.forEach((url) => {
        URL.revokeObjectURL(url);
      });

      loadedVideos.forEach((v) => {
        v.pause();
        v.src = '';
        v.load();
      });
      
      if (audioContext) {
        await audioContext.close();
      }

      setExportedBlob(blob);

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }


      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      setGenerationProgress(1);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setIsGenerating(false);
      setIsGenerated(true);
    } catch (error) {
      console.error('Video export error:', error);
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      setIsGenerating(false);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [videosWithSrc, config, textFormat, titlePosition]);
  const handleCreateNew = useCallback(() => {
    setIsGenerated(false);
    setExportedBlob(null);
    setConfig(INITIAL_CONFIG);
    setTextFormat(INITIAL_TEXT_FORMAT);
    setTitlePosition({ x: 50, y: 8 });
  }, []);
  const handleDownload = useCallback(() => {
    if (exportedBlob) {
      downloadBlob(exportedBlob, generateFilename('ranking_video', 'mp4'));
    }
  }, [exportedBlob]);
  return (
    <div className="h-full bg-background text-white font-sans flex flex-col safe-area-inset-top overflow-hidden" style={{ height: '100%', maxHeight: '100vh' }}>
      <header className="min-h-14 min-[375px]:min-h-16 bg-background border-b border-white/5 flex items-center justify-between px-3 min-[375px]:px-4 sm:px-6 py-3 min-[375px]:py-4 shrink-0 z-50">
        <div className="flex items-center gap-3 min-[375px]:gap-4">
          <button
            onClick={onBack}
            className="w-9 h-9 min-[375px]:w-10 min-[375px]:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95"
            type="button"
            aria-label={t('common.goBack')}
          >
            <ArrowLeft size={16} className="min-[375px]:w-[18px] min-[375px]:h-[18px]" />
          </button>
          <div className="flex items-center gap-2 min-[375px]:gap-3">
            <div className="w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <span className="text-base min-[375px]:text-lg">🏆</span>
            </div>
            <h1 className="text-base min-[375px]:text-lg sm:text-xl font-semibold text-white">Video Rankings</h1>
          </div>
        </div>
        <button 
          className="hidden sm:flex px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/5 items-center gap-2 touch-target"
          type="button"
        >
          {t('videoRanking.viewRecent')}
          <ChevronRight size={16} />
        </button>
      </header>
      {isGenerating && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center">
          <div className="relative flex flex-col items-center justify-center gap-8 px-6">
            {/* Logo with Z */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <img 
                src="/678.svg" 
                alt="Zitro" 
                className="w-20 h-20 object-contain"
              />
              {/* Subtle rotating border */}
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-t-blue-500/40 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Generating Video...</span>
                <span className="text-blue-400 text-sm font-medium">{Math.round(generationProgress * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[rgb(var(--color-brand-primary-rgb))] via-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: `${Math.max(generationProgress * 100, 0)}%`,
                    minWidth: generationProgress > 0 ? '4px' : '0%'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {isGenerated && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 safe-area-all">
          <div className="text-center max-w-md w-full">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('videoRanking.readyTitle')}</h2>
            <p className="text-zinc-400 text-sm sm:text-base mb-4 sm:mb-6">{t('videoRanking.readySubtitle')}</p>
            <div className="aspect-[9/16] max-h-[200px] sm:max-h-[300px] bg-zinc-900 rounded-lg overflow-hidden mx-auto mb-4 sm:mb-6 relative">
              <div 
                className="absolute inset-0"
                style={{ backgroundColor: config.background }}
              >
                {config.title && (
                  <div
                    className="absolute top-4 left-0 right-0 text-center px-4"
                    style={{
                      fontFamily: textFormat.fontFamily,
                      fontSize: `${textFormat.fontSize * 0.4}px`,
                      fontWeight: textFormat.bold ? 'bold' : 'normal',
                      color: textFormat.color,
                      textAlign: textFormat.alignment,
                    }}
                  >
                    {config.title}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-zinc-800 flex items-center justify-center">
                  <span className="text-zinc-500 text-xs">Video Preview</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleDownload}
                disabled={!exportedBlob}
                className="w-full sm:w-auto px-6 py-3.5 min-h-[52px] bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 touch-target active:scale-[0.98]"
                type="button"
              >
                <Download size={20} />
                {t('videoRanking.download')}
              </button>
              <button
                onClick={handleCreateNew}
                className="w-full sm:w-auto px-6 py-3.5 min-h-[52px] bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 touch-target active:scale-[0.98]"
                type="button"
              >
                <Plus size={20} />
                {t('videoRanking.createNew')}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Video preview - at top on mobile, right sidebar on desktop */}
        <div 
          className="w-full lg:w-[360px] border-b lg:border-b-0 lg:border-l border-white/5 overflow-hidden h-[240px] min-[375px]:h-[280px] sm:h-[400px] lg:h-full shrink-0 bg-surface-darkest flex-shrink-0 flex flex-col order-1 lg:order-2"
        >
          <RankingPreview
            config={config}
            textFormat={textFormat}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onSeek={handleSeek}
            onTitlePositionChange={handleTitlePositionChange}
            titlePosition={titlePosition}
          />
        </div>
        {/* Config panel - scrollable below preview on mobile, left side on desktop */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar momentum-scroll min-h-0 lg:min-w-0 order-2 lg:order-1" 
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-3 min-[375px]:p-4 sm:p-6 max-w-full box-border">
            <RankingConfigPanel
              config={config}
              textFormat={textFormat}
              onConfigChange={handleConfigChange}
              onTextFormatChange={handleTextFormatChange}
              onTitleChange={handleTitleChange}
              onVideoUpdate={handleVideoUpdate}
              onVideoMoveUp={handleVideoMoveUp}
              onVideoMoveDown={handleVideoMoveDown}
              onVideoDelete={handleVideoDelete}
              onAddVideo={handleAddVideo}
              onGenerate={handleGenerate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};