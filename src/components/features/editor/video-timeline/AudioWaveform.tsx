import { useMemo } from 'react';
import { AudioWaveformProps } from './types';
import { WAVEFORM_BARS_COUNT, WAVEFORM_BAR_GAP } from './constants';

const DEFAULT_WAVEFORM_COLOR = 'rgba(34, 197, 94, 0.6)';
const MIN_BAR_WIDTH = 2;
const BASE_AMPLITUDE = 0.3;

export const AudioWaveform = ({
  waveformData,
  width,
  height,
  color = DEFAULT_WAVEFORM_COLOR,
}: AudioWaveformProps) => {
  const bars = useMemo(() => {
    if (waveformData && waveformData.length > 0) {
      return waveformData;
    }

    const barCount = Math.min(
      WAVEFORM_BARS_COUNT,
      Math.floor(width / (3 + WAVEFORM_BAR_GAP))
    );

    return Array.from({ length: barCount }, (_, i) => {
      const variance = Math.sin(i * 0.5) * 0.3 + Math.cos(i * 0.3) * 0.2;
      const random = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      return Math.max(0.1, Math.min(1, BASE_AMPLITUDE + variance + random * 0.2));
    });
  }, [waveformData, width]);

  const barWidth = useMemo(() => {
    const totalGaps = (bars.length - 1) * WAVEFORM_BAR_GAP;
    return Math.max(MIN_BAR_WIDTH, (width - totalGaps) / bars.length);
  }, [bars.length, width]);

  return (
    <div
      className="flex items-center justify-start gap-px overflow-hidden"
      style={{ width, height }}
    >
      {bars.map((amplitude, index) => {
        const barHeight = Math.max(MIN_BAR_WIDTH, amplitude * (height - 4));
        return (
          <div
            key={index}
            className="rounded-full transition-all duration-75"
            style={{
              width: barWidth,
              height: barHeight,
              backgroundColor: color,
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
};
