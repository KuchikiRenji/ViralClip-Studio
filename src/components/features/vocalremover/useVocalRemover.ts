import { useState, useCallback, useRef } from 'react';
import type { ProcessingState } from '../../../types/common';
import type { AudioData, OutputType } from './types';
import { SUPPORTED_AUDIO_FORMATS, VOCAL_REMOVER_MAX_SIZE_BYTES, VOCAL_REMOVER_DOWNLOAD_DELAY_MS, WAV_FILE_CONSTANTS } from '../../../constants/upload';
import { downloadFileFromUrl } from '../../../utils/videoExport';

export const useVocalRemover = () => {
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    errorMessage: null,
  });
  
  const [audioData, setAudioData] = useState<AudioData>({
    original: null,
    vocals: null,
    instrumental: null,
    fileName: null,
    duration: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_AUDIO_FORMATS.includes(file.type as typeof SUPPORTED_AUDIO_FORMATS[number])) {
      return 'Invalid file format. Please use MP3, WAV, or FLAC.';
    }
    if (file.size > VOCAL_REMOVER_MAX_SIZE_BYTES) {
      return 'File too large. Maximum size is 50MB.';
    }
    return null;
  }, []);

  const processAudio = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setProcessing({ status: 'error', progress: 0, errorMessage: error });
      return;
    }

    setProcessing({ status: 'loading', progress: 0, errorMessage: null });

    const originalUrl = URL.createObjectURL(file);
    setAudioData({ original: originalUrl, vocals: null, instrumental: null, fileName: file.name, duration: 0 });

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const audioContext = audioContextRef.current;

      setProcessing({ status: 'processing', progress: 20, errorMessage: null });

      const arrayBuffer = await file.arrayBuffer();
      setProcessing(prev => ({ ...prev, progress: 40 }));

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      setAudioData(prev => ({ ...prev, duration: audioBuffer.duration }));
      setProcessing(prev => ({ ...prev, progress: 60 }));

      const vocalsBuffer = createVocalsBuffer(audioContext, audioBuffer);
      const instrumentalBuffer = createInstrumentalBuffer(audioContext, audioBuffer);
      setProcessing(prev => ({ ...prev, progress: 80 }));

      const vocalsBlob = await bufferToWav(vocalsBuffer);
      const instrumentalBlob = await bufferToWav(instrumentalBuffer);

      const vocalsUrl = URL.createObjectURL(vocalsBlob);
      const instrumentalUrl = URL.createObjectURL(instrumentalBlob);

      setAudioData(prev => ({ ...prev, vocals: vocalsUrl, instrumental: instrumentalUrl }));
      setProcessing({ status: 'complete', progress: 100, errorMessage: null });
    } catch (err) {
      setProcessing({
        status: 'error',
        progress: 0,
        errorMessage: err instanceof Error ? err.message : 'Failed to process audio',
      });
    } finally {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    }
  }, [validateFile]);

  const reset = useCallback(() => {
    setAudioData(prev => {
      if (prev.original) URL.revokeObjectURL(prev.original);
      if (prev.vocals) URL.revokeObjectURL(prev.vocals);
      if (prev.instrumental) URL.revokeObjectURL(prev.instrumental);
      return { original: null, vocals: null, instrumental: null, fileName: null, duration: 0 };
    });
    setProcessing({ status: 'idle', progress: 0, errorMessage: null });
  }, []);

  const download = useCallback((type: OutputType) => {
    if (!audioData.fileName) return;
    const baseName = audioData.fileName.replace(/\.[^/.]+$/, '');

    if ((type === 'vocals' || type === 'both') && audioData.vocals) {
      downloadFileFromUrl(audioData.vocals, `${baseName}-vocals.wav`);
    }
    if ((type === 'instrumental' || type === 'both') && audioData.instrumental) {
      const delay = type === 'both' ? VOCAL_REMOVER_DOWNLOAD_DELAY_MS : 0;
      setTimeout(() => {
        if (audioData.instrumental) {
          downloadFileFromUrl(audioData.instrumental, `${baseName}-instrumental.wav`);
        }
      }, delay);
    }
  }, [audioData]);

  return {
    processing,
    audioData,
    processAudio,
    reset,
    download,
  };
};

