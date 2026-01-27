import { Play, Download, X, Check, Loader2, FileVideo, HardDrive } from 'lucide-react';
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
interface VideoInfoCardProps {
  item: DownloadItem;
  qualityOptions: DownloadQuality[];
  onPreview: (item: DownloadItem) => void;
  onStartDownload: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
}
export const VideoInfoCard = ({
  item,
  qualityOptions,
  onPreview,
  onStartDownload,
  onRemoveItem,
}) => {
  return (
    <div className="bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden">
      <div className="flex gap-4 p-4">
        <button
          onClick={() => onPreview(item)}
          className="relative w-24 h-16 sm:w-32 sm:h-20 bg-zinc-800 rounded-lg overflow-hidden shrink-0 group"
          type="button"
        >
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={20} fill="white" className="text-white" />
          </div>
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
            {item.duration}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <FileVideo size={12} />
              {item.selectedQuality}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive size={12} />
              {qualityOptions.find((q) => q.id === item.selectedQuality)?.estimatedSize}
            </span>
          </div>
          {item.status === 'downloading' && (
            <div className="mt-3">
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-100"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">{item.progress}%</p>
            </div>
          )}
          {item.status === 'complete' && (
            <div className="flex items-center gap-2 mt-2 text-green-400 text-xs">
              <Check size={14} />
              Download complete
            </div>
          )}
          {item.status === 'error' && (
            <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
              <X size={14} />
              {item.error || 'Download failed'}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {(item.status === 'pending' || item.status === 'error') && (
            <button
              onClick={() => onStartDownload(item.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              type="button"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
          {item.status === 'downloading' && (
            <div className="px-4 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              <span className="hidden sm:inline">Downloading</span>
            </div>
          )}
          {item.status === 'complete' && (
            <a
              href={item.downloadUrl}
              download
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Save</span>
            </a>
          )}
          <button
            onClick={() => onRemoveItem(item.id)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};







