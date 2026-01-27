import { useRef, useState, useCallback } from 'react';
import { Upload, Check, Film, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { TikTokIcon, InstagramIcon, YouTubeIcon } from './SocialIcons';
import { MAX_UPLOAD_SIZE_MB, SUPPORTED_VIDEO_FORMATS, SUPPORTED_AUDIO_FORMATS } from '../../constants/upload';

const MAX_FILE_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;
const BYTES_PER_MB = 1024 * 1024;

type AcceptedFileType = 'video' | 'audio';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  uploadedFile: File | null;
  acceptedType: AcceptedFileType;
  showUrlInput?: boolean;
  videoUrl?: string;
  onVideoUrlChange?: (url: string) => void;
}

const ACCEPTED_TYPES: Record<AcceptedFileType, { accept: string; label: string; extensions: string }> = {
  video: { accept: 'video/*', label: 'video', extensions: 'MP4, up to 500 MB' },
  audio: { accept: 'audio/*,.mp3', label: 'audio', extensions: 'MP3' },
};

const validateFile = (file: File, type: AcceptedFileType): string | null => {
  if (!file) return 'No file selected';
  const isValidMimeType = type === 'video' 
    ? SUPPORTED_VIDEO_FORMATS.includes(file.type as typeof SUPPORTED_VIDEO_FORMATS[number])
    : SUPPORTED_AUDIO_FORMATS.includes(file.type as typeof SUPPORTED_AUDIO_FORMATS[number]);
  const isValidExtension = type === 'audio' && file.name.toLowerCase().endsWith('.mp3');
  if (!isValidMimeType && !isValidExtension) {
    return `Invalid file type. Please select a ${type} file.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_UPLOAD_SIZE_MB} MB.`;
  }
  if (file.size === 0) {
    return 'File is empty';
  }
  return null;
};

export const FileUploadZone = ({
  onFileSelect,
  onFileRemove,
  uploadedFile,
  acceptedType,
  showUrlInput = false,
  videoUrl = '',
  onVideoUrlChange,
}: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file, acceptedType);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    onFileSelect(file);
  }, [acceptedType, onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setError(null);
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileRemove]);

  const config = ACCEPTED_TYPES[acceptedType];

  const handleProcessUrl = useCallback(async () => {
    if (!showUrlInput || !onVideoUrlChange) return;
    const url = (videoUrl || '').trim();

    if (!url) {
      setError('Please enter a video link.');
      return;
    }

    // Basic sanity check – backend will enforce allowed hosts
    if (!/^https?:\/\//i.test(url)) {
      setError('Please enter a valid URL starting with http or https.');
      return;
    }

    try {
      setIsDownloading(true);
      setError(null);

      const response = await fetch('/api/download-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json().catch(() => ({} as any));

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to download video');
      }

      const fileResponse = await fetch(data.url);
      if (!fileResponse.ok) {
        throw new Error('Failed to load downloaded video');
      }

      const blob = await fileResponse.blob();
      const mp4File = new File([blob], 'video_from_link.mp4', { type: 'video/mp4' });

      // Treat as a normal uploaded file for the rest of the app
      handleFile(mp4File);
      // Also store the local MP4 URL so previews that rely on videoUrl can use it
      onVideoUrlChange(data.url);
    } catch (err) {
      console.error('Error processing video URL:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to process video link. Please try again or upload the file manually.'
      );
    } finally {
      setIsDownloading(false);
    }
  }, [showUrlInput, onVideoUrlChange, videoUrl, handleFile]);

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileInputChange}
        className="hidden"
      />
      {uploadedFile ? (
        <div className="border-2 border-green-500 rounded-xl p-8 text-center bg-green-500/10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium">{uploadedFile.name}</p>
              <p className="text-zinc-400 text-sm mt-1">
                {(uploadedFile.size / BYTES_PER_MB).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              type="button"
            >
              Remove file
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : error
              ? 'border-red-500 bg-red-500/10'
              : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-600'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Choose a clip or drag drop it here</p>
              <p className="text-zinc-500 text-sm mt-1">{config.extensions}</p>
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white flex items-center gap-2 transition-colors"
              type="button"
            >
              <Film className="w-4 h-4" />
              Browse File
            </button>
          </div>
          {showUrlInput && onVideoUrlChange && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-zinc-500 text-sm">Or</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <TikTokIcon className="text-white" />
                <InstagramIcon className="text-pink-500" />
                <YouTubeIcon className="text-red-500" />
                <span className="text-zinc-400">
                  YouTube, Instagram, or <span className="text-red-400">TikTok link</span>
                </span>
              </div>
              <div className="relative max-w-xl mx-auto flex items-center gap-3">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-4 w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => {
                      const value = e.target.value;
                      onVideoUrlChange(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!isDownloading) {
                          handleProcessUrl();
                        }
                      }
                    }}
                    placeholder="https://example.com/video"
                    className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDownloading) {
                      handleProcessUrl();
                    }
                  }}
                  disabled={isDownloading}
                  aria-label="Process video link"
                  className="w-11 h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/60 rounded-lg text-white transition-colors flex-shrink-0"
                >
                  {isDownloading ? (
                    <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
