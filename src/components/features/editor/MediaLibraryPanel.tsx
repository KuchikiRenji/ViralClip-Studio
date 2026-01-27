import { useState, useCallback, useRef, useMemo } from 'react';
import {
  Upload,
  Video,
  Image,
  Music,
  FolderOpen,
  Grid3X3,
  List,
  Search,
  X,
  Play,
  Pause,
  Clock,
  HardDrive,
  Trash2,
  Plus,
  SortAsc,
  SortDesc,
  Loader2,
  FileVideo,
  FileAudio,
  FileImage,
  GripVertical,
} from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

type MediaType = 'all' | 'video' | 'image' | 'audio';
type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'duration';
type SortOrder = 'asc' | 'desc';

interface ImportedMedia {
  id: string;
  file: File;
  type: 'video' | 'image' | 'audio';
  name: string;
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  dateAdded: Date;
  isProcessing: boolean;
  error?: string;
  waveformData?: number[];
}

interface MediaLibraryPanelProps {
  onMediaDragStart?: (media: ImportedMedia, e: React.DragEvent) => void;
  onMediaDoubleClick?: (media: ImportedMedia) => void;
  onMediaSelect?: (media: ImportedMedia) => void;
  className?: string;
}

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'];
const MAX_FILE_SIZE_MB = 500;

const getMediaType = (file: File): 'video' | 'image' | 'audio' | null => {
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return 'video';
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image';
  if (ACCEPTED_AUDIO_TYPES.includes(file.type)) return 'audio';
  return null;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const generateThumbnail = async (file: File, type: 'video' | 'image' | 'audio'): Promise<string | undefined> => {
  if (type === 'image') {
    return URL.createObjectURL(file);
  }

  if (type === 'video') {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration / 4);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(undefined);
        }
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => resolve(undefined);
    });
  }

  return undefined;
};

const getMediaDuration = async (file: File, type: 'video' | 'image' | 'audio'): Promise<number | undefined> => {
  if (type === 'image') return undefined;

  return new Promise((resolve) => {
    const element = type === 'video'
      ? document.createElement('video')
      : document.createElement('audio');

    element.preload = 'metadata';
    element.src = URL.createObjectURL(file);

    element.onloadedmetadata = () => {
      resolve(element.duration);
      URL.revokeObjectURL(element.src);
    };

    element.onerror = () => resolve(undefined);
  });
};

const generateWaveform = async (file: File): Promise<number[]> => {
  try {
    const audioContext = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const samples = 50;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      waveform.push(sum / blockSize);
    }
    
    const max = Math.max(...waveform);
    const normalized = waveform.map(v => max > 0 ? v / max : 0);
    
    await audioContext.close();
    return normalized;
  } catch {
    return Array(50).fill(0.5);
  }
};

