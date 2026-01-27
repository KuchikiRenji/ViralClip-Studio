import { invokeEdgeFunctionFormData, invokeEdgeFunction } from '@/lib/supabase';

export interface TranscriptionResponse {
  text: string;
  segments?: {
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }[];
}

const MAX_WHISPER_SIZE = 25 * 1024 * 1024;

async function extractAudioFromVideo(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;

    video.onloadedmetadata = async () => {
      try {
        const audioContext = new AudioContext();
        const response = await fetch(video.src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const offlineContext = new OfflineAudioContext(
          1,
          audioBuffer.length,
          16000
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        const renderedBuffer = await offlineContext.startRendering();
        const wavBlob = audioBufferToWav(renderedBuffer);
        
        URL.revokeObjectURL(video.src);
        audioContext.close();
        
        const audioFile = new File([wavBlob], 'audio.wav', { type: 'audio/wav' });
        resolve(audioFile);
      } catch (err) {
        URL.revokeObjectURL(video.src);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video for audio extraction'));
    };
  });
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export const transcriptionService = {
  async transcribe(file: File): Promise<TranscriptionResponse> {
    let audioFile = file;

    if (file.type.startsWith('video/') && file.size > MAX_WHISPER_SIZE) {
      try {
        audioFile = await extractAudioFromVideo(file);
      } catch {
        throw new Error(
          `Video file is ${(file.size / (1024 * 1024)).toFixed(1)}MB. ` +
          `OpenAI Whisper limit is 25MB. Audio extraction failed. ` +
          `Please use a shorter video or extract audio manually.`
        );
      }
    }

    if (audioFile.size > MAX_WHISPER_SIZE) {
      throw new Error(
        `File size (${(audioFile.size / (1024 * 1024)).toFixed(1)}MB) exceeds OpenAI Whisper limit (25MB). ` +
        `Please use a smaller or shorter file.`
      );
    }

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');

    return invokeEdgeFunctionFormData<TranscriptionResponse>('openai-proxy', formData, {
      'x-openai-path': '/audio/transcriptions'
    });
  },

  async transcribeUrl(url: string, language?: string): Promise<TranscriptionResponse> {
    return invokeEdgeFunction<TranscriptionResponse>('transcribe-url', {
      url,
      language
    });
  },
};
