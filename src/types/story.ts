import { CreationMode, AspectRatio, VisualStyle, InputType } from './common';

export interface ChatTurn {
  speaker: 'A' | 'B';
  text: string;
}

export interface WizardState {
  step: number;
  mode: CreationMode;
  inputType: InputType;
  topic: string;
  url: string;
  aspectRatio: AspectRatio;
  visualStyle: VisualStyle;
  selectedVoice: string;
  selectedVoiceB?: string;
  script: string;
  rankingItems: string[];
  chatTurns: ChatTurn[];
  isGenerating: boolean;
}

