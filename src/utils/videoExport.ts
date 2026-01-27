import { DESIGN_TOKENS } from '../constants/designTokens';

export interface ExportConfig {
  width: number;
  height: number;
  fps: number;
  videoBitrate: number;
  audioBitrate: number;
  format: 'webm';
}
export interface ExportProgress {
  phase: 'preparing' | 'rendering' | 'encoding' | 'complete';
  progress: number;
  currentFrame: number;
  totalFrames: number;
}
export const EXPORT_PRESETS: Record<string, ExportConfig> = {
  tiktok: { width: 1080, height: 1920, fps: 30, videoBitrate: 20000000, audioBitrate: 192000, format: 'webm' },
  youtube: { width: 1920, height: 1080, fps: 30, videoBitrate: 25000000, audioBitrate: 256000, format: 'webm' },
  instagram: { width: 1080, height: 1080, fps: 30, videoBitrate: 20000000, audioBitrate: 192000, format: 'webm' },
};
export const DEFAULT_EXPORT_CONFIG: ExportConfig = EXPORT_PRESETS.tiktok;
// Try different codecs in order of preference
export const getSupportedMimeType = (): string => {
  const codecs = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  
  for (const codec of codecs) {
    if (MediaRecorder.isTypeSupported(codec)) {
      return codec;
    }
  }
  
  // Fallback to basic webm
  return 'video/webm';
};

// For backward compatibility, export a constant that calls the function
export const WEBM_MIME_TYPE = 'video/webm;codecs=vp9'; // Default, but use getSupportedMimeType() in code
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadFileFromUrl = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
export const generateFilename = (prefix: string, format: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.${format}`;
};
export const estimateFileSize = (durationSeconds: number, videoBitrate: number, audioBitrate: number): number => {
  const totalBitrate = videoBitrate + audioBitrate;
  return (totalBitrate * durationSeconds) / 8 / 1024 / 1024;
};
export const isWebMSupported = (): boolean => {
  return MediaRecorder.isTypeSupported('video/webm') || 
         MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
         MediaRecorder.isTypeSupported('video/webm;codecs=vp9');
};
export const createMediaRecorder = (
  stream: MediaStream,
  config: ExportConfig,
  onDataAvailable: (chunk: Blob) => void,
  onStop: () => void,
  onError: (error: Error) => void
): MediaRecorder => {
  if (!isWebMSupported()) {
    throw new Error('WebM format not supported in this browser');
  }
  const mimeType = getSupportedMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: config.videoBitrate,
    audioBitsPerSecond: config.audioBitrate,
  });
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      onDataAvailable(e.data);
    }
  };
  recorder.onstop = onStop;
  recorder.onerror = () => onError(new Error('MediaRecorder error'));
  return recorder;
};
export const drawVideoToCanvas = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number
): void => {
  ctx.fillStyle = DESIGN_TOKENS.colors.canvas;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  if (video.readyState < 2) return;
  const videoAspect = video.videoWidth / video.videoHeight;
  const canvasAspect = canvasWidth / canvasHeight;
  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let drawX = 0;
  let drawY = 0;
  if (videoAspect > canvasAspect) {
    drawHeight = canvasWidth / videoAspect;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * videoAspect;
    drawX = (canvasWidth - drawWidth) / 2;
  }
  ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
};
export const drawSubtitleToCanvas = (
  ctx: CanvasRenderingContext2D,
  text: string,
  options: {
    x: number;
    y: number;
    font: string;
    fontSize: number;
    color: string;
    strokeColor: string;
    strokeWidth: number;
  }
): void => {
  ctx.font = `bold ${options.fontSize}px ${options.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = options.color;
  if (options.strokeWidth > 0) {
    ctx.strokeStyle = options.strokeColor;
    ctx.lineWidth = options.strokeWidth;
    ctx.strokeText(text, options.x, options.y);
  }
  ctx.fillText(text, options.x, options.y);
};
/**
 * Wait for canvas to be fully painted after rendering
 * Balanced delay for smooth rendering without excessive wait
 */
const waitForCanvasPaint = (): Promise<void> => {
  return new Promise((resolve) => {
    // Double RAF ensures layout and paint are complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Reduced delay for faster rendering - 16ms is one frame at 60fps
        setTimeout(resolve, 16);
      });
    });
  });
};

