import { useCallback, useRef, useState } from 'react';
import type { TemplateBuilderState, Message } from './types';
import {
  downloadBlob,
  generateFilename,
  isWebMSupported,
  WEBM_MIME_TYPE,
} from '../../../../utils/videoExport';
import { ASSETS_THUMBNAILS } from './constants';
import { addProjectToLibrary } from '../../../pages/library';
import { DESIGN_TOKENS } from '../../../../constants/designTokens';
import {
  calculateMessageLayouts,
  calculateCardLayout,
  getColorScheme,
  drawCardBackground,
  drawMessageBubbles,
  drawCardHeader,
} from './exportHelpers';

interface UseTemplateBuilderExportProps {
  state: TemplateBuilderState;
}

interface ExportState {
  isExporting: boolean;
  exportProgress: number;
  exportedBlob: Blob | null;
  exportError: string | null;
}

const RESOLUTION_MAP = {
  '720p': { width: 720, height: 1280 },
  '1080p': { width: 1080, height: 1920 },
  '4k': { width: 2160, height: 3840 },
};

const calculateTotalDuration = (
  messages: Message[],
  timingConfig: TemplateBuilderState['timingConfig']
): number => {
  let total = 0;
  messages.forEach((message) => {
    const delay = message.delay || timingConfig.messageDelay;
    const typingDuration = (message.content.length / (message.typingSpeed || timingConfig.typingSpeed)) * 1000;
    const readDelay = timingConfig.readDelay;
    total += delay + typingDuration + readDelay;
  });
  return Math.max(total, 3000);
};

const findCurrentMessageIndexForExport = (
  messages: Message[],
  currentTimeMs: number,
  timingConfig: TemplateBuilderState['timingConfig']
): { index: number; startTime: number } => {
  let accumulatedTime = 0;
  let foundIndex = -1;
  let startTime = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const delay = msg.delay || timingConfig.messageDelay;
    const typingDuration = (msg.content.length / (msg.typingSpeed || timingConfig.typingSpeed)) * 1000;
    const readDelay = timingConfig.readDelay;
    const messageTotalTime = delay + typingDuration + readDelay;

    if (currentTimeMs >= accumulatedTime) {
      foundIndex = i;
      startTime = accumulatedTime;
    }

    accumulatedTime += messageTotalTime;
  }

  return { index: foundIndex, startTime };
};

export const useTemplateBuilderExport = ({ state }: UseTemplateBuilderExportProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    exportProgress: 0,
    exportedBlob: null,
    exportError: null,
  });

  const cancelExport = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setExportState({
      isExporting: false,
      exportProgress: 0,
      exportedBlob: null,
      exportError: null,
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (!state.selectedTemplate || state.messages.length === 0) {
      setExportState(prev => ({
        ...prev,
        exportError: 'Please select a template and add messages before exporting',
      }));
      return;
    }

    if (!isWebMSupported()) {
      setExportState(prev => ({
        ...prev,
        exportError: 'WebM export is not supported in this browser. Please use Chrome or Firefox.',
      }));
      return;
    }

    setExportState({
      isExporting: true,
      exportProgress: 0,
      exportedBlob: null,
      exportError: null,
    });

    chunksRef.current = [];

    const resolution = RESOLUTION_MAP[state.exportConfig.resolution];
    const fps = state.exportConfig.frameRate;
    const videoBitrate = state.exportConfig.resolution === '4k' ? 15000000 : 
                         state.exportConfig.resolution === '1080p' ? 8000000 : 5000000;

    const canvas = document.createElement('canvas');
    canvas.width = resolution.width;
    canvas.height = resolution.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setExportState(prev => ({
        ...prev,
        isExporting: false,
        exportError: 'Failed to create canvas context',
      }));
      return;
    }

    const totalDurationMs = calculateTotalDuration(state.messages, state.timingConfig);
    const messagesWithContent = state.messages.filter(m => m.content.trim());

    const videoStream = canvas.captureStream(fps);
    
    const mediaRecorder = new MediaRecorder(videoStream, {
      mimeType: WEBM_MIME_TYPE,
      videoBitsPerSecond: videoBitrate,
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setExportState({
        isExporting: false,
        exportProgress: 100,
        exportedBlob: blob,
        exportError: null,
      });
    };

    mediaRecorder.onerror = () => {
      setExportState({
        isExporting: false,
        exportProgress: 0,
        exportedBlob: null,
        exportError: 'Export failed during recording',
      });
    };

    mediaRecorder.start(100);

    const startTime = performance.now();
    const templatePlatform = state.selectedTemplate.platform;
    const contactName = state.participants[1]?.name || 'Contact';
    const darkMode = false;

    const renderFrame = () => {
      const elapsed = performance.now() - startTime;
      const currentTimeMs = elapsed;

      if (elapsed >= totalDurationMs) {
        mediaRecorder.stop();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }

      ctx.fillStyle = DESIGN_TOKENS.colors.background.primary;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { index: currentMessageIndex, startTime: messageStartTime } = 
        findCurrentMessageIndexForExport(messagesWithContent, currentTimeMs, state.timingConfig);

      const visibleMessages = messagesWithContent.slice(0, currentMessageIndex + 1);
      const messageLayouts = calculateMessageLayouts(ctx, visibleMessages, canvas.width * 0.9, canvas.width * 0.05);
      const cardLayout = calculateCardLayout(canvas.width, canvas.height, messageLayouts);
      const colorScheme = getColorScheme(darkMode, templatePlatform);

      drawCardBackground(ctx, cardLayout, colorScheme);
      drawMessageBubbles(
        ctx,
        messageLayouts,
        visibleMessages,
        cardLayout,
        colorScheme,
        templatePlatform,
        currentTimeMs / 1000,
        messageStartTime / 1000
      );
      drawCardHeader(ctx, cardLayout, colorScheme, contactName, darkMode);

      if (state.exportConfig.watermark) {
        const WATERMARK_OPACITY = 0.5;
        const WATERMARK_FONT_SIZE = 20;
        const WATERMARK_PADDING = 20;
        ctx.fillStyle = `rgba(255, 255, 255, ${WATERMARK_OPACITY})`;
        ctx.font = `${WATERMARK_FONT_SIZE}px ${DESIGN_TOKENS.typography.fontFamily.primary}`;
        ctx.textAlign = 'right';
        ctx.fillText(state.exportConfig.watermark, canvas.width - WATERMARK_PADDING, canvas.height - WATERMARK_PADDING);
      }

      const progress = Math.min((elapsed / totalDurationMs) * 100, 99);
      setExportState(prev => ({ ...prev, exportProgress: progress }));

      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, [state]);

  const handleDownload = useCallback(() => {
    if (exportState.exportedBlob) {
      const filename = generateFilename('conversation_story', 'webm');
      downloadBlob(exportState.exportedBlob, filename);

      const firstMessage = state.messages.find(m => m.content.trim());
      addProjectToLibrary({
        title: firstMessage?.content.slice(0, 30) || 'Conversation Story',
        thumbnail: ASSETS_THUMBNAILS.CHAT,
        status: 'render-successful',
        type: 'text-story',
        videoUrl: URL.createObjectURL(exportState.exportedBlob),
      });
    }
  }, [exportState.exportedBlob, state.messages]);

  const resetExport = useCallback(() => {
    setExportState({
      isExporting: false,
      exportProgress: 0,
      exportedBlob: null,
      exportError: null,
    });
  }, []);

  return {
    ...exportState,
    handleExport,
    handleDownload,
    cancelExport,
    resetExport,
  };
};


