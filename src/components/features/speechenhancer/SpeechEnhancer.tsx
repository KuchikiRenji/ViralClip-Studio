import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Upload, Download, RefreshCw, Mic2, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { downloadBlob } from '../../../utils/videoExport';
import { ffmpegEngine } from '../../../lib/ffmpegEngine';
import { useMediaFile } from '../media-tools/shared/useMediaFile';
import { useFfmpegTask } from '../media-tools/shared/useFfmpegTask';
import type { SpeechEnhancerProps } from './types';

const getExtension = (filename: string) => {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.slice(idx + 1).toLowerCase();
};

export const SpeechEnhancer = ({ onBack }: SpeechEnhancerProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const inputRef = useRef<HTMLInputElement>(null);
  const { selected, error, accept, selectFile, clear } = useMediaFile('audio');
  const { state, reset, setOutput, run } = useFfmpegTask();

  const [strength, setStrength] = useState(55);

  const canRun = Boolean(selected?.file) && state.status !== 'loading' && state.status !== 'processing';

  const outputName = useMemo(() => {
    if (!selected) return `zitro-speech-${Date.now()}.mp3`;
    const base = selected.name.replace(/\.[^/.]+$/, '');
    return `${base}-enhanced.mp3`;
  }, [selected]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0]);
    reset();
    setOutput(null);
  }, [reset, selectFile, setOutput]);

  const handleEnhance = useCallback(async () => {
    if (!selected) return;
    if (!requireSubscription('Speech Enhancer')) return;
    const ext = getExtension(selected.name);
    const result = await run(() => ffmpegEngine.enhanceSpeech(selected.file, ext, strength));
    if (result) setOutput(result);
  }, [run, selected, setOutput, strength]);

  const handleDownload = useCallback(() => {
    if (!state.output) return;
    downloadBlob(state.output, outputName);
  }, [outputName, state.output]);

  const handleReset = useCallback(() => {
    clear();
    reset();
  }, [clear, reset]);

  const strengthLabel = useMemo(() => `${strength}%`, [strength]);

  return (
    <div className="h-dvh min-h-screen bg-background text-white font-sans flex flex-col overflow-hidden">
      <header className="min-h-14 bg-background border-b border-white/5 flex items-center justify-between px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onBack}
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-all active:scale-95 touch-target"
            type="button"
            aria-label={t('common.goBack')}
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate">{t('speechEnhancer.title')}</h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{t('speechEnhancer.subtitle')}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
          <Mic2 size={14} />
          <span>{t('speechEnhancer.badge')}</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
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
                    <div className="text-white font-semibold">{t('speechEnhancer.uploadTitle')}</div>
                    <div className="text-xs text-zinc-500 mt-1">{t('speechEnhancer.uploadDesc')}</div>
                  </div>
                </div>
              </button>
            )}

            {selected && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50 border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Mic2 size={18} className="text-blue-300" />
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

                <div className="p-4 rounded-xl bg-zinc-800/40 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-400">{t('speechEnhancer.strength')}</div>
                    <div className="text-sm text-white font-mono">{strengthLabel}</div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={strength}
                    onChange={(e) => setStrength(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="text-xs text-zinc-500">{t('speechEnhancer.hint')}</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleEnhance}
                    disabled={!canRun}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors touch-target flex items-center justify-center gap-2"
                    type="button"
                    aria-busy={state.status === 'loading' || state.status === 'processing'}
                  >
                    {(state.status === 'loading' || state.status === 'processing') ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>{t('common.processing')} {state.progress}%</span>
                      </>
                    ) : (
                      <span>{t('speechEnhancer.enhance')}</span>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={!state.output || state.status === 'loading' || state.status === 'processing'}
                    className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors touch-target flex items-center justify-center gap-2"
                    type="button"
                  >
                    <Download size={18} />
                    {t('speechEnhancer.download')}
                  </button>
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


