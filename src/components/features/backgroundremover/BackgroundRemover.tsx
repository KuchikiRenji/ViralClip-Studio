import { useRef, useCallback, useState } from 'react';
import { ArrowLeft, Upload, Download, RefreshCw, Loader2, CheckCircle2, AlertCircle, Eraser, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import { BackgroundRemoverProps } from './types';
import { useBackgroundRemover } from './useBackgroundRemover';

export const BackgroundRemover = ({ onBack }: BackgroundRemoverProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const { processing, imageData, processImage, reset, downloadProcessed } = useBackgroundRemover();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!requireSubscription('Background Remover')) return;
      processImage(file);
    }
  }, [processImage, requireSubscription]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!requireSubscription('Background Remover')) return;
      processImage(file);
    }
  }, [processImage, requireSubscription]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const renderUploadZone = () => (
    <div
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-2xl p-8 sm:p-12 cursor-pointer transition-all bg-zinc-900/30 hover:bg-zinc-900/50 group"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload size={28} className="text-rose-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('backgroundRemover.uploadTitle')}
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          {t('backgroundRemover.uploadDesc')}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <span className="px-2 py-1 bg-zinc-800 rounded">PNG</span>
          <span className="px-2 py-1 bg-zinc-800 rounded">JPG</span>
          <span className="px-2 py-1 bg-zinc-800 rounded">WEBP</span>
          <span className="text-zinc-600">•</span>
          <span>{t('backgroundRemover.maxSize')}</span>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-zinc-700 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-transparent border-t-rose-500 rounded-full animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={24} className="text-rose-400 animate-spin" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {t('backgroundRemover.processing')}
      </h3>
      <p className="text-zinc-400 mb-4">{t('backgroundRemover.processingDesc')}</p>
      <div className="w-64 h-2 bg-zinc-800 rounded-full mx-auto overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
          style={{ width: `${processing.progress}%` }}
        />
      </div>
      <span className="text-sm text-zinc-500 mt-2 block">{processing.progress}%</span>
    </div>
  );

  const renderResult = () => (
    <div className="space-y-6">
      <div className="relative aspect-square max-w-lg mx-auto rounded-2xl overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMjIyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMyMjIiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]">
        <img
          src={showOriginal ? imageData.original! : imageData.processed!}
          alt={showOriginal ? 'Original' : 'Processed'}
          className="w-full h-full object-contain"
        />
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="absolute bottom-4 left-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-sm text-white flex items-center gap-2 hover:bg-black/90 transition-colors"
          type="button"
        >
          {showOriginal ? <EyeOff size={16} /> : <Eye size={16} />}
          {showOriginal ? t('backgroundRemover.showProcessed') : t('backgroundRemover.showOriginal')}
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={downloadProcessed}
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-medium rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20"
          type="button"
        >
          <Download size={18} />
          {t('backgroundRemover.download')}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl flex items-center gap-2 transition-colors"
          type="button"
        >
          <RefreshCw size={18} />
          {t('backgroundRemover.newImage')}
        </button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{t('backgroundRemover.error')}</h3>
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
          <Eraser size={20} className="text-rose-400" />
          <h1 className="text-lg sm:text-xl font-semibold">{t('backgroundRemover.title')}</h1>
        </div>
        {processing.status === 'complete' && (
          <div className="ml-auto flex items-center gap-2 text-emerald-400">
            <CheckCircle2 size={18} />
            <span className="text-sm hidden sm:inline">{t('backgroundRemover.complete')}</span>
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
            <h4 className="text-sm font-medium text-white mb-2">{t('backgroundRemover.howItWorks')}</h4>
            <p className="text-xs text-zinc-400">{t('backgroundRemover.howItWorksDesc')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

