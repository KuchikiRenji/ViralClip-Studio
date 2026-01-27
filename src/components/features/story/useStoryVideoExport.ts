import { useCallback, useRef } from 'react';
import type { StoryVideoState } from './StoryVideoTypes';
import {
  WORDS_PER_SECOND,
  MAX_VISIBLE_WORDS,
} from './StoryVideoConstants';
import {
  downloadBlob,
  generateFilename,
  isWebMSupported,
  WEBM_MIME_TYPE,
  DEFAULT_EXPORT_CONFIG,
  drawVideoToCanvas,
  drawSubtitleToCanvas,
} from '../../../utils/videoExport';
import { addProjectToLibrary } from '../../pages/library';
import { ASSETS } from '../../../constants/assets';
interface UseStoryVideoExportProps {
  state: StoryVideoState;
  setState: React.Dispatch<React.SetStateAction<StoryVideoState>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}
export const useStoryVideoExport = ({
  state,
  setState,
  videoRef,
  audioRef,
}: UseStoryVideoExportProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const handleExportVideo = useCallback(async () => {
    if (!videoRef.current) return;
    if (!isWebMSupported()) {
      setState(prev => ({ ...prev, validationError: 'WebM export not supported in this browser' }));
      return;
    }
    setState(prev => ({ ...prev, isExporting: true, exportProgress: 0, exportedBlob: null }));
    chunksRef.current = [];
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = DEFAULT_EXPORT_CONFIG.width;
    canvas.height = DEFAULT_EXPORT_CONFIG.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setState(prev => ({ ...prev, isExporting: false, validationError: 'Canvas not available' }));
      return;
    }
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const sourceNodes: AudioNode[] = [];
    if (audioRef.current && state.backgroundMusicEnabled && !state.isMuted) {
      try {
        const musicSource = audioCtx.createMediaElementSource(audioRef.current);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = state.musicVolume;
        musicSource.connect(gainNode);
        gainNode.connect(dest);
        gainNode.connect(audioCtx.destination);
        sourceNodes.push(musicSource);
        if (audioRef.current.paused) await audioRef.current.play();
      } catch {
        setState(prev => ({ ...prev, backgroundMusicEnabled: false }));
      }
    }
    const videoStream = canvas.captureStream(DEFAULT_EXPORT_CONFIG.fps);
    const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ]);
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: WEBM_MIME_TYPE,
      videoBitsPerSecond: DEFAULT_EXPORT_CONFIG.videoBitrate,
    });
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setState(prev => ({ 
        ...prev, 
        isExporting: false, 
        exportProgress: 100, 
        exportedBlob: blob 
      }));
      audioCtx.close();
    };
    mediaRecorder.onerror = () => {
      setState(prev => ({ ...prev, isExporting: false, validationError: 'Export failed' }));
      audioCtx.close();
    };
    video.currentTime = 0;
    if (audioRef.current) audioRef.current.currentTime = 0;
    await video.play();
    if (audioRef.current && state.backgroundMusicEnabled) {
        try {
            await audioRef.current.play();
        } catch {
          setState(prev => ({ ...prev, backgroundMusicEnabled: false }));
        }
    }
    mediaRecorder.start(100);
    const renderFrame = () => {
      if (!video.paused && !video.ended) {
        drawVideoToCanvas(ctx, video, canvas.width, canvas.height);
        if (state.subtitlesEnabled && state.script) {
          const words = state.script.split(/\s+/).filter(w => w.length > 0);
          const currentWordIndex = Math.floor(video.currentTime * WORDS_PER_SECOND);
          const visibleWords = words.slice(
            Math.max(0, currentWordIndex - 1),
            currentWordIndex + MAX_VISIBLE_WORDS - 1
          ).join(' ');
          const yPos = state.subtitlePosition === 'top' ? 200 :
                       state.subtitlePosition === 'center' ? canvas.height / 2 :
                       canvas.height - 200;
          drawSubtitleToCanvas(ctx, visibleWords, {
            x: canvas.width / 2,
            y: yPos,
            font: state.subtitleFont,
            fontSize: state.subtitleSize * 2,
            color: state.subtitleColor,
            strokeColor: state.strokeColor,
            strokeWidth: state.strokeSize * 2,
          });
        }
        const progress = (video.currentTime / video.duration) * 100;
        setState(prev => ({ ...prev, exportProgress: Math.min(progress, 95) }));
        requestAnimationFrame(renderFrame);
      } else if (video.ended) {
        mediaRecorder.stop();
        video.pause();
        if (audioRef.current) audioRef.current.pause();
      }
    };
    renderFrame();
  }, [state.subtitlesEnabled, state.script, state.subtitleSize, state.subtitleFont, state.subtitleColor, state.strokeColor, state.strokeSize, state.subtitlePosition, state.backgroundMusicEnabled, state.musicVolume, state.isMuted, videoRef, audioRef, setState]);
  const handleDownloadExported = useCallback(() => {
    if (state.exportedBlob) {
      const filename = generateFilename('story_video', 'webm');
      downloadBlob(state.exportedBlob, filename);
      addProjectToLibrary({
        title: state.script.slice(0, 30) || 'Story Video',
        thumbnail: ASSETS.IMAGES.THUMBNAILS.WOLF,
        status: 'render-successful',
        type: 'story-video',
        videoUrl: URL.createObjectURL(state.exportedBlob),
      });
    }
  }, [state.exportedBlob, state.script]);
  return {
    handleExportVideo,
    handleDownloadExported,
  };
};