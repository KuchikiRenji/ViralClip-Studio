export interface AudioAnalysisResult {
  peaks: number[];
  clips: { start: number; end: number; score: number }[];
}
interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}
const getAudioContext = (): AudioContext => {
  const windowWithWebkit = window as WindowWithWebkitAudioContext;
  const AudioContextClass = window.AudioContext || windowWithWebkit.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('AudioContext is not supported in this browser');
  }
  return new AudioContextClass();
};
const WINDOW_DURATION_SECONDS = 1;
const ENERGY_THRESHOLD_MULTIPLIER = 1.2;
const MIN_HIGH_ENERGY_DURATION_SECONDS = 5;
const CLIP_PADDING_SECONDS = 2;
const MAX_CLIPS_TO_RETURN = 6;
const FALLBACK_CLIP_INTERVAL_SECONDS = 30;
const FALLBACK_CLIP_SCORE = 80;
const calculateEnergies = (rawData: Float32Array, sampleRate: number): number[] => {
  const samplesPerWindow = sampleRate * WINDOW_DURATION_SECONDS;
  const energies: number[] = [];
  for (let i = 0; i < rawData.length; i += samplesPerWindow) {
    let sum = 0;
    const end = Math.min(i + samplesPerWindow, rawData.length);
    for (let j = i; j < end; j++) {
      sum += rawData[j] * rawData[j];
    }
    const rms = Math.sqrt(sum / (end - i));
    energies.push(rms);
  }
  return energies;
};
const findPotentialClips = (
  energies: number[],
  duration: number,
  threshold: number
): { start: number; end: number; score: number }[] => {
  const potentialClips: { start: number; end: number; score: number }[] = [];
  let currentClipStart = -1;
  let currentClipEnergy = 0;
  for (let i = 0; i < energies.length; i++) {
    if (energies[i] > threshold) {
      if (currentClipStart === -1) {
        currentClipStart = i;
      }
      currentClipEnergy += energies[i];
    } else {
      if (currentClipStart !== -1) {
        const clipDuration = i - currentClipStart;
        if (clipDuration >= MIN_HIGH_ENERGY_DURATION_SECONDS) {
          potentialClips.push({
            start: Math.max(0, currentClipStart - CLIP_PADDING_SECONDS),
            end: Math.min(duration, i + CLIP_PADDING_SECONDS),
            score: currentClipEnergy / clipDuration
          });
        }
        currentClipStart = -1;
        currentClipEnergy = 0;
      }
    }
  }
  return potentialClips;
};
const refineClips = (
  potentialClips: { start: number; end: number; score: number }[],
  duration: number,
  minClipDuration: number,
  maxClipDuration: number
): { start: number; end: number; score: number }[] => {
  return potentialClips
    .map(c => {
      let start = c.start;
      let end = c.end;
      const currDur = end - start;
      if (currDur < minClipDuration) {
        end = Math.min(duration, start + minClipDuration);
      } else if (currDur > maxClipDuration) {
        end = start + maxClipDuration;
      }
      return { ...c, start, end };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CLIPS_TO_RETURN);
};
const generateFallbackClips = (duration: number): { start: number; end: number; score: number }[] => {
  const clipCount = Math.min(Math.floor(duration / FALLBACK_CLIP_INTERVAL_SECONDS), 5);
  const fallbackClips: { start: number; end: number; score: number }[] = [];
  for (let i = 0; i < clipCount; i++) {
    fallbackClips.push({
      start: i * FALLBACK_CLIP_INTERVAL_SECONDS,
      end: Math.min((i + 1) * FALLBACK_CLIP_INTERVAL_SECONDS, duration),
      score: FALLBACK_CLIP_SCORE
    });
  }
  return fallbackClips;
};
export const analyzeAudioForClips = async (
  file: File,
  duration: number,
  minClipDuration = 15,
  maxClipDuration = 60
): Promise<AudioAnalysisResult> => {
  const audioContext = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const rawData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const energies = calculateEnergies(rawData, sampleRate);
  const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
  const threshold = avgEnergy * ENERGY_THRESHOLD_MULTIPLIER;
  const potentialClips = findPotentialClips(energies, duration, threshold);
  let finalClips = refineClips(potentialClips, duration, minClipDuration, maxClipDuration);
  if (finalClips.length === 0) {
    finalClips = generateFallbackClips(duration);
  }
  audioContext.close();
  return { peaks: energies, clips: finalClips };
};