import { useCallback, useRef } from 'react';
import type { TextStoryState } from './types';
import {
  downloadBlob,
  generateFilename,
  isWebMSupported,
  WEBM_MIME_TYPE,
  DEFAULT_EXPORT_CONFIG,
  drawVideoToCanvas,
} from '../../../../utils/videoExport';
import { ASSETS_THUMBNAILS } from './constants';
import { addProjectToLibrary } from '../../../pages/library';
import {
  calculateMessageLayouts,
  calculateCardLayout,
  getColorScheme,
  drawCardBackground,
  drawMessageBubbles,
  drawCardHeader,
  findCurrentMessageIndex,
} from './exportHelpers';
interface UseTextStoryExportProps {
  state: TextStoryState;
  setState: React.Dispatch<React.SetStateAction<TextStoryState>>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}
export const useTextStoryExport = ({
  state,
  setState,
  videoRef,
}: UseTextStoryExportProps) => {
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
    try {
      const videoSource = audioCtx.createMediaElementSource(video);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = state.isMuted ? 0 : 1;
      videoSource.connect(gainNode);
      gainNode.connect(dest);
      gainNode.connect(audioCtx.destination);
      sourceNodes.push(videoSource);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Unknown error';
      if (!error.includes('already connected')) {
        setState(prev => ({ ...prev, validationError: `Audio capture failed: ${error}` }));
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
        isExporting: false, exportProgress: 100, 
        exportedBlob: blob 
      }));
      audioCtx.close();
    };
    mediaRecorder.onerror = () => {
      setState(prev => ({ ...prev, isExporting: false, validationError: 'Export failed' }));
      audioCtx.close();
    };
    video.currentTime = 0;
    await video.play();
    mediaRecorder.start(100);
    const renderFrame = () => {
      if (!video.paused && !video.ended) {
        drawVideoToCanvas(ctx, video, canvas.width, canvas.height);
        const messagesWithContent = state.messages.filter(m => m.content.trim());
        const { index: currentMessageIndex, startTime: currentMessageStartTime } = 
          findCurrentMessageIndex(messagesWithContent, video.currentTime);
        const visibleMessages = messagesWithContent.slice(0, currentMessageIndex + 1);
        const messageLayouts = calculateMessageLayouts(ctx, visibleMessages, canvas.width * 0.9, canvas.width * 0.05);
        const cardLayout = calculateCardLayout(canvas.width, canvas.height, messageLayouts);
        const colorScheme = getColorScheme(state.darkMode, state.selectedTemplate);
        drawCardBackground(ctx, cardLayout, colorScheme);
        drawMessageBubbles(
          ctx,
          messageLayouts,
          visibleMessages,
          cardLayout,
          colorScheme,
          state.selectedTemplate,
          video.currentTime,
          currentMessageStartTime
        );
        drawCardHeader(ctx, cardLayout, colorScheme, state.contactName, state.darkMode);
        const progress = (video.currentTime / video.duration) * 100;
        setState(prev => ({ ...prev, exportProgress: Math.min(progress, 95) }));
        requestAnimationFrame(renderFrame);
      } else if (video.ended) {
        mediaRecorder.stop();
        video.pause();
        audioCtx.close();
      }
    };
    renderFrame();
  }, [state.messages, state.selectedTemplate, state.darkMode, state.contactName, state.isMuted, videoRef, setState]);
  const handleDownloadExported = useCallback(() => {
    if (state.exportedBlob) {
      const filename = generateFilename('text_story', 'webm');
      downloadBlob(state.exportedBlob, filename);
      const firstMessage = state.messages.find(m => m.content.trim());
      addProjectToLibrary({
        title: firstMessage?.content.slice(0, 30) || 'Text Story',
        thumbnail: ASSETS_THUMBNAILS.CHAT,
        status: 'render-successful',
        type: 'text-story',
        videoUrl: URL.createObjectURL(state.exportedBlob),
      });
    }
  }, [state.exportedBlob, state.messages]);
  return {
    handleExportVideo,
    handleDownloadExported,
  };
};