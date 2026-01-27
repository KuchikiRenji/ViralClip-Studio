import { ffmpegEngine, type ExportQuality } from '../../../../lib/ffmpegEngine';

type DrawOverlay = (ctx: CanvasRenderingContext2D, elapsedSeconds: number) => void;

export interface CanvasAudioTrack {
  url: string;
  volume: number;
  startTimeSeconds: number;
  loop: boolean;
}

export interface RecordCanvasVideoOptions {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  backgroundVideoUrl: string;
  overlay: DrawOverlay;
  audioTracks: CanvasAudioTrack[];
  onProgress?: (percent: number) => void;
}

export interface RecordCanvasVideoWithVideosOptions {
  width: number;
  height: number;
  fps: number;
  durationSeconds: number;
  videos: { id: string; url: string; loop: boolean; muted: boolean }[];
  render: (ctx: CanvasRenderingContext2D, elapsedSeconds: number, videos: Record<string, HTMLVideoElement>) => void;
  audioTracks: CanvasAudioTrack[];
  onProgress?: (percent: number) => void;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const pickRecorderMimeType = () => {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const mimeType of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) return mimeType;
  }
  return '';
};

const fetchToObjectUrl = async (url: string) => {
  if (url.startsWith('blob:')) return url;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch media.');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

const waitForMediaReady = (el: HTMLMediaElement) =>
  new Promise<void>((resolve, reject) => {
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('Failed to load media.'));
    };
    const cleanup = () => {
      el.removeEventListener('canplay', handleReady);
      el.removeEventListener('loadedmetadata', handleReady);
      el.removeEventListener('error', handleError);
    };
    el.addEventListener('canplay', handleReady, { once: true });
    el.addEventListener('loadedmetadata', handleReady, { once: true });
    el.addEventListener('error', handleError, { once: true });
  });

export const recordCanvasVideo = async (options: RecordCanvasVideoOptions): Promise<Blob> => {
  const width = clamp(Math.round(options.width), 2, 4096);
  const height = clamp(Math.round(options.height), 2, 4096);
  const fps = clamp(Math.round(options.fps), 12, 60);
  const durationSeconds = Math.max(1, options.durationSeconds);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported.');
  }

  const backgroundUrl = await fetchToObjectUrl(options.backgroundVideoUrl);
  const bgVideo = document.createElement('video');
  bgVideo.src = backgroundUrl;
  bgVideo.muted = true;
  bgVideo.loop = true;
  bgVideo.playsInline = true;
  bgVideo.preload = 'auto';
  await waitForMediaReady(bgVideo);

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  const objectUrlsToRevoke: string[] = [];
  const audioElements: HTMLAudioElement[] = [];
  const scheduledAudioTracks: CanvasAudioTrack[] = [];
  const mediaSources: MediaElementAudioSourceNode[] = [];

  for (const track of options.audioTracks) {
    try {
      const trackUrl = await fetchToObjectUrl(track.url);
      if (!track.url.startsWith('blob:')) objectUrlsToRevoke.push(trackUrl);
      const audio = document.createElement('audio');
      audio.src = trackUrl;
      audio.preload = 'auto';
      audio.loop = track.loop;
      await waitForMediaReady(audio);
      const source = audioContext.createMediaElementSource(audio);
      const gain = audioContext.createGain();
      gain.gain.value = clamp(track.volume, 0, 1);
      source.connect(gain).connect(destination);
      audioElements.push(audio);
      scheduledAudioTracks.push(track);
      mediaSources.push(source);
    } catch {
      continue;
    }
  }

  const videoStream = canvas.captureStream(fps);
  const combined = new MediaStream([...videoStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);

  const mimeType = pickRecorderMimeType();
  // Increased bitrate for better quality (20 Mbps video, 192 kbps audio)
  const recorder = new MediaRecorder(combined, mimeType ? {
    mimeType,
    videoBitsPerSecond: 20000000,
    audioBitsPerSecond: 192000
  } : undefined);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Recording failed.'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  const startedAt = performance.now();
  let raf = 0;

  const drawFrame = () => {
    const elapsed = (performance.now() - startedAt) / 1000;
    const bounded = Math.min(elapsed, durationSeconds);
    ctx.drawImage(bgVideo, 0, 0, width, height);
    options.overlay(ctx, bounded);

    const p = clamp((bounded / durationSeconds) * 100, 0, 100);
    options.onProgress?.(p);

    if (bounded >= durationSeconds) return;
    raf = requestAnimationFrame(drawFrame);
  };

  await audioContext.resume();
  recorder.start(200);
  await bgVideo.play().catch(() => undefined);

  for (let i = 0; i < audioElements.length; i++) {
    const audio = audioElements[i];
    const track = scheduledAudioTracks[i];
    const delay = Math.max(0, track.startTimeSeconds) * 1000;
    setTimeout(() => void audio.play().catch(() => undefined), delay);
  }

  raf = requestAnimationFrame(drawFrame);

  setTimeout(() => {
    cancelAnimationFrame(raf);
    recorder.stop();
    bgVideo.pause();
    audioElements.forEach((a) => a.pause());
  }, durationSeconds * 1000);

  try {
    return await stopPromise;
  } finally {
    videoStream.getTracks().forEach((t) => t.stop());
    destination.stream.getTracks().forEach((t) => t.stop());
    mediaSources.forEach((s) => s.disconnect());
    audioContext.close().catch(() => undefined);
    if (!options.backgroundVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(backgroundUrl);
    }
    objectUrlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
  }
};

