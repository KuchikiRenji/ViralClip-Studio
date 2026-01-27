import { useRef, useState } from 'react';
import { Upload, Check, X, ArrowUp, ArrowDown, Video } from 'lucide-react';
import type { BackgroundVideo, BackgroundSource, VideoPlacement } from './types';
import { useTranslation } from '../../../hooks/useTranslation';

interface BackgroundTabProps {
  backgroundSource: BackgroundSource;
  selectedBackground: string;
  backgrounds: BackgroundVideo[];
  customBackgroundFile: File | null;
  customPlacement: VideoPlacement;
  onSourceChange: (source: BackgroundSource) => void;
  onBackgroundSelect: (id: string) => void;
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  onPlacementChange: (placement: VideoPlacement) => void;
}

interface BackgroundThumbnailProps {
  video: BackgroundVideo;
  isSelected: boolean;
  onSelect: () => void;
}

const BackgroundThumbnail = ({ video, isSelected, onSelect }: BackgroundThumbnailProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  return (
    <button
      onClick={onSelect}
      className={`relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30'
          : 'border-transparent hover:border-zinc-600'
      }`}
      type="button"
    >
      {imageLoading && !imageError && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center z-0">
          <Video className="w-6 h-6 text-zinc-600 animate-pulse" />
        </div>
      )}
      {!imageError ? (
        <img
          src={video.thumbnail}
          alt={`Background ${video.id}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
            // Silently handle thumbnail errors - don't spam console
          }}
        />
      ) : (
        <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center">
          <Video className="w-8 h-8 text-zinc-600 mb-2" />
          <p className="text-xs text-zinc-500">Background</p>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-2 py-0.5 rounded z-10">
        {video.duration}
      </div>
    </button>
  );
};
export const BackgroundTab = ({
  backgroundSource,
  selectedBackground,
  backgrounds,
  customBackgroundFile,
  customPlacement,
  onSourceChange,
  onBackgroundSelect,
  onFileUpload,
  onFileRemove,
  onPlacementChange,
}: BackgroundTabProps) => {
  const { t } = useTranslation();
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      onFileUpload(file);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{t('splitscreen.uploadBackground')}</h2>
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => onSourceChange('library')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              backgroundSource === 'library' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            type="button"
          >
            {t('splitscreen.library')}
          </button>
          <button
            onClick={() => onSourceChange('upload')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              backgroundSource === 'upload' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            type="button"
          >
            {t('splitscreen.uploadTab')}
          </button>
        </div>
      </div>
      {backgroundSource === 'library' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {backgrounds.map((video: BackgroundVideo) => (
            <BackgroundThumbnail
              key={video.id}
              video={video}
              isSelected={selectedBackground === video.id}
              onSelect={() => onBackgroundSelect(video.id)}
            />
          ))}
        </div>
      ) : (
        <>
          <input
            ref={bgFileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {customBackgroundFile ? (
            <div className="space-y-4">
              <div className="border-2 border-green-500 rounded-xl p-6 text-center bg-green-500/10">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{customBackgroundFile.name}</p>
                    <p className="text-zinc-400 text-sm mt-1">
                      {(customBackgroundFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={onFileRemove}
                    className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-medium transition-colors flex items-center gap-2"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                    {t('splitscreen.removeFile')}
                  </button>
                </div>
              </div>
              
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">{t('splitscreen.backgroundPlacement')}</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => onPlacementChange('top')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      customPlacement === 'top'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                    type="button"
                  >
                    <ArrowUp size={18} />
                    <span className="font-medium">{t('splitscreen.placementTop')}</span>
                  </button>
                  <button
                    onClick={() => onPlacementChange('bottom')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      customPlacement === 'bottom'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                    type="button"
                  >
                    <ArrowDown size={18} />
                    <span className="font-medium">{t('splitscreen.placementBottom')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => bgFileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center bg-zinc-900/50 hover:border-zinc-600 transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  bgFileInputRef.current?.click();
                }
              }}
            >
              <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <p className="text-zinc-400">{t('splitscreen.clickUpload')}</p>
              <p className="text-zinc-600 text-sm mt-1">{t('splitscreen.videoFormats')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};