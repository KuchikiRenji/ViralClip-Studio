import { useCallback, useState } from 'react';
import { ArrowLeft, ChevronRight, Upload, Scissors, Play, Pause, Volume2, VolumeX, Maximize2, CheckCircle } from 'lucide-react';
import { TikTokIcon, InstagramIcon, YouTubeIcon } from '../../shared/SocialIcons';
import { ASSETS } from '../../../constants/assets';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAutoClippingState } from './useAutoClippingState';
import { useAutoClippingUpload } from './useAutoClippingUpload';
import { useAutoClippingPreview } from './useAutoClippingPreview';
import { ClipList } from './ClipList';
import { ClipBoundaryEditor } from './ClipBoundaryEditor';
import { GeneratedClip } from './clipHelpers';

interface AutoClippingProps {
  onBack: () => void;
}

const formatTimeDisplay = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-400';
  if (score >= 80) return 'text-yellow-400';
  if (score >= 70) return 'text-orange-400';
  return 'text-red-400';
};

export const AutoClipping = ({ onBack }: AutoClippingProps) => {
  const { t } = useTranslation();
  const { state, setState, updateState, fileInputRef, videoRef, previewVideoRef } = useAutoClippingState();
  const [editingClip, setEditingClip] = useState<GeneratedClip | null>(null);
  const previewHandlers = useAutoClippingPreview({
    state,
    updateState,
    previewVideoRef,
  });
  const uploadHandlers = useAutoClippingUpload({
    state,
    updateState,
    videoRef,
    onAnalysisComplete: (clips) => {
      if (clips.length > 0) {
        previewHandlers.handlePreviewClip(clips[0]);
      }
    },
  });

  const toggleClipSelection = useCallback((clipId: string) => {
    setState(prev => {
      const newSet = new Set(prev.selectedClips);
      if (newSet.has(clipId)) {
        newSet.delete(clipId);
      } else {
        newSet.add(clipId);
      }
      return { ...prev, selectedClips: newSet };
    });
  }, [setState]);

  const selectAllClips = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedClips: prev.selectedClips.size === prev.generatedClips.length
        ? new Set()
        : new Set(prev.generatedClips.map((c) => c.id)),
    }));
  }, [setState]);

  const handleEditBoundaries = useCallback((clip: GeneratedClip) => {
    setEditingClip(clip);
  }, []);

  const handleSaveBoundaries = useCallback((clipId: string, startTime: number, endTime: number) => {
    setState(prev => ({
      ...prev,
      generatedClips: prev.generatedClips.map(clip =>
        clip.id === clipId
          ? {
              ...clip,
              startTimeSeconds: startTime,
              endTimeSeconds: endTime,
              duration: formatTimeDisplay(endTime - startTime),
            }
          : clip
      ),
    }));
    setEditingClip(null);
  }, [setState]);

  const handleCancelEdit = useCallback(() => {
    setEditingClip(null);
  }, []);

  return (
    <div className="min-h-dvh min-h-screen bg-background text-white font-sans flex flex-col">
      <header className="h-14 bg-background border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95 shrink-0"
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-white">{t('home.autoClipping')}</h1>
        </div>
        <button className="hidden sm:flex px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/5 items-center gap-2">
          {t('autoclipping.viewRecentlyCreated')}
          <ChevronRight size={16} />
        </button>
      </header>
      <div className="px-4 sm:px-6 py-3 border-b border-white/5 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateState({ activeTab: 'upload' })}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${
              state.activeTab === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800/50 text-zinc-400 hover:text-white'
            }`}
          >
            <Upload size={16} />
            <span className="hidden sm:inline">{t('autoclipping.uploadTab')}</span>
            <span className="sm:hidden">{t('autoclipping.uploadTabShort')}</span>
          </button>
          <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
          <button
            onClick={() => state.generatedClips.length > 0 && updateState({ activeTab: 'clips' })}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap ${
              state.activeTab === 'clips'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800/50 text-zinc-400 hover:text-white'
            } ${state.generatedClips.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Scissors size={16} />
            {t('autoclipping.clipsTab')}
          </button>
        </div>
      </div>
      {state.isAnalyzing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">{t('autoclipping.analyzing')}</h2>
            <p className="text-zinc-400 mb-4">{t('autoclipping.findingMoments')} ({state.analysisProgress}%)</p>
            <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${state.analysisProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {state.activeTab === 'upload' && (
          <div className="h-full flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="max-w-2xl w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-6 sm:mb-8">{t('autoclipping.uploadTitle')}</h2>
              <div
                onDragOver={uploadHandlers.handleDragOver}
                onDragLeave={uploadHandlers.handleDragLeave}
                onDrop={uploadHandlers.handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 sm:p-12 text-center transition-all ${
                  state.isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : state.uploadedFile
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    state.uploadedFile ? 'bg-green-500/20' : 'bg-blue-500/20'
                  }`}>
                    {state.uploadedFile ? (
                      <CheckCircle size={32} className="text-green-400" />
                    ) : (
                      <Upload size={32} className="text-blue-400" />
                    )}
                  </div>
                  {state.uploadedFile ? (
                    <>
                      <p className="text-white font-medium">{state.uploadedFile.name}</p>
                      <p className="text-sm text-zinc-500">
                        {(state.uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        onClick={() => updateState({ uploadedFile: null })}
                        className="text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        {t('common.removeFile')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-medium">{t('autoclipping.chooseClip')}</p>
                      <p className="text-sm text-zinc-500">{t('autoclipping.fileFormat')}</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Upload size={16} />
                        {t('autoclipping.browseFile')}
                      </button>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={uploadHandlers.handleFileSelect}
                />
              </div>
              {state.uploadedVideoUrl && (
                <video
                  ref={videoRef}
                  src={state.uploadedVideoUrl}
                  className="hidden"
                  onLoadedMetadata={uploadHandlers.handleVideoLoaded}
                  muted={false}
                  crossOrigin="anonymous"
                  playsInline
                />
              )}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-sm text-zinc-500">{t('common.or')}</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                  <TikTokIcon className="text-white" />
                  <InstagramIcon className="text-pink-500" />
                  <YouTubeIcon className="text-red-500" />
                  <span className="text-white font-medium">{t('autoclipping.socialLinks')}</span>
                </div>
                <input
                  type="text"
                  value={state.videoLink}
                  onChange={(e) => updateState({ videoLink: e.target.value })}
                  placeholder={ASSETS.BASE_URLS.YOUTUBE_WATCH}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex justify-end mt-8">
                <button
                  onClick={uploadHandlers.performAnalysis}
                  disabled={!state.uploadedFile && !state.videoLink}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                    state.uploadedFile || state.videoLink
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {t('autoclipping.next')}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        {state.activeTab === 'clips' && (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0">
            <ClipList
              state={state}
              onPreviewClip={previewHandlers.handlePreviewClip}
              onToggleClipSelection={toggleClipSelection}
              onSelectAllClips={selectAllClips}
              onDownloadSelected={previewHandlers.handleDownloadSelected}
              onEditBoundaries={handleEditBoundaries}
              formatTimeDisplay={formatTimeDisplay}
              getScoreColor={getScoreColor}
            />
            <div className="w-full lg:w-[350px] border-b lg:border-b-0 lg:border-l border-white/5 bg-surface-darkest flex flex-col order-1 lg:order-2 h-[250px] sm:h-[300px] lg:h-auto">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[200px] lg:max-w-none aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden relative max-h-[180px] sm:max-h-[220px] lg:max-h-[400px]">
                  {state.previewClip && state.uploadedVideoUrl ? (
                    <video
                      ref={previewVideoRef}
                      src={state.uploadedVideoUrl}
                      className="w-full h-full object-cover"
                      muted={state.isMuted}
                      playsInline
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                          <Play size={24} className="text-white ml-1 sm:hidden" />
                          <Play size={32} className="text-white ml-1 hidden sm:block" />
                        </div>
                        <p className="text-zinc-500 text-xs sm:text-sm">{t('autoclipping.selectClipPreview')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 sm:p-4 border-t border-white/5 space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={previewHandlers.handlePlayPausePreview}
                    disabled={!state.previewClip}
                    className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    {state.isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={() => {
                      updateState({ isMuted: !state.isMuted });
                      if (previewVideoRef.current) {
                        previewVideoRef.current.muted = !state.isMuted;
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors"
                    type="button"
                  >
                    {state.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <span className="text-xs text-zinc-400 ml-auto">
                    {formatTimeDisplay(state.currentTime)} / {state.previewClip ? formatTimeDisplay(state.previewClip.endTimeSeconds - state.previewClip.startTimeSeconds) : '0:00'}
                  </span>
                  <button className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-400 transition-colors" type="button">
                    <Maximize2 size={16} />
                  </button>
                </div>
                <div
                  className="h-1 bg-zinc-800 rounded-full cursor-pointer"
                  onClick={previewHandlers.handleProgressClick}
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ 
                      width: state.previewClip 
                        ? `${(state.currentTime / (state.previewClip.endTimeSeconds - state.previewClip.startTimeSeconds)) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {editingClip && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <ClipBoundaryEditor
                clip={{
                  id: editingClip.id,
                  startTime: editingClip.startTimeSeconds,
                  endTime: editingClip.endTimeSeconds,
                  confidence: editingClip.score,
                  reason: editingClip.title,
                }}
                videoDuration={120} 
                onSave={handleSaveBoundaries}
                onCancel={handleCancelEdit}
                onPreview={(startTime, endTime) => {
                  previewHandlers.handlePreviewClip({
                    ...editingClip,
                    startTimeSeconds: startTime,
                    endTimeSeconds: endTime,
                  });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};