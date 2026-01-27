import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, Image, Video, Music, Download, Play, ExternalLink, Grid, Filter, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { StockMediaItem } from '../../../types';
import { STOCK_CATEGORIES, AUDIO_CATEGORIES, ORIENTATION_FILTERS } from '../../../constants/stockMedia';
import { useTranslation } from '../../../hooks/useTranslation';
import { searchStockMedia } from '../../../services/api/stockMediaService';
type MediaType = 'all' | 'video' | 'image' | 'audio';
interface StockMediaBrowserProps {
  onSelectMedia: (media: StockMediaItem) => void;
  onClose?: () => void;
}
export const StockMediaBrowser = ({
  onSelectMedia,
  onClose,
}) => {
  const { t } = useTranslation();
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [category, setCategory] = useState('all');
  const [orientation, setOrientation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mediaResults, setMediaResults] = useState<StockMediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<StockMediaItem | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 500);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    if (mediaType === 'audio') {
      setMediaResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const fetchMedia = async () => {
      if (mediaType === 'all' || mediaType === 'audio') return;

      setIsSearching(true);
      setSearchError(null);

      try {
        const query = debouncedQuery || 'abstract';
        const orientationValue = orientation === 'all' ? undefined : orientation;
        const response = await searchStockMedia({
          type: mediaType,
          query,
          orientation: orientationValue,
          page,
          per_page: 20,
        });

        if (page === 1) {
          setMediaResults(response.results);
        } else {
          setMediaResults((prev) => [...prev, ...response.results]);
        }

        setHasMore(response.results.length === response.per_page);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Failed to load media');
        if (page === 1) {
          setMediaResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    };

    fetchMedia();
  }, [mediaType, debouncedQuery, orientation, page]);

  const filteredMedia = useMemo(() => {
    if (mediaType === 'audio') {
      return [];
    }

    return mediaResults.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      return true;
    });
  }, [mediaResults, category, mediaType]);

  const handleLoadMore = useCallback(() => {
    if (!isSearching && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [isSearching, hasMore]);
  const handleSelectMedia = useCallback(async (media: StockMediaItem) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSelectMedia(media);
    setIsLoading(false);
  }, [onSelectMedia]);
  const currentCategories = mediaType === 'audio' ? AUDIO_CATEGORIES : STOCK_CATEGORIES;
  return (
    <div className="flex flex-col h-full bg-surface-dark">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
            <Grid size={14} className="text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">{t('stockPanel.title')}</h3>
            <p className="text-[10px] text-zinc-500">{t('stockPanel.subtitle')}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="p-3 space-y-3 border-b border-white/5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={t('stockPanel.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-pink-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1">
          {[
            { id: 'all' as const, labelKey: 'stockPanel.all', icon: Grid },
            { id: 'video' as const, labelKey: 'stockPanel.videos', icon: Video },
            { id: 'image' as const, labelKey: 'stockPanel.images', icon: Image },
            { id: 'audio' as const, labelKey: 'stockPanel.audio', icon: Music },
          ].map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setMediaType(type.id);
                  setCategory('all');
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium transition-all ${
                  mediaType === type.id
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
                type="button"
              >
                <Icon size={12} />
                {t(type.labelKey)}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-2.5 py-2 text-[11px] text-white outline-none focus:border-pink-500/50 transition-colors"
            >
              {currentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          {mediaType !== 'audio' && (
            <div className="flex-1">
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-2.5 py-2 text-[11px] text-white outline-none focus:border-pink-500/50 transition-colors"
              >
                {ORIENTATION_FILTERS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {mediaType === 'audio' ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Music size={32} className="text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">{t('stockPanel.audioComingSoon')}</p>
            <p className="text-xs text-zinc-600 mt-1">Audio library coming soon</p>
          </div>
        ) : isSearching && page === 1 ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : searchError ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <AlertCircle size={32} className="text-red-400 mb-3" />
            <p className="text-sm text-red-400 mb-2">{searchError}</p>
            <button
              onClick={() => {
                setPage(1);
                setSearchError(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors mt-2"
              type="button"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Filter size={32} className="text-zinc-600 mb-3" />
            <p className="text-sm text-zinc-400">{t('stockPanel.noMedia')}</p>
            <p className="text-xs text-zinc-600 mt-1">{t('stockPanel.adjustFilters')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {filteredMedia.map((media) => (
              <div
                key={media.id}
                className="group relative bg-zinc-800/50 rounded-xl overflow-hidden border border-white/5 hover:border-pink-500/50 transition-all cursor-pointer"
                onClick={() => setPreviewMedia(media)}
              >
                {media.type === 'audio' ? (
                  <div className="aspect-square flex flex-col items-center justify-center p-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-2">
                      <Music size={20} className="text-green-400" />
                    </div>
                    <span className="text-xs text-white font-medium text-center truncate w-full">{media.title}</span>
                    <span className="text-[10px] text-zinc-500 mt-1">
                      {Math.floor((media.duration ?? 0) / 60)}:{((media.duration ?? 0) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="aspect-square">
                      <img
                        src={media.thumbnail}
                        alt={media.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width={320}
                        height={320}
                      />
                    </div>
                    {media.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                        <Play size={10} className="text-white" fill="white" />
                      </div>
                    )}
                    {media.duration && (
                      <div className="absolute bottom-8 right-2 bg-black/60 rounded px-1.5 py-0.5 text-[9px] text-white">
                        {Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <span className="text-[10px] text-white font-medium truncate block">{media.title}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-zinc-400">{media.source}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMedia(media);
                      }}
                      disabled={isLoading}
                      className="p-1 rounded bg-pink-600 hover:bg-pink-500 text-white transition-colors disabled:opacity-50"
                      type="button"
                    >
                      {isLoading ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
                    </button>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
              </div>
            ))}
            </div>
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isSearching}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                  type="button"
                >
                  {isSearching ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-surface-dark rounded-2xl max-w-lg w-full overflow-hidden border border-white/10">
            <div className="relative">
              {previewMedia.type === 'audio' ? (
                <div className="aspect-video flex items-center justify-center bg-zinc-900">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Music size={32} className="text-green-400" />
                  </div>
                </div>
              ) : (
                <img
                  src={previewMedia.type === 'image' ? previewMedia.src : previewMedia.thumbnail}
                  alt={previewMedia.title}
                  className="w-full aspect-video object-cover"
                />
              )}
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-1">{previewMedia.title}</h3>
              <p className="text-xs text-zinc-400 mb-3">
                by {previewMedia.author} • {previewMedia.source}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {previewMedia.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded-full text-[10px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectMedia(previewMedia)}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  type="button"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {t('stockPanel.addToProject')}
                </button>
                <a
                  href={previewMedia.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};