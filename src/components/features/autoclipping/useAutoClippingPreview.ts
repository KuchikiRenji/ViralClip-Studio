import { useCallback, useEffect } from 'react';
import { RefObject } from 'react';
import { AutoClippingState } from './useAutoClippingState';
import { GeneratedClip } from './clipHelpers';
import { downloadBlob, generateFilename, drawVideoToCanvas } from '../../../utils/videoExport';
interface UseAutoClippingPreviewProps {
  state: AutoClippingState;
  updateState: (updates: Partial<AutoClippingState>) => void;
  previewVideoRef: RefObject<HTMLVideoElement>;
}
export const useAutoClippingPreview = ({
  state,
  updateState,
  previewVideoRef,
}: UseAutoClippingPreviewProps) => {
  useEffect(() => {
    const video = previewVideoRef.current;
    if (!video || !state.previewClip) return;
    const handleTimeUpdate = () => {
      updateState({
        currentTime: video.currentTime - state.previewClip!.startTimeSeconds,
      });
      if (video.currentTime >= state.previewClip!.endTimeSeconds) {
        video.pause();
        video.currentTime = state.previewClip!.startTimeSeconds;
        updateState({ isPlaying: false });
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [state.previewClip, previewVideoRef, updateState]);
  const handlePreviewClip = useCallback((clip: GeneratedClip) => {
    updateState({
      previewClip: clip,
      currentTime: 0,
      isPlaying: false,
    });
    const video = previewVideoRef.current;
    if (video && state.uploadedVideoUrl) {
      video.currentTime = clip.startTimeSeconds;
    }
  }, [state.uploadedVideoUrl, previewVideoRef, updateState]);
  const handlePlayPausePreview = useCallback(() => {
    const video = previewVideoRef.current;
    if (!video || !state.previewClip) return;
    if (state.isPlaying) {
      video.pause();
    } else {
      if (video.currentTime >= state.previewClip.endTimeSeconds) {
        video.currentTime = state.previewClip.startTimeSeconds;
      }
      video.play();
    }
    updateState({ isPlaying: !state.isPlaying });
  }, [state.isPlaying, state.previewClip, previewVideoRef, updateState]);
  const extractClip = useCallback(async (clip: GeneratedClip): Promise<Blob | null> => {
    if (!state.uploadedVideoUrl) return null;
    const video = document.createElement('video');
    video.src = state.uploadedVideoUrl;
    video.crossOrigin = "anonymous";
    video.muted = false;
    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
      video.load();
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const source = audioCtx.createMediaElementSource(video);
    source.connect(dest);
    source.connect(audioCtx.destination);
    const clipDuration = (clip.endTimeSeconds - clip.startTimeSeconds) * 1000;
    const videoStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ]);
    const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000
    });
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    return new Promise(async (resolve) => {
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            audioCtx.close();
            resolve(blob);
        };
        video.currentTime = clip.startTimeSeconds;
        await new Promise<void>(r => { video.onseeked = () => r(); });
        await video.play();
        mediaRecorder.start();
        const renderFrame = () => {
            if (video.currentTime >= clip.endTimeSeconds || video.ended) {
                mediaRecorder.stop();
                video.pause();
                return;
            }
            drawVideoToCanvas(ctx, video, canvas.width, canvas.height);
            requestAnimationFrame(renderFrame);
        };
        renderFrame();
    });
  }, [state.uploadedVideoUrl]);
  const handleDownloadSelected = useCallback(async () => {
    if (state.selectedClips.size === 0) return;
    updateState({ isExtracting: true, extractionProgress: 0 });
    const clipsToDownload = state.generatedClips.filter(c => state.selectedClips.has(c.id));
    let completed = 0;
    for (const clip of clipsToDownload) {
      const blob = await extractClip(clip);
      if (blob) {
        downloadBlob(blob, generateFilename(`viral_clip_${clip.id}`, 'webm'));
      }
      completed++;
      updateState({ extractionProgress: (completed / clipsToDownload.length) * 100 });
    }
    updateState({ isExtracting: false });
  }, [state.selectedClips, state.generatedClips, extractClip, updateState]);
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.previewClip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const clipDuration = state.previewClip.endTimeSeconds - state.previewClip.startTimeSeconds;
    const newTime = percentage * clipDuration;
    updateState({ currentTime: newTime });
    const video = previewVideoRef.current;
    if (video) {
      video.currentTime = state.previewClip.startTimeSeconds + newTime;
    }
  }, [state.previewClip, previewVideoRef, updateState]);
  return {
    handlePreviewClip,
    handlePlayPausePreview,
    handleDownloadSelected,
    handleProgressClick,
    extractClip,
  };
};







