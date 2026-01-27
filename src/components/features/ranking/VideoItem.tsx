import { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Upload, ArrowRight } from 'lucide-react';
import { VideoSource, ClipCaption } from './types';
import { ClipTimingControl } from './ClipTimingControl';
import { CaptionEditor } from './CaptionEditor';
import { validateVideoFile, validateVideoURL } from './validation';
import { useTranslation } from '../../../hooks/useTranslation';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface VideoItemProps {
  video: VideoSource;
  index: number;
  onUpdate: (id: string, updates: Partial<VideoSource>) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDelete: (id: string) => void;
}

export const VideoItem = ({
  video,
  index,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: VideoItemProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLinkChange = (link: string) => {
    setValidationError(null);

    if (link.trim() === '') {
      onUpdate(video.id, { type: 'link', link: '' });
      return;
    }

    const validation = validateVideoURL(link);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid URL');
      return;
    }

    onUpdate(video.id, { type: 'link', link });
  };

  const handleFileSelect = async (file: File) => {
    setValidationError(null);
    setValidationWarnings([]);
    setIsDownloading(false);

    const validation = await validateVideoFile(file);

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid video file');
      return;
    }

    if (validation.warnings && validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
    }

    const url = URL.createObjectURL(file);
    onUpdate(video.id, {
      type: 'file',
      file,
      thumbnail: url,
      duration: validation.metadata?.duration,
      clipDuration: video.clipDuration || 5,
      trimStart: 0,
      trimEnd: validation.metadata?.duration,
    });
  };

  const handleProcessLink = async () => {
    if (!video.link || !video.link.trim()) return;

    // Re-validate before sending to backend
    const validation = validateVideoURL(video.link);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid URL');
      return;
    }

    try {
      setIsDownloading(true);
      setValidationError(null);

      const response = await fetch('/api/download-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: video.link }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to download video');
      }

      const data: { url?: string } = await response.json();
      if (!data.url) {
        throw new Error('Download did not return a video URL');
      }

      // Fetch the MP4 from the backend and convert it into a File so the
      // rest of the app can treat it like a normal uploaded file.
      const fileResponse = await fetch(data.url);
      if (!fileResponse.ok) {
        throw new Error('Failed to load downloaded video');
      }

      const blob = await fileResponse.blob();
      const fileName = 'video_from_link.mp4';
      const mp4File = new File([blob], fileName, { type: 'video/mp4' });

      await handleFileSelect(mp4File);
    } catch (error) {
      console.error('Error processing video link:', error);
      setIsDownloading(false);
      setValidationError(
        error instanceof Error
          ? error.message
          : 'Failed to process video link. Please try again or upload the file manually.'
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleTimingChange = (clipDuration: number) => {
    onUpdate(video.id, { clipDuration });
  };

  const handleTrimChange = (trimStart: number, trimEnd: number) => {
    onUpdate(video.id, { trimStart, trimEnd });
  };

  const handleCaptionChange = (caption: ClipCaption) => {
    onUpdate(video.id, { caption });
  };

  return (
    <div className="space-y-3 p-4 bg-zinc-900/50 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{t('videoRanking.video.number', { number: index + 1 })}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveUp(video.id)}
            className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white"
            title={t('videoRanking.video.moveUp')}
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => onMoveDown(video.id)}
            className="w-7 h-7 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white"
            title={t('videoRanking.video.moveDown')}
          >
            <ChevronDown size={16} />
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className="w-7 h-7 flex items-center justify-center bg-red-600/80 hover:bg-red-500 rounded transition-colors text-white"
            title={t('videoRanking.video.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium">
          {validationError}
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg space-y-1">
          {validationWarnings.map((warning, idx) => (
            <div key={idx} className="text-yellow-400 text-xs font-medium">
              ⚠️ {warning}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <TikTokIcon className="text-white" />
          <InstagramIcon className="text-pink-500" />
          <YouTubeIcon className="text-red-500" />
        </div>
        <input
          type="text"
          value={video.link || ''}
          onChange={(e) => handleLinkChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!isDownloading) {
                handleProcessLink();
              }
            }
          }}
          placeholder={t('videoRanking.video.linkPlaceholder')}
          className="flex-1 px-3 py-2 bg-zinc-800/80 border border-white/5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDownloading) {
              handleProcessLink();
            }
          }}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isDownloading || !video.link || !video.link.trim()}
          aria-label="Process video link"
        >
          <ArrowRight size={16} className="text-white" />
        </button>
      </div>

      {video.link && !validationError && isDownloading && (
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-2 text-xs text-blue-300">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <div className="flex-1">
            <p className="font-medium mb-0.5">Downloading and converting video...</p>
            <p className="text-blue-300/80 break-all">
              This may take a moment. Your video preview will appear automatically once ready.
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-gray-500">{t('videoRanking.video.or')}</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
            isDragging
              ? 'border-2 border-blue-500 bg-blue-500/10'
              : 'bg-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Upload size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">{t('videoRanking.video.dragDrop')}</p>
            <p className="text-xs text-gray-500">{t('videoRanking.video.fileInfo')}</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Upload size={14} />
            {t('videoRanking.video.browse')}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>

      {/* Clip Duration Control - Always visible for all videos */}
      <div className="mt-4">
        <ClipTimingControl
          clipDuration={video.clipDuration || 5}
          trimStart={video.trimStart || 0}
          trimEnd={video.trimEnd}
          videoDuration={video.duration || 30}
          onDurationChange={handleTimingChange}
          onTrimChange={handleTrimChange}
          allowTrim={!!video.file}
        />
      </div>

      {video.file && (
        <div className="mt-4">
          <CaptionEditor
            caption={video.caption}
            clipDuration={video.clipDuration || 5}
            onChange={handleCaptionChange}
          />
        </div>
      )}
    </div>
  );
};