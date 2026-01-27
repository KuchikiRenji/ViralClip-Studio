import { analyzeAudioForClips } from './audioUtils';
import { TIMING } from '../../../constants/timing';
export interface GeneratedClip {
  id: string;
  title: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  duration: string;
  score: number;
  thumbnail: string;
  blob?: Blob;
  reason?: string;
}
const FALLBACK_CLIP_DURATION = 15;
const MAX_FALLBACK_CLIPS = 6;
const LINK_CLIP_COUNT = 4;
const LINK_CLIP_DURATION = 15;
const MAX_SCORE = 100;
const NORMALIZED_MAX_SCORE = 95;
const BASE_SCORE_FALLBACK = 80;
const BASE_SCORE_LINK = 90;
export const generateClipsFromAudio = async (
  file: File,
  duration: number
): Promise<GeneratedClip[]> => {
  const result = await analyzeAudioForClips(file, duration);
  return result.clips.map((c, i) => ({
    id: `clip_${i}`,
    title: `Viral Moment #${i + 1}`,
    startTimeSeconds: c.start,
    endTimeSeconds: c.end,
    duration: `${Math.floor(c.end - c.start)}s`,
    score: Math.floor(c.score * MAX_SCORE) > MAX_SCORE ? NORMALIZED_MAX_SCORE : Math.floor(c.score * MAX_SCORE),
    thumbnail: ''
  }));
};
export const generateFallbackClipsForFile = (duration: number): GeneratedClip[] => {
  const clipDuration = FALLBACK_CLIP_DURATION;
  const count = Math.floor(duration / clipDuration);
  const clips: GeneratedClip[] = [];
  for (let i = 0; i < Math.min(count, MAX_FALLBACK_CLIPS); i++) {
    clips.push({
      id: `clip_${i}`,
      title: `Segment #${i + 1}`,
      startTimeSeconds: i * clipDuration,
      endTimeSeconds: (i + 1) * clipDuration,
      duration: `${clipDuration}s`,
      score: BASE_SCORE_FALLBACK - i * 5,
      thumbnail: ''
    });
  }
  return clips;
};
export const generateClipsFromLink = async (): Promise<GeneratedClip[]> => {
  await new Promise(resolve => setTimeout(resolve, TIMING.DELAY_MS.EXTRA_LONG));
  const clips: GeneratedClip[] = [];
  for (let i = 0; i < LINK_CLIP_COUNT; i++) {
    clips.push({
      id: `clip_${i}`,
      title: `Viral Link Moment #${i + 1}`,
      startTimeSeconds: i * LINK_CLIP_DURATION,
      endTimeSeconds: (i + 1) * LINK_CLIP_DURATION,
      duration: `${LINK_CLIP_DURATION}s`,
      score: BASE_SCORE_LINK - i * 10,
      thumbnail: ''
    });
  }
  return clips;
};







