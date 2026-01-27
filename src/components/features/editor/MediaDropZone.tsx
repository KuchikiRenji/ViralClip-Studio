import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Image, Video, Music, X, FileText, Loader2, Check, AlertCircle } from 'lucide-react';

type MediaType = 'video' | 'image' | 'audio' | 'any';

interface UploadedFile {
  id: string;
  file: File;
  type: MediaType;
  url: string;
  thumbnail?: string;
  duration?: number;
  progress: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error?: string;
}

interface MediaDropZoneProps {
  accept?: MediaType;
  multiple?: boolean;
  maxSize?: number;
  onFilesAdded: (files: UploadedFile[]) => void;
  onFileRemove?: (fileId: string) => void;
  className?: string;
  compact?: boolean;
}

const ACCEPTED_TYPES: Record<MediaType, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
  any: [],
};

const FILE_EXTENSIONS: Record<MediaType, string> = {
  video: '.mp4,.webm,.mov,.avi',
  image: '.jpg,.jpeg,.png,.gif,.webp,.svg',
  audio: '.mp3,.wav,.ogg,.aac,.flac',
  any: '.mp4,.webm,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.ogg,.aac,.flac',
};

const MAX_FILE_SIZE_MB = 500;

const getMediaType = (file: File): MediaType => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'any';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const generateThumbnail = async (file: File, type: MediaType): Promise<string | undefined> => {
  if (type === 'image') {
    return URL.createObjectURL(file);
  }
  
  if (type === 'video') {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      
      video.onloadeddata = () => {
        video.currentTime = 1;
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
      
      video.onerror = () => {
        resolve(undefined);
      };
    });
  }
  
  return undefined;
};

const getMediaDuration = async (file: File, type: MediaType): Promise<number | undefined> => {
  if (type !== 'video' && type !== 'audio') return undefined;
  
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
    
    element.onerror = () => {
      resolve(undefined);
    };
  });
};

export const MediaDropZone = ({
  accept = 'any',
  multiple = true,
  maxSize = MAX_FILE_SIZE_MB,
  onFilesAdded,
  onFileRemove,
  className = '',
  compact = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File too large. Max size is ${maxSize}MB`;
    }
    
    if (accept !== 'any') {
      const acceptedTypes = ACCEPTED_TYPES[accept];
      if (!acceptedTypes.includes(file.type)) {
        return `Invalid file type. Accepted: ${accept}`;
      }
    }
    
    return null;
  }, [accept, maxSize]);

  const processFile = useCallback(async (file: File): Promise<UploadedFile> => {
    const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const type = getMediaType(file);
    const url = URL.createObjectURL(file);
    
    const uploadedFile: UploadedFile = {
      id,
      file,
      type,
      url,
      progress: 0,
      status: 'uploading',
    };
    
    setUploadedFiles(prev => [...prev, uploadedFile]);
    
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setUploadedFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress: i } : f
      ));
    }
    
    setUploadedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'processing' } : f
    ));
    
    const [thumbnail, duration] = await Promise.all([
      generateThumbnail(file, type),
      getMediaDuration(file, type),
    ]);
    
    const finalFile: UploadedFile = {
      ...uploadedFile,
      thumbnail,
      duration,
      progress: 100,
      status: 'ready',
    };
    
    setUploadedFiles(prev => prev.map(f => 
      f.id === id ? finalFile : f
    ));
    
    return finalFile;
  }, []);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    if (!multiple && fileArray.length > 1) {
      setError('Only one file allowed');
      return;
    }
    
    const validFiles: File[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    const processedFiles = await Promise.all(validFiles.map(processFile));
    onFilesAdded(processedFiles);
  }, [multiple, validateFile, processFile, onFilesAdded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    e.target.value = '';
  }, [handleFiles]);

  const handleRemoveFile = useCallback((fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.url);
      if (file.thumbnail) {
        URL.revokeObjectURL(file.thumbnail);
      }
    }
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    onFileRemove?.(fileId);
  }, [uploadedFiles, onFileRemove]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);
    
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  const getIcon = () => {
    switch (accept) {
      case 'video': return Video;
      case 'image': return Image;
      case 'audio': return Music;
      default: return Upload;
    }
  };

  const Icon = getIcon();

  const getAcceptLabel = () => {
    switch (accept) {
      case 'video': return 'MP4, WebM, MOV';
      case 'image': return 'JPG, PNG, GIF, WebP';
      case 'audio': return 'MP3, WAV, OGG';
      default: return 'Video, Image, or Audio';
    }
  };

  if (compact) {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept={FILE_EXTENSIONS[accept]}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <button
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full p-3 border-2 border-dashed rounded-xl transition-all flex items-center gap-3 ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/5'
          }`}
          type="button"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-blue-500/20' : 'bg-zinc-800'
          }`}>
            <Icon size={18} className={isDragOver ? 'text-blue-400' : 'text-zinc-400'} />
          </div>
          <div className="text-left flex-1">
            <span className={`text-xs font-medium block ${isDragOver ? 'text-blue-400' : 'text-white'}`}>
              Drop files or click to upload
            </span>
            <span className="text-[10px] text-zinc-500">{getAcceptLabel()} up to {maxSize}MB</span>
          </div>
        </button>
        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
            <AlertCircle size={12} className="text-red-400 shrink-0" />
            <span className="text-[10px] text-red-400">{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_EXTENSIONS[accept]}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div
        ref={dropZoneRef}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-zinc-700 hover:border-blue-500/50 hover:bg-blue-500/5'
        }`}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          isDragOver ? 'bg-blue-500/20' : 'bg-zinc-800'
        }`}>
          <Icon size={24} className={isDragOver ? 'text-blue-400' : 'text-zinc-400'} />
        </div>
        <div className="text-center">
          <span className={`text-xs font-medium block ${isDragOver ? 'text-blue-400' : 'text-white'}`}>
            {isDragOver ? 'Drop files here' : 'Drag & drop or click to upload'}
          </span>
          <span className="text-[10px] text-zinc-500">{getAcceptLabel()} up to {maxSize}MB</span>
        </div>
        
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse" />
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <span className="text-[10px] text-red-400">{error}</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
            Uploaded Files ({uploadedFiles.length})
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg border border-white/5"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
                  {file.thumbnail ? (
                    <img src={file.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : file.type === 'audio' ? (
                    <Music size={16} className="text-zinc-500" />
                  ) : (
                    <FileText size={16} className="text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{file.file.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">{formatFileSize(file.file.size)}</span>
                    {file.duration && (
                      <span className="text-[10px] text-zinc-500">
                        {Math.floor(file.duration / 60)}:{Math.floor(file.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  {file.status === 'uploading' && (
                    <div className="mt-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {file.status === 'uploading' && (
                    <Loader2 size={14} className="text-blue-400 animate-spin" />
                  )}
                  {file.status === 'processing' && (
                    <Loader2 size={14} className="text-amber-400 animate-spin" />
                  )}
                  {file.status === 'ready' && (
                    <Check size={14} className="text-green-400" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle size={14} className="text-red-400" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(file.id);
                  }}
                  className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  type="button"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

