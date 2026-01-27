import { X, Play, Download } from 'lucide-react';
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
}
interface VideoPreviewModalProps {
  previewItem: DownloadItem;
  onClose: () => void;
  onStartDownload: (itemId: string) => void;
}
export const VideoPreviewModal = ({
  previewItem,
  onClose,
  onStartDownload,
}) => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl overflow-hidden border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-white truncate">{previewItem.title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative aspect-video bg-black">
          <img
            src={previewItem.thumbnail}
            alt={previewItem.title}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play size={28} fill="white" className="text-white ml-1" />
            </div>
          </div>
        </div>
        <div className="p-4 flex gap-3">
          <button
            onClick={() => {
              onStartDownload(previewItem.id);
              onClose();
            }}
            disabled={previewItem.status !== 'pending'}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
            type="button"
          >
            <Download size={18} />
            Download {previewItem.selectedQuality}
          </button>
        </div>
      </div>
    </div>
  );
};







