import { useState, useCallback, useEffect, RefObject } from 'react';
import { 
  Download, 
  X, 
  Loader2, 
  Check, 
  AlertCircle, 
  Settings2,
  Film,
  Music,
  Image,
  Cpu,
  HardDrive,
  Clock,
  ChevronDown,
  Play
} from 'lucide-react';
import { ffmpegEngine, ExportFormat, ExportQuality, ExportOptions, FFmpegEngineState } from '../../../lib/ffmpegEngine';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { BottomSheet } from '../../shared/BottomSheet';

interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  duration: number;
  videoBlob?: Blob;
  canvasRef?: RefObject<HTMLCanvasElement>;
  onExportComplete?: (blob: Blob) => void;
}

type ExportPreset = 'tiktok' | 'youtube' | 'instagram' | 'twitter' | 'custom';

interface PresetConfig {
  id: ExportPreset;
  label: string;
  description: string;
  format: ExportFormat;
  quality: ExportQuality;
  fps: number;
  aspectRatio: string;
}

const EXPORT_PRESETS: PresetConfig[] = [
  { id: 'tiktok', label: 'TikTok', description: '9:16 Vertical', format: 'mp4', quality: '1080p', fps: 30, aspectRatio: '9:16' },
  { id: 'youtube', label: 'YouTube', description: '16:9 Horizontal', format: 'mp4', quality: '1080p', fps: 30, aspectRatio: '16:9' },
  { id: 'instagram', label: 'Instagram', description: '1:1 Square', format: 'mp4', quality: '1080p', fps: 30, aspectRatio: '1:1' },
  { id: 'twitter', label: 'Twitter/X', description: '16:9 Horizontal', format: 'mp4', quality: '720p', fps: 30, aspectRatio: '16:9' },
  { id: 'custom', label: 'Custom', description: 'Configure manually', format: 'mp4', quality: '1080p', fps: 30, aspectRatio: '9:16' },
];

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'mp4', label: 'MP4 (H.264)', description: 'Best compatibility', icon: Film },
  { value: 'webm', label: 'WebM (VP9)', description: 'Web optimized', icon: Film },
  { value: 'gif', label: 'Animated GIF', description: 'No audio, loops', icon: Image },
];

const QUALITY_OPTIONS: { value: ExportQuality; label: string; resolution: string; bitrate: string }[] = [
  { value: '720p', label: 'HD', resolution: '720×1280', bitrate: '5 Mbps' },
  { value: '1080p', label: 'Full HD', resolution: '1080×1920', bitrate: '10 Mbps' },
  { value: '4k', label: '4K Ultra HD', resolution: '2160×3840', bitrate: '35 Mbps' },
];

const FPS_OPTIONS = [24, 30, 60];

