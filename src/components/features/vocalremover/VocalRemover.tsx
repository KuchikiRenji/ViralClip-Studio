import { useRef, useCallback, useState } from 'react';
import { ArrowLeft, Upload, Download, RefreshCw, Loader2, CheckCircle2, AlertCircle, Music, Play, Pause, Mic2, Volume2 } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { formatTime } from '../../../lib/formatters';
import { VocalRemoverProps } from './types';
import { useVocalRemover } from './useVocalRemover';

export const VocalRemover = ({ onBack }: VocalRemoverProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeTrack, setActiveTrack] = useState<'original' | 'vocals' | 'instrumental'>('original');
  const [isPlaying, setIsPlaying] = useState(false);
  const { processing, audioData, processAudio, reset, download } = useVocalRemover();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!requireSubscription('Vocal Remover')) return;
      processAudio(file);
    }
  }, [processAudio, requireSubscription]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!requireSubscription('Vocal Remover')) return;
      processAudio(file);
    }
  }, [processAudio, requireSubscription]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const getTrackUrl = useCallback(() => {
    if (activeTrack === 'vocals') return audioData.vocals;
    if (activeTrack === 'instrumental') return audioData.instrumental;
    return audioData.original;
  }, [activeTrack, audioData]);


  const renderUploadZone = () => (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-zinc-700 hover:border-teal-500 rounded-2xl p-8 sm:p-12 cursor-pointer transition-all bg-zinc-900/30 hover:bg-zinc-900/50 group"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/flac,.mp3,.wav,.flac"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload size={28} className="text-teal-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('vocalRemover.uploadTitle')}
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          {t('vocalRemover.uploadDesc')}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <span className="px-2 py-1 bg-zinc-800 rounded">MP3</span>
          <span className="px-2 py-1 bg-zinc-800 rounded">WAV</span>
          <span className="px-2 py-1 bg-zinc-800 rounded">FLAC</span>
          <span className="text-zinc-600">•</span>
          <span>{t('vocalRemover.maxSize')}</span>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-zinc-700 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-transparent border-t-teal-500 rounded-full animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} className="text-teal-400 animate-spin" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {t('vocalRemover.processing')}
      </h3>
      <p className="text-zinc-400 mb-4">{t('vocalRemover.processingDesc')}</p>
      <div className="w-64 h-2 bg-zinc-800 rounded-full mx-auto overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
          style={{ width: `${processing.progress}%` }}
        />
      </div>
      <span className="text-sm text-zinc-500 mt-2 block">{processing.progress}%</span>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        src={getTrackUrl() || undefined}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="bg-zinc-800/50 rounded-xl p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center transition-colors"
            type="button"
          >
            {isPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white ml-0.5" />}
          </button>
          <div className="flex-1">
            <p className="text-white font-medium truncate">{audioData.fileName}</p>
            <p className="text-sm text-zinc-400">{formatTime(audioData.duration)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(['original', 'vocals', 'instrumental'] as const).map((track) => (
            <button
              key={track}
              onClick={() => {
                setActiveTrack(track);
                setIsPlaying(false);
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTrack === track
                  ? 'bg-teal-500 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
              type="button"
            >
              {track === 'original' && <Volume2 size={14} />}
              {track === 'vocals' && <Mic2 size={14} />}
              {track === 'instrumental' && <Music size={14} />}
              {t(`vocalRemover.${track}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => download('vocals')}
          className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
          type="button"
        >
          <Mic2 size={18} />
          {t('vocalRemover.downloadVocals')}
        </button>
        <button
          onClick={() => download('instrumental')}
          className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
          type="button"
        >
          <Music size={18} />
          {t('vocalRemover.downloadInstrumental')}
        </button>
        <button
          onClick={() => download('both')}
          className="px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20"
          type="button"
        >
          <Download size={18} />
          {t('vocalRemover.downloadBoth')}
        </button>
      </div>

      <button
        onClick={reset}
        className="w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
        type="button"
      >
        <RefreshCw size={18} />
        {t('vocalRemover.newAudio')}
      </button>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{t('vocalRemover.error')}</h3>
      <p className="text-zinc-400 mb-6">{processing.errorMessage}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors"
        type="button"
      >
        <RefreshCw size={18} />
        {t('common.tryAgain')}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b border-zinc-800 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Music size={20} className="text-teal-400" />
          <h1 className="text-lg sm:text-xl font-semibold">{t('vocalRemover.title')}</h1>
        </div>
        {processing.status === 'complete' && (
          <div className="ml-auto flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={18} />
            <span className="text-sm hidden sm:inline">{t('vocalRemover.complete')}</span>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 sm:p-8">
            {processing.status === 'idle' && renderUploadZone()}
            {(processing.status === 'loading' || processing.status === 'processing') && renderProcessing()}
            {processing.status === 'complete' && renderResult()}
            {processing.status === 'error' && renderError()}
          </div>

          <div className="mt-6 p-4 bg-zinc-900/30 border border-white/5 rounded-xl">
            <h4 className="text-sm font-medium text-white mb-2">{t('vocalRemover.howItWorks')}</h4>
            <p className="text-xs text-zinc-400">{t('vocalRemover.howItWorksDesc')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

