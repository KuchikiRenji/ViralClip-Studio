import type { ProcessingState } from '../../../types/common';

export interface BackgroundRemoverProps {
  onBack: () => void;
}

export interface ImageData {
  original: string | null;
  processed: string | null;
  fileName: string | null;
}

export type { ProcessingState };