export const AdvancedExportModal = ({
  isOpen,
  onClose,
  duration,
  videoBlob,
  canvasRef,
  onExportComplete,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ExportPreset>('tiktok');
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [quality, setQuality] = useState<ExportQuality>('1080p');
  const [fps, setFps] = useState(30);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [ffmpegState, setFfmpegState] = useState<FFmpegEngineState>(ffmpegEngine.getState());
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const unsubscribe = ffmpegEngine.subscribe(setFfmpegState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isOpen && !ffmpegState.isLoaded && !ffmpegState.isLoading) {
      ffmpegEngine.load();
    }
  }, [isOpen, ffmpegState.isLoaded, ffmpegState.isLoading]);

  useEffect(() => {
    if (selectedPreset !== 'custom') {
      const preset = EXPORT_PRESETS.find(p => p.id === selectedPreset);
      if (preset) {
        setFormat(preset.format);
        setQuality(preset.quality);
        setFps(preset.fps);
      }
    }
  }, [selectedPreset]);

  const estimatedFileSize = useCallback((): string => {
    const qualitySettings: Record<ExportQuality, number> = {
      '720p': 5000000,
      '1080p': 10000000,
      '4k': 35000000,
    };
    
    const bitrate = qualitySettings[quality];
    const audioBitrate = includeAudio && format !== 'gif' ? 128000 : 0;
    const totalBitrate = bitrate + audioBitrate;
    const sizeBytes = (totalBitrate * duration) / 8;
    const sizeMB = sizeBytes / (1024 * 1024);
    
    return sizeMB < 1 ? `${(sizeMB * 1024).toFixed(0)} KB` : `${sizeMB.toFixed(1)} MB`;
  }, [quality, duration, includeAudio, format]);

  const estimatedTime = useCallback((): string => {
    const baseTime = duration * 2;
    const qualityMultiplier = quality === '4k' ? 3 : quality === '1080p' ? 2 : 1;
    const totalSeconds = baseTime * qualityMultiplier;
    
    if (totalSeconds < 60) return `~${Math.ceil(totalSeconds)}s`;
    return `~${Math.ceil(totalSeconds / 60)}min`;
  }, [duration, quality]);

  const handleExport = useCallback(async () => {
    if (!videoBlob && !canvasRef?.current) {
      setError('No video source available');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setError(null);
    setExportedBlob(null);

    try {
      const options: ExportOptions = {
        format,
        quality,
        fps,
        includeAudio: includeAudio && format !== 'gif',
      };

      let sourceBlob = videoBlob;
      
      if (!sourceBlob && canvasRef?.current) {
        const stream = canvasRef.current.captureStream(fps);
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];
        
        await new Promise<void>((resolve) => {
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), duration * 1000);
        });
        
        sourceBlob = new Blob(chunks, { type: 'video/webm' });
      }

      if (!sourceBlob) {
        throw new Error('Failed to create video source');
      }

      const result = await ffmpegEngine.exportVideo(
        sourceBlob,
        options,
        (progress) => setExportProgress(progress)
      );

      if (result) {
        setExportedBlob(result);
        setExportProgress(100);
        onExportComplete?.(result);
      } else {
        throw new Error('Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [videoBlob, canvasRef, format, quality, fps, includeAudio, duration, onExportComplete]);

  const handleDownload = useCallback(() => {
    if (!exportedBlob) return;
    
    const url = URL.createObjectURL(exportedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportedBlob, format]);

  const handleClose = useCallback(() => {
    if (!isExporting) {
      setExportedBlob(null);
      setExportProgress(0);
      setError(null);
      onClose();
    }
  }, [isExporting, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-6">

          {!ffmpegState.isLoaded && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                {ffmpegState.isLoading ? (
                  <Loader2 size={20} className="text-amber-400 animate-spin" />
                ) : (
                  <AlertCircle size={20} className="text-amber-400" />
                )}
                <div>
                  <div className="text-sm font-medium text-amber-300">
                    {ffmpegState.isLoading ? 'Loading export engine...' : 'Export engine not loaded'}
                  </div>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    {ffmpegState.isLoading 
                      ? 'This may take a moment on first load'
                      : 'Click export to initialize the engine'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isExporting && !exportedBlob && (
            <>
              <div className="space-y-3">
                <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Export Preset</span>
                <div className="grid grid-cols-2 gap-2">
                  {EXPORT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-3 rounded-xl border transition-all text-left ${
                        selectedPreset === preset.id
                          ? 'border-blue-500/50 bg-blue-500/10 ring-2 ring-blue-500/20'
                          : 'border-white/5 bg-zinc-800/30 hover:border-blue-500/30'
                      }`}
                      type="button"
                    >
                      <div className="text-sm font-medium text-white">{preset.label}</div>
                      <div className="text-[10px] text-zinc-500">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Format</span>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFormat(opt.value);
                          setSelectedPreset('custom');
                        }}
                        className={`p-3 rounded-xl border transition-all ${
                          format === opt.value
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-white/5 bg-zinc-800/30 hover:border-blue-500/30'
                        }`}
                        type="button"
                      >
                        <Icon size={16} className={format === opt.value ? 'text-blue-400' : 'text-zinc-500'} />
                        <div className="text-xs font-medium text-white mt-1.5">{opt.label}</div>
                        <div className="text-[9px] text-zinc-500">{opt.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Quality</span>
                <div className="grid grid-cols-3 gap-2">
                  {QUALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setQuality(opt.value);
                        setSelectedPreset('custom');
                      }}
                      className={`p-3 rounded-xl border transition-all ${
                        quality === opt.value
                          ? 'border-blue-500/50 bg-blue-500/10'
                          : 'border-white/5 bg-zinc-800/30 hover:border-blue-500/30'
                      }`}
                      type="button"
                    >
                      <div className="text-xs font-medium text-white">{opt.label}</div>
                      <div className="text-[9px] text-zinc-500">{opt.resolution}</div>
                      <div className="text-[9px] text-zinc-600">{opt.bitrate}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
                type="button"
              >
                <Settings2 size={14} />
                Advanced Settings
                <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-zinc-800/30 rounded-xl border border-white/5">
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Frame Rate</span>
                    <div className="flex gap-2">
                      {FPS_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFps(f)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            fps === f
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-700/50 text-zinc-400 hover:text-white'
                          }`}
                          type="button"
                        >
                          {f} fps
                        </button>
                      ))}
                    </div>
                  </div>

                  {format !== 'gif' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music size={14} className="text-zinc-400" />
                        <span className="text-xs text-white">Include Audio</span>
                      </div>
                      <button
                        onClick={() => setIncludeAudio(!includeAudio)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          includeAudio ? 'bg-blue-500' : 'bg-zinc-700'
                        }`}
                        type="button"
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                          includeAudio ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <HardDrive size={14} className="text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500">Est. Size</div>
                    <div className="text-xs text-white font-medium">{estimatedFileSize()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500">Est. Time</div>
                    <div className="text-xs text-white font-medium">{estimatedTime()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-zinc-500" />
                  <div>
                    <div className="text-[10px] text-zinc-500">Processing</div>
                    <div className="text-xs text-white font-medium">Client-side</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {isExporting && (
            <div className="space-y-4">
              <div className="p-6 bg-zinc-800/30 rounded-xl border border-white/5 text-center">
                <Loader2 size={40} className="text-blue-400 animate-spin mx-auto mb-4" />
                <div className="text-lg font-medium text-white mb-1">Exporting Video</div>
                <p className="text-xs text-zinc-500 mb-4">
                  {exportProgress < 30 ? 'Preparing...' : 
                   exportProgress < 80 ? 'Rendering frames...' : 
                   'Encoding...'}
                </p>
                <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="text-sm text-white font-medium mt-2">{exportProgress}%</div>
              </div>
            </div>
          )}

          {exportedBlob && (
            <div className="space-y-4">
              <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/30 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-400" />
                </div>
                <div className="text-lg font-medium text-white mb-1">Export Complete!</div>
                <p className="text-xs text-zinc-400">
                  Your video is ready to download
                </p>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-zinc-500">
                  <span>{format.toUpperCase()}</span>
                  <span>•</span>
                  <span>{(exportedBlob.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Export Failed</span>
              </div>
              <p className="text-xs text-red-400/80 mt-1">{error}</p>
            </div>
          )}
      </div>

      <div className="px-4 sm:px-6 py-4 border-t border-white/5 flex gap-3">
          {!isExporting && !exportedBlob && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={ffmpegState.isLoading}
                className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                type="button"
              >
                {ffmpegState.isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Start Export
                  </>
                )}
              </button>
            </>
          )}

          {isExporting && (
            <button
              onClick={() => setIsExporting(false)}
              className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-xl transition-colors"
              type="button"
            >
              Cancel Export
            </button>
          )}

          {exportedBlob && (
            <>
              <button
                onClick={() => {
                  setExportedBlob(null);
                  setExportProgress(0);
                }}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                type="button"
              >
                Export Again
              </button>
              <button
                onClick={handleDownload}
                className="flex-[2] py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                type="button"
              >
                <Download size={16} />
                Download Video
              </button>
            </>
          )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title="Export Video"
        showCloseButton={true}
        maxHeight="90vh"
      >
        {modalContent}
      </BottomSheet>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-dark border border-white/10 rounded-2xl w-full max-w-[560px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Download size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Export Video</h2>
              <p className="text-xs text-zinc-500">Choose format and quality</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="p-2 rounded-lg text-zinc-500 active:text-white active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        {modalContent}
      </div>
    </div>
  );
};


