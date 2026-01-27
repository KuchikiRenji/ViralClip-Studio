import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { 
  downloadBlob, 
  generateFilename, 
  estimateFileSize, 
  WEBM_MIME_TYPE, 
  isWebMSupported,
  DEFAULT_EXPORT_CONFIG 
} from '../../../utils/videoExport';
import { ExportSettings, ExportSettingsState, QUALITY_OPTIONS, EXPORT_PRESETS } from './ExportSettings';
import { ExportProgress } from './ExportProgress';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { Clip } from '../../../types';
import { VideoPreviewCanvasHandle } from './VideoPreviewCanvas';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  clips?: Clip[];
  canvasHandleRef?: React.RefObject<VideoPreviewCanvasHandle | null>;
}

const DEFAULT_SETTINGS: ExportSettingsState = {
  preset: 'TikTok',
  quality: '1080p',
  fps: 30,
  includeAudio: true,
  includeCaptions: true,
  addWatermark: false,
};

export const ExportModal = ({ 
  isOpen, 
  onClose,
  duration = 30,
  clips = [],
  canvasHandleRef,
}: ExportModalProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const [settings, setSettings] = useState<ExportSettingsState>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportPhase, setExportPhase] = useState<'preparing' | 'rendering' | 'encoding' | 'complete'>('preparing');
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const getPresetInfo = useCallback(() => {
    return EXPORT_PRESETS.find(p => p.name === settings.preset) ?? EXPORT_PRESETS[0];
  }, [settings.preset]);

  const getVideoBitrate = useCallback((): number => {
    const option = QUALITY_OPTIONS.find(q => q.value === settings.quality);
    return option?.bitrate ?? DEFAULT_EXPORT_CONFIG.videoBitrate;
  }, [settings.quality]);

  const getQualityMultiplier = useCallback((): number => {
    const option = QUALITY_OPTIONS.find(q => q.value === settings.quality);
    return option?.multiplier ?? 1;
  }, [settings.quality]);

  const estimatedSizeValue = useCallback(() => {
    return estimateFileSize(duration, getVideoBitrate(), DEFAULT_EXPORT_CONFIG.audioBitrate).toFixed(1);
  }, [duration, getVideoBitrate]);

  const handleCancelExport = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsExporting(false);
    setExportProgress(0);
    setExportPhase('preparing');
  }, []);

  const handleExport = useCallback(async () => {
    if (!canvasHandleRef?.current) {
      setExportError('Preview canvas not found. Please try again.');
      return;
    }

    if (!requireSubscription('Export')) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportPhase('preparing');
    setExportComplete(false);
    setExportedBlob(null);
    setExportError(null);
    chunksRef.current = [];

    const presetInfo = getPresetInfo();
    const multiplier = getQualityMultiplier();
    const exportWidth = Math.round(presetInfo.width * multiplier);
    const exportHeight = Math.round(presetInfo.height * multiplier);

    try {
      if (!isWebMSupported()) {
        throw new Error('WebM format not supported in this browser. Please use Chrome or Firefox.');
      }

      setExportPhase('rendering');

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      const stream = canvas.captureStream(settings.fps);

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: WEBM_MIME_TYPE,
        videoBitsPerSecond: getVideoBitrate(),
      });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        setExportPhase('encoding');
        setTimeout(() => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          setExportedBlob(blob);
          setExportProgress(100);
          setExportPhase('complete');
          setExportComplete(true);
          setIsExporting(false);
        }, 500);
      };

      mediaRecorderRef.current.start(100);

      const totalFrames = Math.max(1, duration * settings.fps);
      let currentFrame = 0;

      const renderNextFrame = () => {
        if (currentFrame >= totalFrames || !isExporting) {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          return;
        }

        const currentTime = currentFrame / settings.fps;
        
        // Use the handle to render the specific frame to our export canvas
        canvasHandleRef.current?.renderFrame(currentTime, ctx, exportWidth, exportHeight);

        // Add Watermark if enabled
        if (settings.addWatermark) {
          ctx.save();
          ctx.font = `bold ${Math.round(exportHeight * 0.02)}px Arial`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.textAlign = 'right';
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 4;
          ctx.fillText('Made with Zitro.AI', exportWidth - 20, exportHeight - 20);
          ctx.restore();
        }

        currentFrame++;
        setExportProgress(Math.round((currentFrame / totalFrames) * 100));
        
        animationFrameRef.current = requestAnimationFrame(renderNextFrame);
      };

      animationFrameRef.current = requestAnimationFrame(renderNextFrame);

    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setIsExporting(false);
    }
  }, [canvasHandleRef, settings, duration, getPresetInfo, getQualityMultiplier, getVideoBitrate, isExporting]);

  const handleDownload = useCallback(() => {
    if (exportedBlob) {
      const presetInfo = getPresetInfo();
      const filename = generateFilename(`${presetInfo.name.toLowerCase()}_video`, 'webm');
      downloadBlob(exportedBlob, filename);
    }
    onClose();
  }, [exportedBlob, getPresetInfo, onClose]);

  const handleExportAgain = useCallback(() => {
    setExportComplete(false);
    setExportedBlob(null);
    setExportProgress(0);
    setExportPhase('preparing');
    setExportError(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      handleCancelExport();
      setExportComplete(false);
      setExportedBlob(null);
      setExportError(null);
    }
  }, [isOpen, handleCancelExport]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isExporting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-surface-dark border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-full sm:max-w-[560px] shadow-2xl relative max-h-[95vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-surface-dark z-10 p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Download size={20} className="text-blue-500" /> 
              {t('export.title')}
            </h2>
            <button 
              onClick={onClose} 
              disabled={isExporting} 
              className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
          {exportError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{exportError}</p>
            </div>
          )}

          {!isExporting && !exportComplete && (
            <ExportSettings
              settings={settings}
              showAdvanced={showAdvanced}
              duration={duration}
              clipCount={clips.length}
              estimatedSize={estimatedSizeValue()}
              onSettingsChange={(updates) => setSettings(prev => ({ ...prev, ...updates }))}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            />
          )}

          {(isExporting || exportComplete) && (
            <ExportProgress
              exportProgress={exportProgress}
              exportPhase={exportPhase}
              exportComplete={exportComplete}
            />
          )}

          <div className="flex gap-3 pt-2">
            {!isExporting && !exportComplete && (
              <>
                <button 
                  onClick={onClose} 
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                  type="button"
                >
                  {t('export.cancel')}
                </button>
                <button 
                  onClick={handleExport} 
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
                  type="button"
                >
                  <Download size={16} />
                  {t('export.startExport')}
                </button>
              </>
            )}

            {exportComplete && (
              <div className="flex gap-3 w-full">
                <button 
                  onClick={handleExportAgain} 
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl"
                  type="button"
                >
                  {t('export.exportAgain')}
                </button>
                <button 
                  onClick={handleDownload} 
                  className="flex-[2] py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors"
                  type="button"
                >
                  <Download size={16} />
                  {t('export.downloadVideo')}
                </button>
              </div>
            )}

            {isExporting && !exportComplete && (
              <button 
                onClick={handleCancelExport} 
                className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-xl transition-colors"
                type="button"
              >
                {t('export.cancelExport')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