export const recordCanvasVideoWithVideos = async (options: RecordCanvasVideoWithVideosOptions): Promise<Blob> => {
  const width = clamp(Math.round(options.width), 2, 4096);
  const height = clamp(Math.round(options.height), 2, 4096);
  const fps = clamp(Math.round(options.fps), 12, 60);
  const durationSeconds = Math.max(1, options.durationSeconds);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported.');

  const objectUrlsToRevoke: string[] = [];
  const videosById: Record<string, HTMLVideoElement> = {};
  for (const v of options.videos) {
    const src = await fetchToObjectUrl(v.url);
    if (!v.url.startsWith('blob:')) objectUrlsToRevoke.push(src);
    const video = document.createElement('video');
    video.src = src;
    video.loop = v.loop;
    video.muted = v.muted;
    video.playsInline = true;
    video.preload = 'auto';
    // Add crossOrigin for external URLs to avoid CORS issues
    if (v.url.startsWith('http://') || v.url.startsWith('https://')) {
      video.crossOrigin = 'anonymous';
    }
    // Make video visible (but off-screen) so browsers render it properly
    // Some browsers require video elements to be in the DOM to render frames
    video.style.position = 'absolute';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    document.body.appendChild(video);
    await waitForMediaReady(video);
    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      document.body.removeChild(video);
      throw new Error(`Video ${v.id} has invalid dimensions`);
    }
    videosById[v.id] = video;
  }

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  const audioObjectUrlsToRevoke: string[] = [];
  const audioElements: HTMLAudioElement[] = [];
  const scheduledAudioTracks: CanvasAudioTrack[] = [];
  const mediaSources: MediaElementAudioSourceNode[] = [];

  for (const track of options.audioTracks) {
    try {
      const trackUrl = await fetchToObjectUrl(track.url);
      if (!track.url.startsWith('blob:')) audioObjectUrlsToRevoke.push(trackUrl);
      const audio = document.createElement('audio');
      audio.src = trackUrl;
      audio.preload = 'auto';
      audio.loop = track.loop;
      await waitForMediaReady(audio);
      const source = audioContext.createMediaElementSource(audio);
      const gain = audioContext.createGain();
      gain.gain.value = clamp(track.volume, 0, 1);
      source.connect(gain).connect(destination);
      audioElements.push(audio);
      scheduledAudioTracks.push(track);
      mediaSources.push(source);
    } catch {
      continue;
    }
  }

  const videoStream = canvas.captureStream(fps);
  const combined = new MediaStream([...videoStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);

  const mimeType = pickRecorderMimeType();
  // Increased bitrate for better quality (20 Mbps video, 192 kbps audio)
  const recorder = new MediaRecorder(combined, mimeType ? {
    mimeType,
    videoBitsPerSecond: 20000000,
    audioBitsPerSecond: 192000
  } : undefined);
  const chunks: BlobPart[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('Recording failed.'));
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
  });

  const startedAt = performance.now();
  let raf = 0;
  const drawFrame = () => {
    const elapsed = (performance.now() - startedAt) / 1000;
    const bounded = Math.min(elapsed, durationSeconds);

    options.render(ctx, bounded, videosById);

    const p = clamp((bounded / durationSeconds) * 100, 0, 100);
    options.onProgress?.(p);

    if (bounded >= durationSeconds) return;
    raf = requestAnimationFrame(drawFrame);
  };

  await audioContext.resume();
  
  // Start all videos playing and wait for them to be ready
  await Promise.all(Object.values(videosById).map(async (v) => {
    try {
      // Set initial time to 0
      v.currentTime = 0;
      // Wait for video to be ready
      if (v.readyState < 2) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video load timeout')), 10000);
          const checkReady = () => {
            if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
              clearTimeout(timeout);
              v.removeEventListener('loadeddata', checkReady);
              v.removeEventListener('canplay', checkReady);
              resolve();
            }
          };
          v.addEventListener('loadeddata', checkReady);
          v.addEventListener('canplay', checkReady);
          // Also check immediately in case it's already ready
          if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
            clearTimeout(timeout);
            resolve();
          }
        });
      }
      // Start playing
      await v.play();
      // Wait for first frame to be available
      await new Promise<void>((resolve) => {
        if (v.readyState >= 3) {
          // HAVE_FUTURE_DATA - frame is ready
          resolve();
        } else {
          const onCanPlay = () => {
            v.removeEventListener('canplay', onCanPlay);
            resolve();
          };
          v.addEventListener('canplay', onCanPlay, { once: true });
          // Fallback timeout
          setTimeout(resolve, 200);
        }
      });
    } catch (e) {
      console.warn('Video play failed:', e);
    }
  }));
  
  // Additional delay to ensure videos have rendered frames
  await new Promise(resolve => setTimeout(resolve, 200));
  
  recorder.start(200);

  for (let i = 0; i < audioElements.length; i++) {
    const audio = audioElements[i];
    const track = scheduledAudioTracks[i];
    const delay = Math.max(0, track.startTimeSeconds) * 1000;
    setTimeout(() => void audio.play().catch(() => undefined), delay);
  }

  raf = requestAnimationFrame(drawFrame);

  setTimeout(() => {
    cancelAnimationFrame(raf);
    recorder.stop();
    Object.values(videosById).forEach((v) => v.pause());
    audioElements.forEach((a) => a.pause());
  }, durationSeconds * 1000);

  try {
    return await stopPromise;
  } finally {
    videoStream.getTracks().forEach((t) => t.stop());
    destination.stream.getTracks().forEach((t) => t.stop());
    mediaSources.forEach((s) => s.disconnect());
    audioContext.close().catch(() => undefined);
    // Remove video elements from DOM
    Object.values(videosById).forEach((v) => {
      if (v.parentNode) {
        v.parentNode.removeChild(v);
      }
    });
    objectUrlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
    audioObjectUrlsToRevoke.forEach((u) => URL.revokeObjectURL(u));
  }
};

export const transcodeWebmToMp4 = async (input: Blob, quality: ExportQuality, fps: number) => {
  const result = await ffmpegEngine.exportVideo(input, { format: 'mp4', quality, fps, includeAudio: true });
  if (!result) {
    const err = ffmpegEngine.getState().error ?? 'Export failed';
    throw new Error(err);
  }
  return result;
};


