import type { ProcessingState } from '../../../types/common';

export interface VocalRemoverProps {
  onBack: () => void;
}

export interface AudioData {
  original: string | null;
  vocals: string | null;
  instrumental: string | null;
  fileName: string | null;
  duration: number;
}

export type OutputType = 'vocals' | 'instrumental' | 'both';

export type { ProcessingState };