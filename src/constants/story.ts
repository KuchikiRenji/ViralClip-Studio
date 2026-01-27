export { GENERATION } from './generation';

export const VOICES = [
  { id: 'adam', name: 'Adam (Viral)', gender: 'Male', accent: 'American' },
  { id: 'rachel', name: 'Rachel (Story)', gender: 'Female', accent: 'American' },
  { id: 'josh', name: 'Josh (Deep)', gender: 'Male', accent: 'British' },
  { id: 'eleven', name: 'Bella (Soft)', gender: 'Female', accent: 'Australian' },
] as const;
export const BACKGROUNDS = [
  { id: 'gameplay', name: 'Gaming (Minecraft/GTA)', type: 'gameplay', src: 'https://videos.pexels.com/video-files/5928014/5928014-uhd_1080_1920_30fps.mp4' },
  { id: 'satisfying', name: 'Satisfying (ASMR/Soap)', type: 'satisfying', src: 'https://videos.pexels.com/video-files/8063953/8063953-hd_1080_1920_30fps.mp4' },
  { id: 'faceless', name: 'Faceless (Aesthetic/Minimal)', type: 'faceless', src: 'https://videos.pexels.com/video-files/14402560/14402560-uhd_1080_1920_30fps.mp4' },
  { id: 'nature', name: 'Nature (Cinematic/Drone)', type: 'nature', src: 'https://videos.pexels.com/video-files/2025634/2025634-hd_1080_1920_30fps.mp4' },
  { id: 'urban', name: 'Urban (City/Drive)', type: 'urban', src: 'https://videos.pexels.com/video-files/4678261/4678261-hd_1080_1920_30fps.mp4' },
] as const;
export const DEFAULT_RANKING_ITEMS_COUNT = 5;
export const DEFAULT_CHAT_TURNS = [
  { speaker: 'A' as const, text: 'Hey, did you see the new viral video?' },
  { speaker: 'B' as const, text: 'No, what happened?' },
];