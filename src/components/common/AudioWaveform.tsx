import { useEffect, useRef, useCallback, useState } from 'react';

interface AudioWaveformProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  width: number;
  height: number;
  color?: string;
  backgroundColor?: string;
  progress?: number;
  progressColor?: string;
  onClick?: (progress: number) => void;
  className?: string;
}

const WAVEFORM_BARS = 100;
const WAVEFORM_GAP = 2;
const SILENT_WAVEFORM = Array.from({ length: WAVEFORM_BARS }, () => 0);

export const AudioWaveform = ({
  audioUrl,
  audioBuffer,
  width,
  height,
  color = 'rgba(168, 85, 247, 0.6)',
  backgroundColor = 'rgba(39, 39, 42, 0.5)',
  progress = 0,
  progressColor = 'rgba(168, 85, 247, 1)',
  onClick,
  className = '',
}: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeAudio = useCallback(async (buffer: AudioBuffer): Promise<number[]> => {
    const channelData = buffer.getChannelData(0);
    const samplesPerBar = Math.floor(channelData.length / WAVEFORM_BARS);
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      let sum = 0;
      const start = i * samplesPerBar;
      const end = Math.min(start + samplesPerBar, channelData.length);
      for (let j = start; j < end; j++) {
        sum += Math.abs(channelData[j]);
      }
      const average = sum / (end - start);
      bars.push(Math.min(1, average * 3));
    }
    return bars;
  }, []);

  useEffect(() => {
    const loadAudio = async () => {
      if (audioBuffer) {
        const waveformAnalysis = await analyzeAudio(audioBuffer);
        setWaveformData(waveformAnalysis);
        return;
      }
      if (!audioUrl) {
        setWaveformData(SILENT_WAVEFORM);
        return;
      }
      setIsLoading(true);
      try {
        const audioContext = new AudioContext();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const waveformAnalysis = await analyzeAudio(decodedAudioBuffer);
        setWaveformData(waveformAnalysis);
        await audioContext.close();
      } catch {
        setWaveformData(SILENT_WAVEFORM);
      } finally {
        setIsLoading(false);
      }
    };
    loadAudio();
  }, [audioUrl, audioBuffer, analyzeAudio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    const barWidth = (width - (WAVEFORM_BARS - 1) * WAVEFORM_GAP) / WAVEFORM_BARS;
    const progressIndex = Math.floor(progress * WAVEFORM_BARS);
    waveformData.forEach((amplitude, i) => {
      const barHeight = Math.max(2, amplitude * height * 0.9);
      const x = i * (barWidth + WAVEFORM_GAP);
      const y = (height - barHeight) / 2;
      ctx.fillStyle = i < progressIndex ? progressColor : color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 1);
      ctx.fill();
    });
  }, [waveformData, width, height, color, backgroundColor, progress, progressColor]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickProgress = x / rect.width;
    onClick(Math.max(0, Math.min(1, clickProgress)));
  }, [onClick]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-purple-500/50 rounded-full animate-pulse"
              style={{ 
                height: 8 + Math.random() * 16,
                animationDelay: `${i * 0.1}s` 
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width, height }}
      onClick={handleClick}
    />
  );
};
