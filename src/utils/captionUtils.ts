import { Caption, CaptionStyle, CaptionStylePreset } from '../types';
export const CAPTION_STYLE_PRESETS: Record<CaptionStylePreset, CaptionStyle> = {
  default: {
    preset: 'default',
    fontFamily: 'Inter',
    fontSize: 24,
    fontColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    position: 'bottom',
    animation: 'none',
  },
  tiktok: {
    preset: 'tiktok',
    fontFamily: 'Montserrat',
    fontSize: 28,
    fontColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0,
    position: 'center',
    animation: 'word-highlight',
  },
  youtube: {
    preset: 'youtube',
    fontFamily: 'Roboto',
    fontSize: 22,
    fontColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0.8,
    position: 'bottom',
    animation: 'fade',
  },
  netflix: {
    preset: 'netflix',
    fontFamily: 'Arial',
    fontSize: 26,
    fontColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundOpacity: 0.5,
    position: 'bottom',
    animation: 'none',
  },
  minimal: {
    preset: 'minimal',
    fontFamily: 'SF Pro',
    fontSize: 20,
    fontColor: '#ffffff',
    backgroundColor: 'transparent',
    backgroundOpacity: 0,
    position: 'bottom',
    animation: 'fade',
  },
};
const SAMPLE_TRANSCRIPTION_SEGMENTS = [
  { text: "Hey everyone, welcome back to the channel!", duration: 3 },
  { text: "Today we're going to talk about something really exciting.", duration: 3.5 },
  { text: "This is going to be a game changer for your content.", duration: 3 },
  { text: "Let me show you exactly how it works.", duration: 2.5 },
  { text: "First, you need to understand the basics.", duration: 2.5 },
  { text: "Once you get this down, everything becomes easier.", duration: 3 },
  { text: "The key is consistency and practice.", duration: 2.5 },
  { text: "Don't forget to like and subscribe!", duration: 2 },
  { text: "See you in the next video!", duration: 2 },
];
export const simulateTranscription = async (
  duration: number,
  onProgress?: (progress: number) => void
): Promise<Caption[]> => {
  const captions: Caption[] = [];
  let currentTime = 0;
  let segmentIndex = 0;
  while (currentTime < duration) {
    const segment = SAMPLE_TRANSCRIPTION_SEGMENTS[segmentIndex % SAMPLE_TRANSCRIPTION_SEGMENTS.length];
    const segmentDuration = Math.min(segment.duration, duration - currentTime);
    if (segmentDuration > 0.5) {
      captions.push({
        id: `caption-${Date.now()}-${segmentIndex}`,
        startTime: currentTime,
        endTime: currentTime + segmentDuration,
        text: segment.text,
        style: CAPTION_STYLE_PRESETS.default,
      });
    }
    currentTime += segmentDuration + 0.2;
    segmentIndex++;
    if (onProgress) {
      const progress = Math.min((currentTime / duration) * 100, 100);
      onProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return captions;
};
export const parseSRT = (srtContent: string): Caption[] => {
  const captions: Caption[] = [];
  const blocks = srtContent.trim().split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;
    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) continue;
    const startTime = 
      parseInt(timeMatch[1]) * 3600 +
      parseInt(timeMatch[2]) * 60 +
      parseInt(timeMatch[3]) +
      parseInt(timeMatch[4]) / 1000;
    const endTime = 
      parseInt(timeMatch[5]) * 3600 +
      parseInt(timeMatch[6]) * 60 +
      parseInt(timeMatch[7]) +
      parseInt(timeMatch[8]) / 1000;
    const text = lines.slice(2).join(' ').trim();
    captions.push({
      id: `caption-${Date.now()}-${captions.length}`,
      startTime,
      endTime,
      text,
      style: CAPTION_STYLE_PRESETS.default,
    });
  }
  return captions;
};
export const generateSRT = (captions: Caption[]): string => {
  return captions.map((caption, index) => {
    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    return `${index + 1}\n${formatTime(caption.startTime)} --> ${formatTime(caption.endTime)}\n${caption.text}`;
  }).join('\n\n');
};
export const parseVTT = (vttContent: string): Caption[] => {
  const captions: Caption[] = [];
  const lines = vttContent.split('\n');
  let currentCaption: Partial<Caption> | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
      if (timeMatch) {
        const startTime = 
          parseInt(timeMatch[1]) * 3600 +
          parseInt(timeMatch[2]) * 60 +
          parseInt(timeMatch[3]) +
          parseInt(timeMatch[4]) / 1000;
        const endTime = 
          parseInt(timeMatch[5]) * 3600 +
          parseInt(timeMatch[6]) * 60 +
          parseInt(timeMatch[7]) +
          parseInt(timeMatch[8]) / 1000;
        currentCaption = {
          id: `caption-${Date.now()}-${captions.length}`,
          startTime,
          endTime,
          text: '',
          style: CAPTION_STYLE_PRESETS.default,
        };
      }
    } else if (currentCaption && line && !line.startsWith('WEBVTT') && !line.match(/^\d+$/)) {
      currentCaption.text = currentCaption.text ? `${currentCaption.text} ${line}` : line;
    } else if (currentCaption && !line && currentCaption.text) {
      captions.push(currentCaption as Caption);
      currentCaption = null;
    }
  }
  if (currentCaption && currentCaption.text) {
    captions.push(currentCaption as Caption);
  }
  return captions;
};
export const generateVTT = (captions: Caption[]): string => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  const captionLines = captions.map((caption) => {
    return `${formatTime(caption.startTime)} --> ${formatTime(caption.endTime)}\n${caption.text}`;
  }).join('\n\n');
  return `WEBVTT\n\n${captionLines}`;
};
export const adjustCaptionTiming = (
  captions: Caption[],
  offset: number
): Caption[] => {
  return captions.map(caption => ({
    ...caption,
    startTime: Math.max(0, caption.startTime + offset),
    endTime: Math.max(0, caption.endTime + offset),
  }));
};
export const mergeCaptions = (
  captions: Caption[],
  maxGap: number = 0.5
): Caption[] => {
  if (captions.length < 2) return captions;
  const sorted = [...captions].sort((a, b) => a.startTime - b.startTime);
  const merged: Caption[] = [];
  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (next.startTime - current.endTime <= maxGap) {
      current.endTime = next.endTime;
      current.text = `${current.text} ${next.text}`;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
};