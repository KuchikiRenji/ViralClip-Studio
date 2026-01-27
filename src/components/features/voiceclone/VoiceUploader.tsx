import { useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, CheckCircle, FileAudio, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
interface VoiceUploaderProps {
  uploadedFile: File | null;
  isDragging: boolean;
  canGenerate: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  onGenerate: () => void;
}
export const VoiceUploader = ({
  uploadedFile,
  isDragging,
  canGenerate,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onRemoveFile,
  onGenerate,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="max-w-4xl mx-auto">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-16 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : uploadedFile
            ? 'border-green-500 bg-green-500/10'
            : 'border-zinc-700 bg-zinc-900/30 hover:border-zinc-600'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            uploadedFile ? 'bg-green-500/20' : 'bg-blue-500/20'
          }`}>
            {uploadedFile ? (
              <CheckCircle size={32} className="text-green-400" />
            ) : (
              <Upload size={32} className="text-blue-400" />
            )}
          </div>
          {uploadedFile ? (
            <>
              <div className="flex items-center gap-2">
                <FileAudio size={20} className="text-green-400" />
                <p className="text-white font-medium">{uploadedFile.name}</p>
              </div>
              <p className="text-sm text-zinc-500">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                onClick={onRemoveFile}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
                type="button"
              >
                {t('common.removeFile')}
              </button>
            </>
          ) : (
            <>
              <p className="text-white font-medium">{t('common.upload')}</p>
              <p className="text-sm text-zinc-500">{t('common.dragDrop')}</p>
              <p className="text-xs text-zinc-600">{t('common.mp3Format')}</p>
            </>
          )}
        </div>
        {!uploadedFile && (
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onFileSelect}
          />
        )}
      </div>
      <div className="flex justify-center mt-8">
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`px-8 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            canGenerate
              ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
          type="button"
        >
          <Sparkles size={18} />
          {t('voiceClone.saveCreate')}
        </button>
      </div>
    </div>
  );
};







