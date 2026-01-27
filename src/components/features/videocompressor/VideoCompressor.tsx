import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Upload, Download, RefreshCw, Film, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { downloadBlob } from '../../../utils/videoExport';
import { ffmpegEngine, type ExportQuality } from '../../../lib/ffmpegEngine';
import { useMediaFile } from '../media-tools/shared/useMediaFile';
import { useFfmpegTask } from '../media-tools/shared/useFfmpegTask';
import type { VideoCompressorProps } from './types';

const QUALITY_OPTIONS: { value: ExportQuality; labelKey: string; hintKey: string }[] = [
  { value: '720p', labelKey: 'videoCompressor.quality.720', hintKey: 'videoCompressor.qualityHint.720' },
  { value: '1080p', labelKey: 'videoCompressor.quality.1080', hintKey: 'videoCompressor.qualityHint.1080' },
  { value: '4k', labelKey: 'videoCompressor.quality.4k', hintKey: 'videoCompressor.qualityHint.4k' },
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const VideoCompressor = ({ onBack }: VideoCompressorProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const inputRef = useRef<HTMLInputElement>(null);
  const { selected, error, accept, selectFile, clear } = useMediaFile('video');
  const { state, reset, setOutput, run } = useFfmpegTask();

  const [quality, setQuality] = useState<ExportQuality>('1080p');
  const [fps, setFps] = useState(30);
  const [targetVideoBitrateMbps, setTargetVideoBitrateMbps] = useState(6);

  const canRun = Boolean(selected?.file) && state.status !== 'loading' && state.status !== 'processing';

  const outputName = useMemo(() => {
    if (!selected) return `zitro-video-${Date.now()}.mp4`;
    const base = selected.name.replace(/\.[^/.]+$/, '');
    return `${base}-compressed.mp4`;
  }, [selected]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0]);
    reset();
    setOutput(null);
  }, [reset, selectFile, setOutput]);

  const handleCompress = useCallback(async () => {
    if (!selected) return;
    if (!requireSubscription('Video Compressor')) return;
    const bitrate = clamp(Math.round(targetVideoBitrateMbps * 1_000_000), 500_000, 50_000_000);
    const result = await run(() =>
      ffmpegEngine.exportVideo(selected.file, {
        format: 'mp4',
        quality,
        fps: clamp(fps, 24, 60),
        includeAudio: true,
        videoBitrate: bitrate,
      })
    );
    if (result) setOutput(result);
  }, [fps, quality, run, selected, setOutput, targetVideoBitrateMbps]);

  const handleDownload = useCallback(() => {
    if (!state.output) return;
    downloadBlob(state.output, outputName);
  }, [outputName, state.output]);

  const handleReset = useCallback(() => {
    clear();
    reset();
  }, [clear, reset]);

  const bitrateLabel = useMemo(() => `${targetVideoBitrateMbps.toFixed(1)} Mbps`, [targetVideoBitrateMbps]);

  return (
    <div className="h-dvh min-h-screen bg-background text-white font-sans flex flex-col overflow-hidden">
      <header className="min-h-14 bg-background border-b border-white/5 flex items-center justify-between px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95 shrink-0"
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate">{t('videoCompressor.title')}</h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{t('videoCompressor.subtitle')}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
          <Film size={14} />
          <span>{t('videoCompressor.badge')}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 sm:p-6 space-y-4">
            <input ref={inputRef} type="file" accept={accept} onChange={handleSelect} className="hidden" />

            {!selected && (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-2xl p-10 sm:p-12 transition-colors bg-zinc-900/30 hover:bg-zinc-900/40 text-left"
                type="button"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Upload size={22} className="text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold">{t('videoCompressor.uploadTitle')}</div>
                    <div className="text-xs text-zinc-500 mt-1">{t('videoCompressor.uploadDesc')}</div>
                  </div>
                </div>
              </button>
            )}

            {selected && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Film size={18} className="text-blue-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{selected.name}</div>
                    <div className="text-xs text-zinc-500">
                      {(selected.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                  <button
                    onClick={handleReset}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors touch-target"
                    type="button"
                  >
                    <RefreshCw size={14} className="inline-block mr-2" />
                    {t('common.reset')}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-3">
                    <div className="text-sm font-semibold text-white">{t('videoCompressor.settings')}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {QUALITY_OPTIONS.map((q) => (
                        <button
                          key={q.value}
                          onClick={() => setQuality(q.value)}
                          className={`p-3 rounded-xl border text-left transition-colors touch-target ${
                            quality === q.value
                              ? 'bg-blue-600/20 border-blue-500'
                              : 'bg-zinc-800/50 border-white/10 hover:border-white/20'
                          }`}
                          type="button"
                        >
                          <div className="text-white font-medium">{t(q.labelKey)}</div>
                          <div className="text-xs text-zinc-500 mt-1">{t(q.hintKey)}</div>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-zinc-400">{t('videoCompressor.bitrate')}</div>
                          <div className="text-sm text-white font-mono">{bitrateLabel}</div>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          step={0.5}
                          value={targetVideoBitrateMbps}
                          onChange={(e) => setTargetVideoBitrateMbps(parseFloat(e.target.value))}
                          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-zinc-400">{t('videoCompressor.fps')}</div>
                          <div className="text-sm text-white font-mono">{fps}</div>
                        </div>
                        <input
                          type="range"
                          min={24}
                          max={60}
                          step={1}
                          value={fps}
                          onChange={(e) => setFps(parseInt(e.target.value, 10))}
                          className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-white">{t('videoCompressor.actions')}</div>
                    <button
                      onClick={handleCompress}
                      disabled={!canRun}
                      className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors touch-target flex items-center justify-center gap-2"
                      type="button"
                      aria-busy={state.status === 'loading' || state.status === 'processing'}
                    >
                      {(state.status === 'loading' || state.status === 'processing') ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>{t('common.processing')} {state.progress}%</span>
                        </>
                      ) : (
                        <span>{t('videoCompressor.compress')}</span>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!state.output || state.status === 'loading' || state.status === 'processing'}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors touch-target flex items-center justify-center gap-2"
                      type="button"
                    >
                      <Download size={18} />
                      {t('videoCompressor.download')}
                    </button>
                  </div>
                </div>

                {state.status === 'error' && state.error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span className="min-w-0">{state.error}</span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="min-w-0">{error}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};


