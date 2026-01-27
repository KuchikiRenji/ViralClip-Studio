import { ArrowUp, ArrowDown } from 'lucide-react';
import { FileUploadZone } from '../../shared/FileUploadZone';
import { useTranslation } from '../../../hooks/useTranslation';
import type { SplitVariant, VideoPlacement } from './types';

interface UploadTabProps {
  splitVariant: SplitVariant;
  onSplitVariantChange: (variant: SplitVariant) => void;
  scriptPrompt: string;
  generatedScript: string;
  onScriptPromptChange: (value: string) => void;
  onGenerateScript: () => void;
  uploadedFile: File | null;
  videoUrl: string;
  placement: VideoPlacement;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onVideoUrlChange: (url: string) => void;
  onPlacementChange: (placement: VideoPlacement) => void;
}

export const UploadTab = ({
  splitVariant,
  onSplitVariantChange,
  scriptPrompt,
  generatedScript,
  onScriptPromptChange,
  onGenerateScript,
  uploadedFile,
  videoUrl,
  placement,
  onFileSelect,
  onFileRemove,
  onVideoUrlChange,
  onPlacementChange,
}: UploadTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">{t('splitscreen.uploadYourVideo')}</h2>

      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-zinc-400">Variant</h3>
          <div className="flex bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => onSplitVariantChange('classic')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                splitVariant === 'classic' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              type="button"
            >
              Classic
            </button>
            <button
              onClick={() => onSplitVariantChange('vertical')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                splitVariant === 'vertical' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
              type="button"
            >
              Vertical
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-400">AI script</h3>
            <button
              onClick={onGenerateScript}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium"
              type="button"
            >
              Generate
            </button>
          </div>
          <input
            value={scriptPrompt}
            onChange={(e) => onScriptPromptChange(e.target.value)}
            placeholder="Topic or prompt for subtitles"
            className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          {generatedScript && (
            <div className="text-xs text-zinc-400 line-clamp-3">
              {generatedScript}
            </div>
          )}
        </div>
      </div>
      
      <FileUploadZone
        uploadedFile={uploadedFile}
        onFileSelect={onFileSelect}
        onFileRemove={onFileRemove}
        acceptedType="video"
        showUrlInput
        videoUrl={videoUrl}
        onVideoUrlChange={onVideoUrlChange}
      />

      {(uploadedFile || videoUrl) && (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">{t('splitscreen.videoPlacement')}</h3>
          <div className="flex gap-3">
            <button
              onClick={() => onPlacementChange(splitVariant === 'vertical' ? 'left' : 'top')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                placement === (splitVariant === 'vertical' ? 'left' : 'top')
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
              type="button"
            >
              <ArrowUp size={18} />
              <span className="font-medium">{splitVariant === 'vertical' ? 'Left' : t('splitscreen.placementTop')}</span>
            </button>
            <button
              onClick={() => onPlacementChange(splitVariant === 'vertical' ? 'right' : 'bottom')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                placement === (splitVariant === 'vertical' ? 'right' : 'bottom')
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
              type="button"
            >
              <ArrowDown size={18} />
              <span className="font-medium">{splitVariant === 'vertical' ? 'Right' : t('splitscreen.placementBottom')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