export const createVideoBlob = async (
  canvas: HTMLCanvasElement,
  audioContext: AudioContext | null,
  durationMs: number,
  config: ExportConfig,
  onProgress: (progress: ExportProgress) => void,
  renderFrame: (currentTimeSeconds: number) => Promise<void> | void,
  audioDestination?: MediaStreamAudioDestinationNode | null
): Promise<Blob> => {
  console.log('🎬 Starting video blob creation', { durationMs, config });

  if (!isWebMSupported()) {
    throw new Error('WebM format not supported in this browser');
  }

  // Ensure FPS is valid and within reasonable bounds
  const fps = Math.max(1, Math.min(60, Math.round(config.fps)));
  const frameIntervalMs = 1000 / fps; // Exact time per frame in milliseconds
  const durationSeconds = durationMs / 1000;
  const totalFrames = Math.ceil(durationSeconds * fps);

  console.log('📊 Video export params:', { fps, durationSeconds, totalFrames, frameIntervalMs });
  
  // Create canvas stream with explicit frame rate
  const stream = canvas.captureStream(fps);
  
  // Set frame rate constraint on video track if supported
  const videoTracks = stream.getVideoTracks();
  if (videoTracks.length > 0) {
    const videoTrack = videoTracks[0];
    // Try to apply frame rate constraint
    try {
      if (videoTrack.applyConstraints) {
        videoTrack.applyConstraints({
          frameRate: { ideal: fps, max: fps }
        }).catch(() => {
          // Ignore if constraints not supported
        });
      }
    } catch (e) {
      // Ignore constraint errors
    }
  }
  
  // Add audio tracks if available
  if (audioDestination) {
    const audioTracks = audioDestination.stream.getAudioTracks();
    audioTracks.forEach(track => {
      stream.addTrack(track);
    });
  } else if (audioContext) {
    // Fallback: create destination if not provided
    const destination = audioContext.createMediaStreamDestination();
    const audioTracks = destination.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      stream.addTrack(audioTracks[0]);
    }
  }
  
  const mimeType = getSupportedMimeType();
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: config.videoBitrate,
    audioBitsPerSecond: config.audioBitrate,
  });
  
  const chunks: Blob[] = [];
  let isStopped = false;
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      if (isStopped) return;
      isStopped = true;
      
      onProgress({ phase: 'encoding', progress: 90, currentFrame: totalFrames, totalFrames });
      
      // Wait a bit to ensure all chunks are collected
      setTimeout(() => {
        try {
          const blob = new Blob(chunks, { type: mimeType });
          
          // Validate blob
          if (blob.size === 0) {
            reject(new Error('Exported video is empty. Please check your video sources.'));
            return;
          }
          
          onProgress({ phase: 'complete', progress: 100, currentFrame: totalFrames, totalFrames });
          resolve(blob);
        } catch (error) {
          reject(new Error(`Failed to create video blob: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      }, 100);
    };
    
    // Store timeout and animation frame IDs for cleanup
    let timeoutId: number | null = null;
    let animationFrameId: number | null = null;
    
    const cleanup = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };
    
    mediaRecorder.onerror = (event) => {
      cleanup();
      const error = event.error || new Error('MediaRecorder error during recording');
      reject(error);
    };
    
    onProgress({ phase: 'rendering', progress: 0, currentFrame: 0, totalFrames });
    
    // Use timeslice that matches frame interval for proper synchronization
    const timeslice = Math.max(frameIntervalMs, 100);
    mediaRecorder.start(timeslice);
    
    // Wait for MediaRecorder to be ready
    setTimeout(async () => {
      // Validate stream and MediaRecorder state
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        cleanup();
        reject(new Error('No video tracks in stream. Canvas capture may have failed.'));
        return;
      }
      
      if (mediaRecorder.state !== 'recording') {
        cleanup();
        reject(new Error('MediaRecorder failed to start recording.'));
        return;
      }
      
      // Render initial frame
      const renderResult = renderFrame(0);
      if (renderResult instanceof Promise) {
        await renderResult;
      }
      
      // Fixed frame loop with consistent intervals
      // Use frame-based timing to eliminate drift
      let frameNumber = 0;
      
      const renderNextFrame = async () => {
        // Calculate exact time for this frame (frame-based, no drift)
        const currentTimeSeconds = (frameNumber * frameIntervalMs) / 1000;

        if (currentTimeSeconds >= durationSeconds) {
          // Render final frame at exact duration
          const renderResult = renderFrame(durationSeconds);
          if (renderResult instanceof Promise) {
            await renderResult;
          }

          // Request final data before stopping
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.requestData();
          }

          // Small delay to ensure last frame is captured
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
            }
          }, 100);

          cleanup();
          return;
        }

        // Render frame at exact time
        const renderResult = renderFrame(currentTimeSeconds);
        if (renderResult instanceof Promise) {
          await renderResult;
        }

        // CRITICAL: Wait for canvas paint before MediaRecorder captures
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        frameNumber++;

        // Update progress
        const progress = Math.min((currentTimeSeconds / durationSeconds) * 80, 80);
        const currentFrame = Math.min(frameNumber, totalFrames);
        onProgress({ phase: 'rendering', progress, currentFrame, totalFrames });

        // Schedule next frame at exact interval (frame-based timing)
        timeoutId = window.setTimeout(renderNextFrame, frameIntervalMs);
      };
      
      // Start frame rendering loop with fixed interval
      timeoutId = window.setTimeout(renderNextFrame, frameIntervalMs);
    }, 100);
  });
};
export const getExportPreset = (preset: string): ExportConfig => {
  return EXPORT_PRESETS[preset.toLowerCase()] || EXPORT_PRESETS.tiktok;
};