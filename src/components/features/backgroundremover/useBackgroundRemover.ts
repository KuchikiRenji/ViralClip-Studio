import { useState, useCallback } from 'react';
import { ImageData } from './types';
import type { ProcessingState } from '../../../types/common';
import { SUPPORTED_IMAGE_FORMATS, BACKGROUND_REMOVER_MAX_SIZE_BYTES, BACKGROUND_REMOVER_PROGRESS } from '../../../constants/upload';
import { downloadFileFromUrl } from '../../../utils/videoExport';

export const useBackgroundRemover = () => {
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    errorMessage: null,
  });
  
  const [imageData, setImageData] = useState<ImageData>({
    original: null,
    processed: null,
    fileName: null,
  });

  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as typeof SUPPORTED_IMAGE_FORMATS[number])) {
      return 'Invalid file format. Please use PNG, JPG, or WEBP.';
    }
    if (file.size > BACKGROUND_REMOVER_MAX_SIZE_BYTES) {
      return 'File too large. Maximum size is 10MB.';
    }
    return null;
  }, []);

  const processImage = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setProcessing({ status: 'error', progress: 0, errorMessage: error });
      return;
    }

    setProcessing({ status: 'loading', progress: 0, errorMessage: null });

    const originalUrl = URL.createObjectURL(file);
    setImageData({ original: originalUrl, processed: null, fileName: file.name });

    setProcessing({ status: 'processing', progress: BACKGROUND_REMOVER_PROGRESS.PROCESSING_START, errorMessage: null });

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      
      let currentProgress: number = BACKGROUND_REMOVER_PROGRESS.INITIAL;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + BACKGROUND_REMOVER_PROGRESS.INCREMENT, BACKGROUND_REMOVER_PROGRESS.MAX_SIMULATED);
        setProcessing(prev => ({ ...prev, progress: currentProgress }));
      }, BACKGROUND_REMOVER_PROGRESS.INTERVAL_MS);

      const PROGRESS_MULTIPLIER = 80;
      const blob = await removeBackground(file, {
        progress: (_key, current, total) => {
          const progress = Math.round((current / total) * PROGRESS_MULTIPLIER) + BACKGROUND_REMOVER_PROGRESS.PROCESSING_START;
          setProcessing(prev => ({ ...prev, progress: Math.min(progress, BACKGROUND_REMOVER_PROGRESS.PROCESSING_MAX) }));
        },
      });

      clearInterval(progressInterval);
      
      const processedUrl = URL.createObjectURL(blob);
      setImageData(prev => ({ ...prev, processed: processedUrl }));
      setProcessing({ status: 'complete', progress: BACKGROUND_REMOVER_PROGRESS.COMPLETE, errorMessage: null });
    } catch (err) {
      setProcessing({
        status: 'error',
        progress: 0,
        errorMessage: err instanceof Error ? err.message : 'Failed to process image',
      });
    }
  }, [validateFile]);

  const reset = useCallback(() => {
    setImageData(prev => {
      prev.original && URL.revokeObjectURL(prev.original);
      prev.processed && URL.revokeObjectURL(prev.processed);
      return { original: null, processed: null, fileName: null };
    });
    setProcessing({ status: 'idle', progress: 0, errorMessage: null });
  }, []);

  const downloadProcessed = useCallback(() => {
    if (!imageData.processed || !imageData.fileName) return;
    const baseName = imageData.fileName.replace(/\.[^/.]+$/, '');
    downloadFileFromUrl(imageData.processed, `${baseName}-no-bg.png`);
  }, [imageData]);

  return {
    processing,
    imageData,
    processImage,
    reset,
    downloadProcessed,
  };
};