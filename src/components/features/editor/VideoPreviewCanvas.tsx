import { useRef, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Clip } from '../../../types';
import type { Caption } from '../../../types/editor';

interface MediaSource {
  id: string;
  url: string;
  type: 'video' | 'image' | 'audio';
}

interface VideoPreviewCanvasProps {
  clips: Clip[];
  captions?: Caption[];
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
  mediaSources: Map<string, MediaSource>;
  backgroundUrl?: string;
  backgroundType?: 'image' | 'video' | 'color' | 'gradient';
  gradientColors?: [string, string] | null;
  className?: string;
}

export interface VideoPreviewCanvasHandle {
  renderFrame: (time: number, targetCtx?: CanvasRenderingContext2D, width?: number, height?: number) => void;
  getCanvas: () => HTMLCanvasElement | null;
}

export const VideoPreviewCanvas = forwardRef<VideoPreviewCanvasHandle, VideoPreviewCanvasProps>(({
  clips,
  captions = [],
  currentTime,
  isPlaying,
  isMuted,
  mediaSources,
  backgroundUrl,
  backgroundType = 'color',
  gradientColors,
  className = '',
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Background video management
  useEffect(() => {
    if (backgroundType === 'video' && backgroundUrl) {
      if (!bgVideoRef.current) {
        bgVideoRef.current = document.createElement('video');
        bgVideoRef.current.crossOrigin = 'anonymous';
        bgVideoRef.current.loop = true;
        bgVideoRef.current.muted = true;
      }
      if (bgVideoRef.current.src !== backgroundUrl) {
        bgVideoRef.current.src = backgroundUrl;
        bgVideoRef.current.load();
      }
    } else if (bgVideoRef.current) {
      bgVideoRef.current.pause();
      bgVideoRef.current.src = '';
      bgVideoRef.current = null;
    }
  }, [backgroundType, backgroundUrl]);

  const getClipMediaUrl = useCallback((clip: Clip): string | undefined => {
    if (clip.thumbnail && clip.type !== 'text') return clip.thumbnail;
    
    const source = mediaSources.get(clip.mediaId);
    if (source?.url) return source.url;
    
    const sourceById = mediaSources.get(clip.id);
    if (sourceById?.url) return sourceById.url;
    
    return undefined;
  }, [mediaSources]);

  const renderFrame = useCallback((time: number, targetCtx?: CanvasRenderingContext2D, targetWidth?: number, targetHeight?: number) => {
    const canvas = canvasRef.current;
    if (!canvas && !targetCtx) return;
    
    const ctx = targetCtx || canvas?.getContext('2d');
    if (!ctx) return;

    const width = targetWidth || canvas?.width || 1080;
    const height = targetHeight || canvas?.height || 1920;

    // 1. Draw Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (backgroundType === 'color' && backgroundUrl) {
      ctx.fillStyle = backgroundUrl;
      ctx.fillRect(0, 0, width, height);
    } else if (backgroundType === 'gradient' && gradientColors) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, gradientColors[0]);
      grad.addColorStop(1, gradientColors[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (backgroundType === 'image' && backgroundUrl) {
      const img = new Image();
      img.src = backgroundUrl;
      img.crossOrigin = 'anonymous';
      if (img.complete) {
        ctx.drawImage(img, 0, 0, width, height);
      }
    } else if (backgroundType === 'video' && backgroundUrl) {
      if (bgVideoRef.current && bgVideoRef.current.readyState >= 2) {
        bgVideoRef.current.currentTime = time % (bgVideoRef.current.duration || 1);
        ctx.drawImage(bgVideoRef.current, 0, 0, width, height);
      }
    }

    // 2. Filter active clips at the specified time
    const activeClipsAtTime = clips.filter(clip => {
      const clipEnd = clip.startTime + clip.duration;
      return time >= clip.startTime && time < clipEnd;
    });

    // 3. Draw active video/image/text clips
    activeClipsAtTime.forEach(clip => {
      if (clip.type === 'audio') return;

      ctx.save();
      
      const opacity = clip.properties.opacity ?? 1;
      const scale = clip.properties.scale ?? 1;
      const rotation = (clip.properties.rotation ?? 0) * (Math.PI / 180);
      const x = (clip.properties.positionX ?? 0) * (width / 100) + width / 2;
      const y = (clip.properties.positionY ?? 0) * (height / 100) + height / 2;

      ctx.globalAlpha = opacity;
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      if (clip.type === 'video') {
        const video = videoRefs.current.get(clip.id);
        if (video && video.readyState >= 2) {
          // Sync video time if it's the main preview
          if (!targetCtx) {
            const clipTime = time - clip.startTime + clip.inPoint;
            if (Math.abs(video.currentTime - clipTime) > 0.15) {
              video.currentTime = clipTime;
            }
          }
          ctx.drawImage(video, -width / 2, -height / 2, width, height);
        }
      } else if (clip.type === 'image') {
        const url = getClipMediaUrl(clip);
        if (url) {
          const img = new Image();
          img.src = url;
          if (img.complete) {
            ctx.drawImage(img, -width / 2, -height / 2, width, height);
          }
        }
      } else if (clip.type === 'text') {
        const text = clip.properties.text || '';
        const fontSize = clip.properties.fontSize || 40;
        const color = clip.properties.textColor || '#ffffff';
        const font = clip.properties.fontFamily || 'Arial';
        const align = (clip.properties.textAlign || 'center') as CanvasTextAlign;

        ctx.font = `bold ${fontSize}px ${font}`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillText(text, 0, 0);
      }

      ctx.restore();
    });

    // 4. Draw Captions
    const currentCaption = captions.find(c => time >= c.startTime && time <= c.endTime);
    if (currentCaption) {
      ctx.save();
      const style = currentCaption.style;
      const fontSize = (style.fontSize || 24) * (height / 1080); // Scale with resolution
      const fontColor = style.fontColor || '#ffffff';
      const bgColor = style.backgroundColor || '#000000';
      const bgOpacity = style.backgroundOpacity ?? 0.7;
      const position = style.position || 'bottom';

      ctx.font = `bold ${fontSize}px ${style.fontFamily || 'Inter'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = currentCaption.text;
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.4;

      let y = height * 0.85;
      if (position === 'top') y = height * 0.15;
      if (position === 'center') y = height * 0.5;

      if (bgOpacity > 0) {
        ctx.fillStyle = bgColor;
        ctx.globalAlpha = bgOpacity;
        ctx.fillRect((width - textWidth) / 2 - 20, y - textHeight / 2, textWidth + 40, textHeight);
      }

      ctx.globalAlpha = 1.0;
      ctx.fillStyle = fontColor;
      ctx.fillText(text, width / 2, y);
      ctx.restore();
    }
  }, [clips, captions, backgroundType, backgroundUrl, gradientColors, getClipMediaUrl]);

  useImperativeHandle(ref, () => ({
    renderFrame,
    getCanvas: () => canvasRef.current,
  }), [renderFrame]);

  // Sync audio playback
  useEffect(() => {
    clips.forEach(clip => {
      if (clip.type === 'audio') {
        const audio = audioRefs.current.get(clip.id);
        if (audio) {
          const isActive = currentTime >= clip.startTime && currentTime < (clip.startTime + clip.duration);
          if (isActive) {
            const clipTime = currentTime - clip.startTime + clip.inPoint;
            if (Math.abs(audio.currentTime - clipTime) > 0.15) {
              audio.currentTime = clipTime;
            }
            if (isPlaying && audio.paused) {
              audio.play().catch(() => null);
            } else if (!isPlaying && !audio.paused) {
              audio.pause();
            }
            audio.muted = isMuted;
            audio.volume = clip.properties.volume ?? 1;
          } else if (!audio.paused) {
            audio.pause();
          }
        }
      }
    });
  }, [clips, currentTime, isPlaying, isMuted]);

  // Main Preview loop
  useEffect(() => {
    if (isPlaying) {
      const loop = () => {
        renderFrame(currentTime);
        animationFrameRef.current = requestAnimationFrame(loop);
      };
      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      renderFrame(currentTime);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, renderFrame]);

  return (
    <div className={`relative bg-black flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        className="w-full h-full object-contain"
      />
      
      <div className="hidden">
        {clips.map(clip => {
          if (clip.type === 'video') {
            return (
              <video
                key={clip.id}
                ref={el => { if (el) videoRefs.current.set(clip.id, el); }}
                src={getClipMediaUrl(clip)}
                crossOrigin="anonymous"
              />
            );
          }
          if (clip.type === 'audio') {
            return (
              <audio
                key={clip.id}
                ref={el => { if (el) audioRefs.current.set(clip.id, el); }}
                src={getClipMediaUrl(clip)}
                crossOrigin="anonymous"
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
});

VideoPreviewCanvas.displayName = 'VideoPreviewCanvas';
