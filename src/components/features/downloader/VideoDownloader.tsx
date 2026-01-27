import { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { downloadVideo } from '../../../utils/videoDownload';
import { TikTokIcon, YouTubeIcon, InstagramIcon } from '../../shared/SocialIcons';
import { UrlInputSection } from './UrlInputSection';
import { VideoInfoCard } from './VideoInfoCard';
import { VideoPreviewModal } from './VideoPreviewModal';
import { usePaywall } from '../../../hooks/usePaywall';

type PlatformType = 'instagram' | 'tiktok' | 'youtube';
interface VideoDownloaderProps {
  onBack: () => void;
  platform: PlatformType;
}
interface DownloadQuality {
  id: string;
  label: string;
  resolution: string;
  estimatedSize: string;
}
interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  progress: number;
  selectedQuality: string;
  downloadUrl?: string;
  error?: string;
}

const PLATFORM_CONFIG: Record<PlatformType, {
  name: string;
  icon: (props: { className?: string; size?: number }) => JSX.Element;
  color: string;
  bgClass: string;
  placeholder: string;
  urlPattern: RegExp;
}> = {
  instagram: {
    name: 'Instagram',
    icon: InstagramIcon,
    color: 'text-pink-400',
    bgClass: 'bg-gradient-to-br from-pink-500 to-purple-600',
    placeholder: 'https://www.instagram.com/reel/example',
    urlPattern: /(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/,
  },
  tiktok: {
    name: 'TikTok',
    icon: TikTokIcon,
    color: 'text-white',
    bgClass: 'bg-black border border-white/20',
    placeholder: 'https://www.tiktok.com/@username/video/1234567890',
    urlPattern: /tiktok\.com\/@[\w.-]+\/video\/\d+/i,
  },
  youtube: {
    name: 'YouTube',
    icon: YouTubeIcon,
    color: 'text-red-400',
    bgClass: 'bg-red-600',
    placeholder: 'https://www.youtube.com/watch?v=VIDEO_ID',
    urlPattern: /(youtube\.com\/watch\?v=|youtu\.be\/)/i,
  },
};
const QUALITY_OPTIONS: DownloadQuality[] = [
  { id: '1080p', label: '1080p HD', resolution: '1920x1080', estimatedSize: '~50MB' },
  { id: '720p', label: '720p', resolution: '1280x720', estimatedSize: '~30MB' },
  { id: '480p', label: '480p', resolution: '854x480', estimatedSize: '~15MB' },
  { id: '360p', label: '360p', resolution: '640x360', estimatedSize: '~8MB' },
];

const DOWNLOAD_INTERVAL_MS = 50;
const MAX_PROGRESS = 100;

export const VideoDownloader = ({ onBack, platform }: VideoDownloaderProps) => {
  const { requireSubscription } = usePaywall();
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState<boolean | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [previewItem, setPreviewItem] = useState<DownloadItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const downloadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const config = PLATFORM_CONFIG[platform];
  const PlatformIcon = config.icon;
  useEffect(() => {
    return () => {
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current);
      }
    };
  }, []);

  const validateUrl = useCallback((inputUrl: string) => {
    if (!inputUrl.trim()) {
      setIsValidUrl(null);
      return;
    }
    setIsValidUrl(config.urlPattern.test(inputUrl));
  }, [config.urlPattern]);

  useEffect(() => {
    validateUrl(url);
  }, [url, validateUrl]);
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setErrorMessage(null);
  };

  const handleFetchVideo = useCallback(async () => {
    if (!url.trim() || !isValidUrl) return;
    if (!requireSubscription('Downloaders')) return;
    setIsFetching(true);
    setErrorMessage(null);
    try {
      const result = await downloadVideo({
        url,
        platform,
        quality: selectedQuality,
      });
      if (result.success) {
        const newItem: DownloadItem = {
          id: `item_${Date.now()}`,
          url,
          title: result.title || `${config.name} Video - ${new Date().toLocaleDateString()}`,
          thumbnail: result.thumbnail || '',
          duration: result.duration || '0:30',
          status: 'pending',
          progress: 0,
          selectedQuality,
          downloadUrl: result.downloadUrl,
        };
        setDownloadItems((prev) => [newItem, ...prev]);
        setUrl('');
        setIsValidUrl(null);
      } else {
        setErrorMessage(result.error || 'Failed to fetch video information');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsFetching(false);
    }
  }, [url, isValidUrl, selectedQuality, config.name, platform, requireSubscription]);

  const handleStartDownload = useCallback((itemId: string) => {
    const item = downloadItems.find((i) => i.id === itemId);
    if (!item?.downloadUrl) {
      setDownloadItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: 'error', progress: 0, error: 'No download URL available.' } : i))
      );
      setErrorMessage('No download URL available for this item.');
      return;
    }

    setDownloadItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'downloading', progress: 0 } : i))
    );
    downloadIntervalRef.current = setInterval(() => {
      setDownloadItems((prev) => {
        const current = prev.find((i) => i.id === itemId);
        if (!current || current.status !== 'downloading') {
          if (downloadIntervalRef.current) {
            clearInterval(downloadIntervalRef.current);
          }
          return prev;
        }
        if (current.progress >= MAX_PROGRESS) {
          if (downloadIntervalRef.current) {
            clearInterval(downloadIntervalRef.current);
          }
          return prev.map((i) =>
            i.id === itemId
              ? { ...i, status: 'complete', progress: 100 }
              : i
          );
        }
        return prev.map((i) =>
          i.id === itemId ? { ...i, progress: i.progress + 2 } : i
        );
      });
    }, DOWNLOAD_INTERVAL_MS);
  }, [downloadItems]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setDownloadItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const handlePreview = useCallback((item: DownloadItem) => {
    setPreviewItem(item);
  }, []);
  const handleClosePreview = useCallback(() => {
    setPreviewItem(null);
    setIsPlaying(false);
  }, []);

  return (
    <div className="h-screen bg-background text-white font-sans flex flex-col overflow-hidden">
      <header className="h-14 bg-background border-b border-white/5 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95"
            type="button"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgClass}`}>
              <PlatformIcon className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-white">
                Download {config.name} Videos
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">
                Save videos to your device
              </p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <UrlInputSection
            url={url}
            isValidUrl={isValidUrl}
            selectedQuality={selectedQuality}
            showQualityDropdown={showQualityDropdown}
            isFetching={isFetching}
            platformName={config.name}
            platformColor={config.color}
            placeholder={config.placeholder}
            qualityOptions={QUALITY_OPTIONS}
            onUrlChange={handleUrlChange}
            onToggleQualityDropdown={() => setShowQualityDropdown(!showQualityDropdown)}
            onSelectQuality={setSelectedQuality}
            onFetchVideo={handleFetchVideo}
          />
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}
          {downloadItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-zinc-400">Download Queue</h2>
              {downloadItems.map((item) => (
                <VideoInfoCard
                  key={item.id}
                  item={item}
                  qualityOptions={QUALITY_OPTIONS}
                  onPreview={handlePreview}
                  onStartDownload={handleStartDownload}
                  onRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
          )}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-400 font-medium mb-1">Disclaimer</p>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  This tool is for personal use only. Please respect copyright laws and the terms of service
                  of {config.name}. Only download content you have permission to use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {previewItem && (
        <VideoPreviewModal
          previewItem={previewItem}
          onClose={handleClosePreview}
          onStartDownload={handleStartDownload}
        />
      )}
    </div>
  );
};