export const MediaLibraryPanel = ({
  onMediaDragStart,
  onMediaDoubleClick,
  onMediaSelect,
  className = '',
}: MediaLibraryPanelProps) => {
  const { t } = useTranslation();
  const [mediaFiles, setMediaFiles] = useState<ImportedMedia[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<MediaType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<ImportedMedia | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);

  const processFile = useCallback(async (file: File): Promise<ImportedMedia | null> => {
    const type = getMediaType(file);
    if (!type) return null;

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return null;

    const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const url = URL.createObjectURL(file);

    const media: ImportedMedia = {
      id,
      file,
      type,
      name: file.name,
      url,
      size: file.size,
      dateAdded: new Date(),
      isProcessing: true,
    };

    setMediaFiles(prev => [...prev, media]);

    const [thumbnail, duration, waveformData] = await Promise.all([
      generateThumbnail(file, type),
      getMediaDuration(file, type),
      type === 'audio' ? generateWaveform(file) : Promise.resolve(undefined),
    ]);

    setMediaFiles(prev => prev.map(m =>
      m.id === id ? { ...m, thumbnail, duration, waveformData, isProcessing: false } : m
    ));

    return { ...media, thumbnail, duration, waveformData, isProcessing: false };
  }, []);

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    await Promise.all(fileArray.map(processFile));
  }, [processFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
    e.target.value = '';
  }, [handleFilesUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  }, [handleFilesUpload]);

  const handleRemoveMedia = useCallback((mediaId: string) => {
    const media = mediaFiles.find(m => m.id === mediaId);
    if (media) {
      URL.revokeObjectURL(media.url);
      if (media.thumbnail) {
        URL.revokeObjectURL(media.thumbnail);
      }
    }
    setMediaFiles(prev => prev.filter(m => m.id !== mediaId));
    if (selectedMediaId === mediaId) {
      setSelectedMediaId(null);
    }
    if (previewMedia?.id === mediaId) {
      setPreviewMedia(null);
    }
  }, [mediaFiles, selectedMediaId, previewMedia]);

  const handleMediaClick = useCallback((media: ImportedMedia) => {
    setSelectedMediaId(media.id);
    onMediaSelect?.(media);
  }, [onMediaSelect]);

  const handleMediaDragStart = useCallback((media: ImportedMedia, e: React.DragEvent) => {
    const dragData = {
      id: media.id,
      type: media.type,
      name: media.name,
      url: media.url,
      duration: media.duration,
      thumbnail: media.thumbnail,
      waveformData: media.waveformData,
      source: 'media-library',
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', media.name);
    e.dataTransfer.effectAllowed = 'copy';
    
    if (media.thumbnail) {
      const img = new window.Image();
      img.src = media.thumbnail;
      e.dataTransfer.setDragImage(img, 40, 40);
    }
    
    onMediaDragStart?.(media, e);
  }, [onMediaDragStart]);

  const handlePreviewToggle = useCallback((media: ImportedMedia) => {
    if (previewMedia?.id === media.id) {
      setIsPreviewPlaying(!isPreviewPlaying);
      if (media.type === 'video' && previewVideoRef.current) {
        isPreviewPlaying ? previewVideoRef.current.pause() : previewVideoRef.current.play();
      }
      if (media.type === 'audio' && previewAudioRef.current) {
        isPreviewPlaying ? previewAudioRef.current.pause() : previewAudioRef.current.play();
      }
    } else {
      setPreviewMedia(media);
      setIsPreviewPlaying(true);
    }
  }, [previewMedia, isPreviewPlaying]);

  const filteredAndSortedMedia = useMemo(() => {
    let result = [...mediaFiles];

    if (filterType !== 'all') {
      result = result.filter(m => m.type === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.dateAdded.getTime() - b.dateAdded.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [mediaFiles, filterType, searchQuery, sortBy, sortOrder]);

  const mediaTypeFilters = [
    { type: 'all' as MediaType, icon: FolderOpen, label: t('mediaLibrary.all') },
    { type: 'video' as MediaType, icon: Video, label: t('mediaLibrary.video') },
    { type: 'image' as MediaType, icon: Image, label: t('mediaLibrary.image') },
    { type: 'audio' as MediaType, icon: Music, label: t('mediaLibrary.audio') },
  ];

  const mediaIconMap = { video: FileVideo, image: FileImage, audio: FileAudio };
  const mediaColorMap = {
    video: 'text-blue-400 bg-blue-500/20',
    image: 'text-green-400 bg-green-500/20',
    audio: 'text-purple-400 bg-purple-500/20',
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-900/95 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,audio/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="p-3 border-b border-white/5 space-y-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 text-white font-bold py-3.5 min-h-[48px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all group touch-target active:scale-[0.98]"
          type="button"
        >
          <Plus size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-sm">{t('mediaLibrary.importMedia')}</span>
        </button>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder={t('mediaLibrary.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-lg pl-10 pr-10 py-3 min-h-[44px] text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 transition-colors touch-target"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white active:text-red-400 transition-colors touch-target-sm"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {mediaTypeFilters.map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 min-w-[60px] py-2.5 px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 touch-target active:scale-[0.98] ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-white active:bg-zinc-700/50'
              }`}
              type="button"
            >
              <Icon size={14} />
              <span className="hidden xs:inline truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors touch-target ${
                viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white active:bg-zinc-700/50'
              }`}
              type="button"
              aria-label="Grid view"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-colors touch-target ${
                viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white active:bg-zinc-700/50'
              }`}
              type="button"
              aria-label="List view"
            >
              <List size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="bg-zinc-800/50 border border-white/5 rounded-lg px-3 py-2 min-h-[40px] text-xs text-zinc-400 outline-none focus:border-blue-500/50 touch-target"
            >
              <option value="date">{t('mediaLibrary.sortDate')}</option>
              <option value="name">{t('mediaLibrary.sortName')}</option>
              <option value="size">{t('mediaLibrary.sortSize')}</option>
              <option value="duration">{t('mediaLibrary.sortDuration')}</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2.5 rounded-lg text-zinc-500 hover:text-white active:bg-zinc-700/50 transition-colors touch-target"
              type="button"
              aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto custom-scrollbar p-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-3 border-2 border-dashed border-blue-500 rounded-xl bg-blue-500/10 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <Upload size={32} className="mx-auto text-blue-400 mb-2" />
              <span className="text-sm text-blue-400 font-medium">{t('mediaLibrary.dropFiles')}</span>
            </div>
          </div>
        )}

        {mediaFiles.length === 0 ? (
          <div
            className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
              <Upload size={28} className="text-zinc-500 group-hover:text-blue-400" />
            </div>
            <span className="text-sm text-zinc-400 group-hover:text-blue-400 font-medium mb-1">
              {t('mediaLibrary.dragDrop')}
            </span>
            <span className="text-[10px] text-zinc-600">
              {t('mediaLibrary.supportedFormats')}
            </span>
          </div>
        ) : filteredAndSortedMedia.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500">
            <Search size={32} className="mb-2 opacity-50" />
            <span className="text-sm">{t('mediaLibrary.noResults')}</span>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {filteredAndSortedMedia.map((media) => {
              const Icon = getMediaIcon(media.type);
              const colorClass = getMediaColor(media.type);

              return (
                <div
                  key={media.id}
                  draggable={!media.isProcessing}
                  onDragStart={(e) => handleMediaDragStart(media, e)}
                  onClick={() => handleMediaClick(media)}
                  onDoubleClick={() => onMediaDoubleClick?.(media)}
                  className={`relative aspect-video bg-zinc-800 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group transition-all ${
                    selectedMediaId === media.id
                      ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900'
                      : 'hover:ring-1 hover:ring-white/20'
                  }`}
                >
                  {media.isProcessing ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                      <Loader2 size={20} className="text-blue-400 animate-spin" />
                    </div>
                  ) : media.thumbnail ? (
                    <img
                      src={media.thumbnail}
                      alt={media.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : media.type === 'audio' && media.waveformData ? (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-purple-950/80 flex items-center justify-center p-2">
                      <div className="flex items-center justify-center gap-[2px] h-full w-full">
                        {media.waveformData.map((value, idx) => (
                          <div
                            key={idx}
                            className="bg-purple-400/80 rounded-full min-w-[2px]"
                            style={{
                              height: `${Math.max(10, value * 100)}%`,
                              flex: '1 1 0',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${colorClass}`}>
                      <Icon size={24} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-1 left-1">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${colorClass}`}>
                      <Icon size={10} />
                    </div>
                  </div>

                  <div className="absolute top-1 right-1 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {(media.type === 'video' || media.type === 'audio') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewToggle(media);
                        }}
                        className="w-8 h-8 sm:w-6 sm:h-6 rounded-lg sm:rounded bg-black/60 flex items-center justify-center text-white hover:bg-black/80 active:bg-black transition-colors touch-target-sm"
                        type="button"
                      >
                        {previewMedia?.id === media.id && isPreviewPlaying ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia(media.id);
                      }}
                      className="w-8 h-8 sm:w-6 sm:h-6 rounded-lg sm:rounded bg-black/60 flex items-center justify-center text-red-400 hover:bg-red-500/20 active:bg-red-500/30 transition-colors touch-target-sm"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[9px] text-white truncate font-medium">{media.name}</div>
                    <div className="flex items-center gap-2 text-[8px] text-zinc-400">
                      {media.duration && (
                        <span className="flex items-center gap-0.5">
                          <Clock size={8} />
                          {formatDuration(media.duration)}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <HardDrive size={8} />
                        {formatFileSize(media.size)}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <GripVertical size={20} className="text-white/60" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredAndSortedMedia.map((media) => {
              const IconList = mediaIconMap[media.type];
              const colorClassList = mediaColorMap[media.type];

              return (
                <div
                  key={media.id}
                  draggable={!media.isProcessing}
                  onDragStart={(e) => handleMediaDragStart(media, e)}
                  onClick={() => handleMediaClick(media)}
                  onDoubleClick={() => onMediaDoubleClick?.(media)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing group transition-all ${
                    selectedMediaId === media.id
                      ? 'bg-blue-500/20 ring-1 ring-blue-500'
                      : 'bg-zinc-800/50 hover:bg-zinc-700/50'
                  }`}
                >
                  <div className="w-12 h-8 rounded overflow-hidden bg-zinc-900 flex-shrink-0">
                    {media.isProcessing ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 size={12} className="text-blue-400 animate-spin" />
                      </div>
                    ) : media.thumbnail ? (
                      <img
                        src={media.thumbnail}
                        alt={media.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${colorClassList}`}>
                        <IconList size={14} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{media.name}</div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className={`px-1 py-0.5 rounded text-[8px] uppercase font-bold ${colorClassList}`}>
                        {media.type}
                      </span>
                      {media.duration && <span>{formatDuration(media.duration)}</span>}
                      <span>{formatFileSize(media.size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(media.type === 'video' || media.type === 'audio') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewToggle(media);
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-600/50 transition-colors"
                      >
                        {previewMedia?.id === media.id && isPreviewPlaying ? (
                          <Pause size={12} />
                        ) : (
                          <Play size={12} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia(media.id);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewMedia && (previewMedia.type === 'video' || previewMedia.type === 'audio') && (
        <div className="p-2 border-t border-white/5 bg-zinc-950/50">
          <div className="flex items-center gap-2">
            {previewMedia.type === 'video' ? (
              <video
                ref={previewVideoRef}
                src={previewMedia.url}
                className="w-16 h-10 rounded object-cover bg-black"
                autoPlay={isPreviewPlaying}
                loop
                muted
                onEnded={() => setIsPreviewPlaying(false)}
              />
            ) : (
              <div className="w-16 h-10 rounded bg-purple-500/20 flex items-center justify-center">
                <Music size={16} className="text-purple-400" />
              </div>
            )}
            {previewMedia.type === 'audio' && (
              <audio
                ref={previewAudioRef}
                src={previewMedia.url}
                autoPlay={isPreviewPlaying}
                loop
                onEnded={() => setIsPreviewPlaying(false)}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white truncate">{previewMedia.name}</div>
              <div className="text-[9px] text-zinc-500">
                {previewMedia.duration && formatDuration(previewMedia.duration)}
              </div>
            </div>
            <button
              onClick={() => handlePreviewToggle(previewMedia)}
              className="p-1.5 rounded bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
            >
              {isPreviewPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={() => {
                setPreviewMedia(null);
                setIsPreviewPlaying(false);
              }}
              className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="p-2 border-t border-white/5 bg-zinc-950/30">
        <div className="flex items-center justify-between text-[10px] text-zinc-500">
          <span>
            {filteredAndSortedMedia.length} {t('mediaLibrary.items')}
          </span>
          <span>
            {formatFileSize(mediaFiles.reduce((acc, m) => acc + m.size, 0))} {t('mediaLibrary.total')}
          </span>
        </div>
      </div>
    </div>
  );
};

export type { ImportedMedia };
