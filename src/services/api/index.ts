import { getEdgeFunctionUrl } from '../../lib/supabase';

export const API_ENDPOINTS = {
  transcribe: getEdgeFunctionUrl('transcribe'),
  generateScript: getEdgeFunctionUrl('generate-script'),
  textToSpeech: getEdgeFunctionUrl('text-to-speech'),
  exportVideo: getEdgeFunctionUrl('export-video'),
} as const;

export { transcriptionService } from './transcriptionService';
export { scriptService } from './scriptService';
export { ttsService } from './ttsService';
export { projectService } from './projectService';
export { exportService } from './exportService';
export { voiceCloneService, textToSpeechService, voiceProcessingService } from './voiceService';
export { runwayService } from './runwayService';
export { lemonSqueezyService } from './lemonSqueezyService';
