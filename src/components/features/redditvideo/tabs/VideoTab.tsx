import { useRef, useState, useCallback } from 'react';
import { Check, Upload, Crown, Play, User } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { RedditVideoState, BackgroundVideo } from '../types';
import { BACKGROUND_VIDEOS } from '../constants';
import sharedStyles from '../RedditVideo.module.css';

interface VideoTabProps {
  state: RedditVideoState;
  updateState: <K extends keyof RedditVideoState>(key: K, value: RedditVideoState[K]) => void;
}

type VideoCategory = 'all' | 'gameplay' | 'satisfying' | 'nature' | 'faceless' | 'aesthetic';

export const VideoTab = ({
  state,
  updateState,
}: VideoTabProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<VideoCategory>('all');
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (state.uploadedBackgroundUrl) {
        URL.revokeObjectURL(state.uploadedBackgroundUrl);
      }
      const url = URL.createObjectURL(file);
      updateState('uploadedBackgroundFile', file);
      updateState('uploadedBackgroundUrl', url);
      updateState('selectedBackground', 'custom');
    }
  };

  const handleSelectVideo = useCallback(async (videoId: string) => {
    setLibraryError(null);
    const selected = BACKGROUND_VIDEOS.find(v => v.id === videoId);
    if (!selected?.src) {
      if (state.uploadedBackgroundUrl) {
        URL.revokeObjectURL(state.uploadedBackgroundUrl);
        updateState('uploadedBackgroundFile', null);
        updateState('uploadedBackgroundUrl', null);
      }
      updateState('selectedBackground', videoId);
      return;
    }

    setIsLibraryLoading(true);
    try {
      const res = await fetch(selected.src);
      if (!res.ok) {
        throw new Error(t('redditVideo.video.loadFailed'));
      }
      const blob = await res.blob();
      const type = blob.type || 'video/mp4';
      const ext = type.includes('webm') ? 'webm' : 'mp4';
      const file = new File([blob], `${videoId}.${ext}`, { type });
      if (state.uploadedBackgroundUrl) {
        URL.revokeObjectURL(state.uploadedBackgroundUrl);
      }
      const url = URL.createObjectURL(file);
      updateState('uploadedBackgroundFile', file);
      updateState('uploadedBackgroundUrl', url);
      updateState('selectedBackground', videoId);
    } catch (e) {
      setLibraryError(e instanceof Error ? e.message : t('redditVideo.video.loadFailed'));
    } finally {
      setIsLibraryLoading(false);
    }
  }, [state.uploadedBackgroundUrl, t, updateState]);

  const filteredVideos = category === 'all' ? BACKGROUND_VIDEOS : BACKGROUND_VIDEOS.filter(v => v.category === category);

  const renderVideoCard = (video: BackgroundVideo) => {
    const isSelected = state.selectedBackground === video.id;

    return (
      <div
        key={video.id}
        onClick={() => handleSelectVideo(video.id)}
        className={`relative rounded-xl overflow-hidden cursor-pointer transition-all group touch-target-lg ${
          isSelected
            ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900'
            : 'active:ring-2 active:ring-white/30'
        }`}
      >
        {isSelected && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
            <Check size={14} className="text-white" />
          </div>
        )}

        {video.isPremium && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500/90 rounded-full flex items-center gap-1 z-10">
            <Crown size={12} className="text-white" />
            <span className="text-[10px] text-white font-medium">Premium</span>
          </div>
        )}

        <div className="aspect-[9/16] bg-zinc-800 relative">
          {video.thumbnail ? (
            <img
              loading="lazy"
              src={video.thumbnail}
              alt={video.title}
              width={160}
              height={284}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <Play size={32} />
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Play size={24} className="text-white ml-1" />
            </div>
          </div>
        </div>

        <div className="p-3 bg-zinc-900">
          <h3 className="text-sm font-medium text-white truncate">
            {video.title}
          </h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>{video.duration}</span>
              <span>•</span>
              <span>{video.size}</span>
              <span>•</span>
              <span className="text-emerald-400">{t('redditVideo.video.free')}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <User size={12} />
              <span>{video.author}</span>
            </div>
          </div>
        </div>
        {video.isPremium && (
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 border-t border-white/5 transition-colors"
            type="button"
          >
            {t('redditVideo.video.viewPremium')}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className={`${sharedStyles.panel} p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t('redditVideo.video.selectBackground')}
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/10 flex items-center gap-2 touch-target"
            type="button"
          >
            <Upload size={16} />
            {t('redditVideo.video.uploadOwn')}
          </button>
        </div>

        <p className="text-sm text-zinc-500 mb-4">
          {t('redditVideo.video.tip')}
        </p>

        {libraryError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {libraryError}
          </div>
        )}

        {isLibraryLoading && (
          <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
            {t('common.loading')}
          </div>
        )}

        {state.uploadedBackgroundFile && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-16 h-28 rounded-lg overflow-hidden bg-zinc-800">
                {state.uploadedBackgroundUrl && (
                  <video
                    src={state.uploadedBackgroundUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="none"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">
                  {state.uploadedBackgroundFile.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {(state.uploadedBackgroundFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button
                  onClick={() => {
                    if (state.uploadedBackgroundUrl) {
                      URL.revokeObjectURL(state.uploadedBackgroundUrl);
                    }
                    updateState('uploadedBackgroundFile', null);
                    updateState('uploadedBackgroundUrl', null);
                    updateState('selectedBackground', 'subway-surfers-1');
                  }}
                  className="text-sm text-red-400 hover:text-red-300 mt-1 touch-target"
                  type="button"
                >
                  {t('redditVideo.video.remove')}
                </button>
              </div>
              {state.selectedBackground === 'custom' && (
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
          {(['all', 'gameplay', 'satisfying', 'nature', 'faceless', 'aesthetic'] as VideoCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-target ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
              type="button"
            >
              {t(`redditVideo.video.cat${cat.charAt(0).toUpperCase() + cat.slice(1)}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredVideos.map(renderVideoCard)}
        </div>
      </div>
    </div>
  );
};
