import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, X, Check, Upload, FolderOpen, Film, Sparkles, Pause, Volume2, VolumeX } from 'lucide-react';
import { ASSETS } from '../../../constants/assets';
import { MAX_UPLOAD_SIZE_MB } from '../../../constants/upload';
import { SAMPLE_PICKER_VIDEOS } from '../../../constants/editor';
import { useTranslation } from '../../../hooks/useTranslation';
export interface PickerVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  type: 'story' | 'uploaded';
  videoSrc?: string;
}
interface VideoPickerProps {
  onClose: () => void;
  onSelectVideo: (video: PickerVideo | null) => void;
}
const SAMPLE_VIDEOS: PickerVideo[] = SAMPLE_PICKER_VIDEOS.map((v) => ({
  ...v,
  thumbnail: v.id === 'story_1' ? ASSETS.IMAGES.UNSPLASH.VERTICAL_1 : ASSETS.IMAGES.UNSPLASH.VERTICAL_2,
  videoSrc: v.id === 'story_1' ? ASSETS.VIDEOS.SAMPLE_1 : ASSETS.VIDEOS.SAMPLE_2,
}));
const PREVIEW_HOVER_DELAY_MS = 300;
export const VideoPicker = ({ onClose, onSelectVideo }: VideoPickerProps) => {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      setUploadedVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setUploadedVideoUrl(null);
  }, [uploadedFile]);
  const handleVideoHover = useCallback((videoId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredId(videoId);
      setIsPreviewPlaying(true);
    }, PREVIEW_HOVER_DELAY_MS);
  }, []);
  const handleVideoLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredId(null);
    setIsPreviewPlaying(false);
  }, []);
  const togglePreviewMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPreviewMuted(prev => !prev);
  }, []);
  useEffect(() => {
    if (previewVideoRef.current) {
      if (isPreviewPlaying && hoveredId) {
        previewVideoRef.current.play().catch(() => null);
      } else {
        previewVideoRef.current.pause();
        previewVideoRef.current.currentTime = 0;
      }
    }
  }, [isPreviewPlaying, hoveredId]);
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
      setSelectedId('uploaded');
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
      setSelectedId('uploaded');
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleEdit = () => {
    if (selectedId === 'uploaded' && uploadedFile) {
      onSelectVideo({
        id: `uploaded_${Date.now()}`,
        title: uploadedFile.name,
        thumbnail: '',
        duration: 'Unknown',
        type: 'uploaded',
      });
    } else if (selectedId) {
      const video = SAMPLE_VIDEOS.find((v) => v.id === selectedId);
      if (video) onSelectVideo(video);
    } else {
      onSelectVideo(null);
    }
  };
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-zinc-900 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl border border-white/10 my-auto">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Film size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {t('videoPicker.title')}
              </h2>
              <p className="text-xs text-zinc-500">{t('videoPicker.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors text-zinc-400 hover:text-white"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-sm font-medium text-white">{t('videoPicker.yourStories')}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {SAMPLE_VIDEOS.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedId(video.id)}
                  onMouseEnter={() => handleVideoHover(video.id)}
                  onMouseLeave={handleVideoLeave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(video.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[3/4] group transition-all duration-300 cursor-pointer ${
                    selectedId === video.id 
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900 scale-[0.98]' 
                      : 'hover:ring-2 hover:ring-white/20 hover:scale-[0.98]'
                  }`}
                >
                  {hoveredId === video.id && video.videoSrc ? (
                    <video
                      ref={hoveredId === video.id ? previewVideoRef : undefined}
                      src={video.videoSrc}
                      className="w-full h-full object-cover"
                      loop
                      muted={isPreviewMuted}
                      playsInline
                      preload="none"
                    />
                  ) : (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] text-white font-medium">Story</span>
                    </div>
                  </div>
                  {hoveredId === video.id && isPreviewPlaying && (
                    <button
                      onClick={togglePreviewMute}
                      className="absolute top-3 right-12 w-7 h-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors hover:bg-black/80"
                      type="button"
                    >
                      {isPreviewMuted ? <VolumeX size={14} className="text-white" /> : <Volume2 size={14} className="text-white" />}
                    </button>
                  )}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          {hoveredId === video.id && isPreviewPlaying ? (
                            <Pause size={12} fill="white" className="text-white" />
                          ) : (
                            <Play size={12} fill="white" className="text-white ml-0.5" />
                          )}
                        </div>
                        <span className="text-white text-sm font-medium truncate">{video.title}</span>
                      </div>
                      <span className="text-zinc-400 text-xs">{video.duration}</span>
                    </div>
                  </div>
                  {selectedId === video.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-blue-500/10 transition-opacity ${selectedId === video.id ? 'opacity-100' : 'opacity-0'}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{t('videoPicker.orUpload')}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <div 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-5 sm:p-6 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10' 
                : uploadedFile 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : 'border-zinc-700 hover:border-zinc-600 hover:bg-white/[0.02]'
            }`}
          >
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
            {uploadedFile && uploadedVideoUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-32 h-48 rounded-xl overflow-hidden bg-zinc-800">
                  <video 
                    src={uploadedVideoUrl} 
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm truncate max-w-[200px]">{uploadedFile.name}</p>
                  <p className="text-green-400 text-xs mt-1">Ready to edit</p>
                </div>
                <button 
                  onClick={() => {
                    setUploadedFile(null);
                    if (selectedId === 'uploaded') setSelectedId(null);
                  }}
                  className="text-zinc-400 hover:text-white text-sm underline"
                  type="button"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragging ? 'bg-blue-500/30' : 'bg-zinc-800'
                }`}>
                  <Upload size={24} className={isDragging ? 'text-blue-400' : 'text-zinc-400'} />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {isDragging ? t('videoPicker.dropHere') : t('videoPicker.upload')}
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">
                    {t('videoPicker.dragDrop')}
                  </p>
                  <p className="text-zinc-600 text-xs mt-2">
                    {t('videoPicker.fileInfo', { max: MAX_UPLOAD_SIZE_MB })}
                  </p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="mt-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border border-white/10"
                  type="button"
                >
                  <FolderOpen size={16} />
                  {t('videoPicker.browse')}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-5 sm:p-6 border-t border-white/10 bg-zinc-900/50">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium transition-colors border border-white/10"
                type="button"
              >
                {t('videoPicker.cancel')}
              </button>
              <button 
                onClick={handleEdit} 
                disabled={!selectedId && !uploadedFile}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30 disabled:shadow-none"
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {t('videoPicker.startEditing')}
              </button>
            </div>
            <button 
              onClick={() => onSelectVideo(null)}
              className="w-full bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/5 hover:border-white/10"
              type="button"
            >
              {t('videoPicker.startFromScratch')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};