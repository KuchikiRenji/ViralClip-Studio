import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VideoControlsProps {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  onFullscreen?: () => void;
  showFullscreen?: boolean;
}

const formatTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const VideoControls = ({
  isPlaying,
  isMuted,
  currentTime,
  duration,
  onPlayPause,
  onMuteToggle,
  onSeek,
  onFullscreen,
  showFullscreen = true,
}: VideoControlsProps) => {
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="p-3 bg-gradient-to-t from-black/80 to-transparent">
      <div className="flex items-center gap-2">
        <button
          onClick={onPlayPause}
          className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
          type="button"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={onMuteToggle}
          className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
          type="button"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <span className="text-white text-xs ml-auto">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        {showFullscreen && (
          <button
            onClick={onFullscreen}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
            type="button"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div
        className="mt-2 h-1 bg-zinc-700 rounded-full cursor-pointer"
        onClick={onSeek}
        role="slider"
        aria-valuenow={currentTime}
        aria-valuemin={0}
        aria-valuemax={duration}
        tabIndex={0}
      >
        <div
          className="h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
