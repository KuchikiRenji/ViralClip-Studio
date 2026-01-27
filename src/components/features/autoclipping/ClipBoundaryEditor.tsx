import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, Scissors, Check, X, RotateCcw } from 'lucide-react';
interface ClipSuggestion {
  id: string;
  startTime: number;
  endTime: number;
  confidence: number;
  reason: string;
  thumbnail?: string;
}
interface ClipBoundaryEditorProps {
  clip: ClipSuggestion;
  videoDuration: number;
  onSave: (clipId: string, startTime: number, endTime: number) => void;
  onCancel: () => void;
  onPreview: (startTime: number, endTime: number) => void;
}
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};
export const ClipBoundaryEditor = ({
  clip,
  videoDuration,
  onSave,
  onCancel,
  onPreview,
}) => {
  const [startTime, setStartTime] = useState(clip.startTime);
  const [endTime, setEndTime] = useState(clip.endTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreviewTime, setCurrentPreviewTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const clipDuration = endTime - startTime;
  const minClipDuration = 1; 
  const maxClipDuration = 30; 
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      setIsPlaying(true);
      setCurrentPreviewTime(startTime);
      onPreview(startTime, endTime);
      intervalRef.current = setInterval(() => {
        setCurrentPreviewTime((prev) => {
          if (prev >= endTime) {
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return startTime;
          }
          return prev + 0.1; 
        });
      }, 100);
    }
  }, [isPlaying, startTime, endTime, onPreview]);
  const handleStartTimeChange = useCallback((newStartTime: number) => {
    const clampedStart = Math.max(0, Math.min(newStartTime, endTime - minClipDuration));
    setStartTime(clampedStart);
    if (endTime - clampedStart < minClipDuration) {
      setEndTime(clampedStart + minClipDuration);
    }
  }, [endTime, minClipDuration]);
  const handleEndTimeChange = useCallback((newEndTime: number) => {
    const clampedEnd = Math.max(startTime + minClipDuration, Math.min(newEndTime, videoDuration));
    setEndTime(clampedEnd);
  }, [startTime, minClipDuration, videoDuration]);
  const handleSave = useCallback(() => {
    onSave(clip.id, startTime, endTime);
  }, [clip.id, startTime, endTime, onSave]);
  const handleReset = useCallback(() => {
    setStartTime(clip.startTime);
    setEndTime(clip.endTime);
    setCurrentPreviewTime(0);
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [clip.startTime, clip.endTime]);
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 90) return 'text-green-400';
    if (confidence >= 80) return 'text-yellow-400';
    if (confidence >= 70) return 'text-orange-400';
    return 'text-red-400';
  };
  const getConfidenceBg = (confidence: number): string => {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 80) return 'bg-yellow-500';
    if (confidence >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };
  return (
    <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
      {}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getConfidenceBg(clip.confidence)}`}>
              <Scissors size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Edit Clip Boundaries</h3>
              <p className={`text-xs ${getConfidenceColor(clip.confidence)}`}>
                {clip.confidence.toFixed(0)}% confidence • {clip.reason}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              type="button"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              type="button"
              title="Reset to original"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>
      {}
      <div className="p-4">
        <div className="relative h-16 bg-zinc-900 rounded-lg overflow-hidden mb-4">
          {}
          <div className="absolute inset-0 bg-zinc-800 opacity-50" />
          {}
          <div
            className="absolute top-0 bottom-0 bg-blue-600/30 border-2 border-blue-500 rounded"
            style={{
              left: `${(startTime / videoDuration) * 100}%`,
              width: `${((endTime - startTime) / videoDuration) * 100}%`,
            }}
          />
          {}
          {isPlaying && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{
                left: `${(currentPreviewTime / videoDuration) * 100}%`,
              }}
            />
          )}
          {}
          <div
            className="absolute top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-400 transition-colors"
            style={{ left: `${(startTime / videoDuration) * 100}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startValue = startTime;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaTime = (deltaX / 400) * videoDuration; 
                handleStartTimeChange(startValue + deltaTime);
              };
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
          {}
          <div
            className="absolute top-0 bottom-0 w-2 bg-blue-500 cursor-ew-resize hover:bg-blue-400 transition-colors"
            style={{ left: `${(endTime / videoDuration) * 100}%` }}
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startValue = endTime;
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaTime = (deltaX / 400) * videoDuration;
                handleEndTimeChange(startValue + deltaTime);
              };
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />
        </div>
        {}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Start Time
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={startTime.toFixed(2)}
                onChange={(e) => handleStartTimeChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                max={endTime - minClipDuration}
                className="flex-1 px-2 py-1 bg-zinc-800 border border-white/10 rounded text-xs text-white"
              />
              <span className="text-xs text-zinc-500 font-mono">
                {formatTime(startTime)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              End Time
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={endTime.toFixed(2)}
                onChange={(e) => handleEndTimeChange(parseFloat(e.target.value) || 0)}
                step="0.1"
                min={startTime + minClipDuration}
                max={videoDuration}
                className="flex-1 px-2 py-1 bg-zinc-800 border border-white/10 rounded text-xs text-white"
              />
              <span className="text-xs text-zinc-500 font-mono">
                {formatTime(endTime)}
              </span>
            </div>
          </div>
        </div>
        {}
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-zinc-400">Duration:</span>
          <span className={`font-mono ${clipDuration > maxClipDuration ? 'text-red-400' : clipDuration < minClipDuration ? 'text-yellow-400' : 'text-green-400'}`}>
            {formatTime(clipDuration)}
          </span>
        </div>
        {}
        {clipDuration > maxClipDuration && (
          <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">
              Clip is too long (max {maxClipDuration}s). Consider shortening it.
            </p>
          </div>
        )}
        {clipDuration < minClipDuration && (
          <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400">
              Clip is very short (min {minClipDuration}s). Consider extending it.
            </p>
          </div>
        )}
      </div>
      {}
      <div className="p-4 border-t border-white/5 flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
          type="button"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={clipDuration < minClipDuration || clipDuration > maxClipDuration}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          type="button"
        >
          <Check size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
};