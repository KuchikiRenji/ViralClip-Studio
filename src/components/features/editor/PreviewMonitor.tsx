import { RefObject } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, ArrowRightToLine, ArrowLeftToLine, Download as InsertIcon } from 'lucide-react';
import { MediaAsset } from '../../../types';
import { ActiveMonitor } from './types';
interface PreviewMonitorProps {
  activeMonitor: ActiveMonitor;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  sourceAsset: MediaAsset | null;
  sourceTime: number;
  sourceInPoint: number;
  sourceOutPoint: number;
  isPlayingSource: boolean;
  onMonitorChange: (monitor: ActiveMonitor) => void;
  onPlayPause: () => void;
  onSeek: (delta: number) => void;
  onSourcePlayPause: () => void;
  onSourceSeek: (time: number) => void;
  onSetInPoint: () => void;
  onSetOutPoint: () => void;
  onInsertToTimeline: () => void;
}
export const PreviewMonitor = ({
  activeMonitor,
  canvasRef,
  currentTime,
  duration,
  isPlaying,
  sourceAsset,
  sourceTime,
  sourceInPoint,
  sourceOutPoint,
  isPlayingSource,
  onMonitorChange,
  onPlayPause,
  onSeek,
  onSourcePlayPause,
  onSourceSeek,
  onSetInPoint,
  onSetOutPoint,
  onInsertToTimeline,
}) => {
  return (
    <div className="col-span-6 bg-background flex flex-col relative border-r border-white/5 overflow-hidden">
      <div className="h-10 bg-background border-b border-white/5 flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={() => onMonitorChange('source')}
          className={`text-xs font-bold py-2 px-4 rounded-t-lg border-b-2 transition-all ${activeMonitor === 'source' ? 'text-blue-400 border-blue-500 bg-blue-500/10' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          Source (Clip)
        </button>
        <button
          onClick={() => onMonitorChange('program')}
          className={`text-xs font-bold py-2 px-4 rounded-t-lg border-b-2 transition-all ${activeMonitor === 'program' ? 'text-purple-400 border-purple-500 bg-purple-500/10' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          Program (Timeline)
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-background to-black relative">
        <div className="aspect-[9/16] h-full max-h-full bg-black shadow-2xl relative border border-white/5 overflow-hidden ring-1 ring-white/10">
          <canvas ref={canvasRef} width={1080} height={1920} className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="h-14 bg-background border-t border-white/5 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="w-1/3 text-xs font-mono text-gray-400">
          {activeMonitor === 'source' ? (
            <span className="text-blue-500">SRC: {sourceTime.toFixed(2)}s</span>
          ) : (
            <span className="text-purple-500">PRG: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
          )}
        </div>
        <div className="flex items-center gap-6 w-1/3 justify-center">
          {activeMonitor === 'source' ? (
            <>
              <div className="flex gap-1 mr-4 border-r border-white/10 pr-4">
                <button title="Mark In" onClick={onSetInPoint} className="p-1 hover:text-blue-400 text-gray-500"><ArrowRightToLine size={16} /></button>
                <button title="Mark Out" onClick={onSetOutPoint} className="p-1 hover:text-blue-400 text-gray-500"><ArrowLeftToLine size={16} /></button>
              </div>
              <button onClick={() => onSourceSeek(Math.max(0, sourceTime - 1))} className="text-gray-400 hover:text-white"><SkipBack size={20} /></button>
              <button onClick={onSourcePlayPause} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
                {isPlayingSource ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-1" />}
              </button>
              <button onClick={() => onSourceSeek(Math.min((sourceAsset?.duration || 10), sourceTime + 1))} className="text-gray-400 hover:text-white"><SkipForward size={20} /></button>
              <button title="Insert to Timeline" onClick={onInsertToTimeline} disabled={!sourceAsset} className="ml-4 p-2 bg-zinc-800 rounded-lg hover:bg-white/20 text-white disabled:opacity-30"><InsertIcon size={16} /></button>
            </>
          ) : (
            <>
              <button onClick={() => onSeek(-5)} className="text-gray-400 hover:text-white"><SkipBack size={20} /></button>
              <button onClick={onPlayPause} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10">
                {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-1" />}
              </button>
              <button onClick={() => onSeek(5)} className="text-gray-400 hover:text-white"><SkipForward size={20} /></button>
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-4 w-1/3">
          {activeMonitor === 'source' && (
            <div className="flex flex-col items-end text-[9px] text-gray-600">
              <span>In: {sourceInPoint.toFixed(1)}s</span>
              <span>Out: {sourceOutPoint.toFixed(1)}s</span>
            </div>
          )}
          <Volume2 size={16} className="text-gray-500" />
        </div>
      </div>
      {activeMonitor === 'source' && sourceAsset && (
        <div
          className="h-4 bg-zinc-900 relative cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            onSourceSeek(pct * (sourceAsset.duration || 10));
          }}
        >
          <div
            className="absolute top-0 bottom-0 bg-blue-900/30"
            style={{
              left: `${(sourceInPoint / (sourceAsset.duration || 10)) * 100}%`,
              width: `${((sourceOutPoint - sourceInPoint) / (sourceAsset.duration || 10)) * 100}%`,
            }}
          />
          <div className="absolute top-0 bottom-0 w-1 bg-blue-500" style={{ left: `${(sourceTime / (sourceAsset.duration || 10)) * 100}%` }} />
        </div>
      )}
    </div>
  );
};