import { useCallback } from 'react';
import type { TranscriptionSegment } from './types';
import { transcriptionService, TranscriptionResponse } from '../../../services/api/transcriptionService';

interface UseSpeechRecognitionProps {
  setSegments: React.Dispatch<React.SetStateAction<TranscriptionSegment[]>>;
  setStatus: React.Dispatch<React.SetStateAction<'idle' | 'uploading' | 'transcribing' | 'complete' | 'error'>>;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  uploadedFile: File | null;
  videoLink?: string;
}

export const useSpeechRecognition = ({
  setSegments,
  setStatus,
  setProgress,
  setErrorMessage,
  uploadedFile,
  videoLink
}: UseSpeechRecognitionProps) => {

  const startTranscription = useCallback(async () => {
    const hasFile = Boolean(uploadedFile);
    const hasLink = Boolean(videoLink?.trim());

    if (!hasFile && !hasLink) {
      setErrorMessage('Please upload a file or provide a URL.');
      return;
    }

    setStatus('transcribing');
    setProgress(10);
    setSegments([]);
    setErrorMessage(null);

    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 500);

    try {
      let result: TranscriptionResponse;

      if (hasFile && uploadedFile) {
        result = await transcriptionService.transcribe(uploadedFile);
      } else if (hasLink && videoLink) {
        result = await transcriptionService.transcribeUrl(videoLink.trim());
      } else {
        throw new Error('No input provided');
      }
      
      clearInterval(interval);
      setProgress(100);

      if (result.segments && result.segments.length > 0) {
        const mappedSegments: TranscriptionSegment[] = result.segments.map(seg => ({
          id: `seg_${seg.id}`,
          startTime: seg.start,
          endTime: seg.end,
          text: seg.text.trim()
        }));
        setSegments(mappedSegments);
      } else {
        setSegments([{
          id: 'full_text',
          startTime: 0,
          endTime: 0,
          text: result.text
        }]);
      }
      
      setStatus('complete');
    } catch (error) {
      clearInterval(interval);
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Transcription failed');
      setStatus('error');
      setProgress(0);
    }
  }, [uploadedFile, videoLink, setSegments, setStatus, setProgress, setErrorMessage]);

  const stopTranscription = useCallback(() => {
    setStatus('idle');
  }, [setStatus]);

  return {
    startTranscription,
    stopTranscription,
  };
};
