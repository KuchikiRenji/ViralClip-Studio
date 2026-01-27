import { useRef } from 'react';
import { Upload, Check, X, Play } from 'lucide-react';
import { TextStoryState, Message } from './types';
import { BACKGROUND_VIDEOS } from './constants';
import { MessagesEditor } from './MessagesEditor';
import { StorySettings } from './StorySettings';
import { StoryAudioSettings } from './StoryAudioSettings';
import { useTranslation } from '../../../../hooks/useTranslation';
interface TextStoryControlsProps {
  state: TextStoryState;
  updateState: <K extends keyof TextStoryState>(key: K, value: TextStoryState[K]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  addMessage: () => void;
  deleteMessage: (id: string) => void;
  duplicateMessage: (id: string) => void;
  swapAllMessages: () => void;
  parseScript: (script: string) => void;
  generateAIScript: () => void;
  onProfilePhotoSelect?: (file: File) => void;
  onProfilePhotoRemove?: () => void;
  onBackgroundFileSelect?: (file: File) => void;
  onBackgroundFileRemove?: () => void;
  onPreviewVoice?: (side: 'left' | 'right') => void;
  onReorderMessages?: (messages: Message[]) => void;
  onLaunchTemplateBuilder?: () => void;
}
export const TextStoryControls = ({
  state,
  updateState,
  updateMessage,
  addMessage,
  deleteMessage,
  duplicateMessage,
  swapAllMessages,
  parseScript,
  generateAIScript,
  onProfilePhotoSelect,
  onProfilePhotoRemove,
  onBackgroundFileSelect,
  onBackgroundFileRemove,
  onPreviewVoice,
  onReorderMessages,
  onLaunchTemplateBuilder,
}) => {
  const { t } = useTranslation();
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);
  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onBackgroundFileSelect) {
      onBackgroundFileSelect(file);
    }
  };
  const handleBackgroundDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/') && onBackgroundFileSelect) {
      onBackgroundFileSelect(file);
    }
  };
  const renderBackgroundTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <input
        ref={backgroundFileInputRef}
        type="file"
        accept="video/*"
        onChange={handleBackgroundFileChange}
        className="hidden"
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-base sm:text-lg font-medium">{t('textStory.backgroundVideo')}</span>
        <div className="flex gap-2">
          <button 
            onClick={() => updateState('backgroundSource', 'library')}
            className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm font-medium rounded-full transition-colors touch-target-sm active:scale-95 ${
              state.backgroundSource === 'library' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            type="button"
          >
            {t('textStory.library')}
          </button>
          <button 
            onClick={() => updateState('backgroundSource', 'upload')}
            className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm font-medium rounded-full transition-colors touch-target-sm active:scale-95 ${
              state.backgroundSource === 'upload' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
            type="button"
          >
            {t('textStory.upload')}
          </button>
        </div>
      </div>
      {state.backgroundSource === 'library' ? (
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {BACKGROUND_VIDEOS.map(video => (
            <div
              key={video.id}
              onClick={() => updateState('selectedBackground', video.id)}
              className={`relative aspect-[9/16] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer transition-all group touch-manipulation active:scale-[0.98] ${
                state.selectedBackground === video.id 
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900' 
                  : 'hover:ring-2 hover:ring-zinc-600'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  updateState('selectedBackground', video.id);
                }
              }}
            >
              <img src={video.thumbnail} alt={video.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-white font-medium truncate">{video.label}</span>
                <span className="text-[9px] sm:text-xs text-white bg-black/50 px-1.5 sm:px-2 py-0.5 rounded">
                  {video.duration}
                </span>
              </div>
              {state.selectedBackground === video.id && (
                <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="sm:hidden text-white" />
                  <Check size={14} className="hidden sm:block text-white" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Play size={24} className="sm:hidden text-white" fill="white" />
                <Play size={32} className="hidden sm:block text-white" fill="white" />
              </div>
            </div>
          ))}
        </div>
      ) : state.uploadedBackgroundFile ? (
        <div className="border-2 border-green-500 rounded-xl p-6 sm:p-8 text-center bg-green-500/10">
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={24} className="sm:hidden text-green-400" />
              <Check size={32} className="hidden sm:block text-green-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">{state.uploadedBackgroundFile.name}</p>
              <p className="text-zinc-400 text-xs sm:text-sm mt-1">
                {(state.uploadedBackgroundFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={onBackgroundFileRemove}
              className="px-4 py-2.5 text-red-400 hover:text-red-300 text-sm font-medium transition-colors flex items-center gap-2 touch-target active:scale-95"
              type="button"
            >
              <X size={16} />
              {t('textStory.removeFile')}
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => backgroundFileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleBackgroundDrop}
          className="border-2 border-dashed border-zinc-700 rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer touch-manipulation active:scale-[0.99]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              backgroundFileInputRef.current?.click();
            }
          }}
        >
          <Upload size={36} className="sm:hidden text-zinc-600 mb-3" />
          <Upload size={48} className="hidden sm:block text-zinc-600 mb-4" />
          <span className="text-zinc-400 font-medium text-sm sm:text-base text-center">{t('textStory.dragDropUpload')}</span>
          <span className="text-zinc-600 text-xs sm:text-sm mt-1 text-center">{t('textStory.videoFormats')}</span>
        </div>
      )}
    </div>
  );
  return (
    <div className="flex-1 min-w-0 order-2 lg:order-1">
      {state.currentTab === 'templates' && (
        <StorySettings
          state={state}
          updateState={updateState}
          onProfilePhotoSelect={onProfilePhotoSelect}
          onProfilePhotoRemove={onProfilePhotoRemove}
          onLaunchTemplateBuilder={onLaunchTemplateBuilder}
        />
      )}
      {state.currentTab === 'script' && (
        <MessagesEditor
          state={state}
          updateState={updateState}
          updateMessage={updateMessage}
          addMessage={addMessage}
          deleteMessage={deleteMessage}
          duplicateMessage={duplicateMessage}
          swapAllMessages={swapAllMessages}
          parseScript={parseScript}
          generateAIScript={generateAIScript}
          onReorderMessages={onReorderMessages}
        />
      )}
      {state.currentTab === 'voices' && (
        <StoryAudioSettings
          state={state}
          updateState={updateState}
          onPreviewVoice={onPreviewVoice}
        />
      )}
      {state.currentTab === 'background' && renderBackgroundTab()}
    </div>
  );
};