function createVocalsBuffer(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
  const outputBuffer = ctx.createBuffer(1, buffer.length, buffer.sampleRate);
  const outputData = outputBuffer.getChannelData(0);
  
  if (buffer.numberOfChannels >= 2) {
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    for (let i = 0; i < buffer.length; i++) {
      outputData[i] = (leftChannel[i] + rightChannel[i]) / 2;
    }
  } else {
    const monoChannel = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      outputData[i] = monoChannel[i];
    }
  }
  return outputBuffer;
}

function createInstrumentalBuffer(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
  const outputBuffer = ctx.createBuffer(1, buffer.length, buffer.sampleRate);
  const outputData = outputBuffer.getChannelData(0);
  
  if (buffer.numberOfChannels >= 2) {
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    for (let i = 0; i < buffer.length; i++) {
      outputData[i] = (leftChannel[i] - rightChannel[i]) * WAV_FILE_CONSTANTS.STEREO_MIX_FACTOR;
    }
  } else {
    const monoChannel = buffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      outputData[i] = monoChannel[i] * WAV_FILE_CONSTANTS.MONO_ATTENUATION_FACTOR;
    }
  }
  return outputBuffer;
}

async function bufferToWav(buffer: AudioBuffer): Promise<Blob> {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * WAV_FILE_CONSTANTS.BYTES_PER_SAMPLE;
  const arrayBuffer = new ArrayBuffer(WAV_FILE_CONSTANTS.HEADER_SIZE + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const fileSizeMinusHeader = WAV_FILE_CONSTANTS.FMT_SUBCHUNK_SIZE + WAV_FILE_CONSTANTS.BYTES_PER_SAMPLE + length;
  const byteRate = sampleRate * numChannels * WAV_FILE_CONSTANTS.BYTES_PER_SAMPLE;
  const blockAlign = numChannels * WAV_FILE_CONSTANTS.BYTES_PER_SAMPLE;

  writeString(WAV_FILE_CONSTANTS.RIFF_OFFSET, 'RIFF');
  view.setUint32(WAV_FILE_CONSTANTS.FILE_SIZE_OFFSET, fileSizeMinusHeader, true);
  writeString(WAV_FILE_CONSTANTS.WAVE_OFFSET, 'WAVE');
  writeString(WAV_FILE_CONSTANTS.FMT_OFFSET, 'fmt ');
  view.setUint32(WAV_FILE_CONSTANTS.FMT_SIZE_OFFSET, WAV_FILE_CONSTANTS.FMT_SUBCHUNK_SIZE, true);
  view.setUint16(WAV_FILE_CONSTANTS.AUDIO_FORMAT_OFFSET, WAV_FILE_CONSTANTS.PCM_FORMAT, true);
  view.setUint16(WAV_FILE_CONSTANTS.NUM_CHANNELS_OFFSET, numChannels, true);
  view.setUint32(WAV_FILE_CONSTANTS.SAMPLE_RATE_OFFSET, sampleRate, true);
  view.setUint32(WAV_FILE_CONSTANTS.BYTE_RATE_OFFSET, byteRate, true);
  view.setUint16(WAV_FILE_CONSTANTS.BLOCK_ALIGN_OFFSET, blockAlign, true);
  view.setUint16(WAV_FILE_CONSTANTS.BITS_PER_SAMPLE_OFFSET, WAV_FILE_CONSTANTS.BITS_PER_SAMPLE, true);
  writeString(WAV_FILE_CONSTANTS.DATA_OFFSET, 'data');
  view.setUint32(WAV_FILE_CONSTANTS.DATA_SIZE_OFFSET, length, true);

  let offset = WAV_FILE_CONSTANTS.DATA_START;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(WAV_FILE_CONSTANTS.SAMPLE_MIN, Math.min(WAV_FILE_CONSTANTS.SAMPLE_MAX, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * WAV_FILE_CONSTANTS.INT16_MIN : sample * WAV_FILE_CONSTANTS.INT16_MAX, true);
      offset += WAV_FILE_CONSTANTS.BYTES_PER_SAMPLE;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
};