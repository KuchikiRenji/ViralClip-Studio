import { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { Upload, Check, Play } from 'lucide-react';
import type { StoryVideoState } from '../StoryVideoTypes';
import { BACKGROUND_VIDEOS, BYTES_PER_MB, MAX_BACKGROUND_FILE_SIZE_MB } from '../StoryVideoConstants';
import { useTranslation } from '../../../../hooks/useTranslation';
interface BackgroundTabProps {
  state: StoryVideoState;
  updateState: <K extends keyof StoryVideoState>(key: K, value: StoryVideoState[K]) => void;
  setState: Dispatch<SetStateAction<StoryVideoState>>;
  handleBackgroundUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}
export const BackgroundTab = ({ state, updateState, setState, handleBackgroundUpload }: BackgroundTabProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('storyVideo.background.title')}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => updateState('backgroundSource', 'library')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              state.backgroundSource === 'library' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {t('storyVideo.background.library')}
          </button>
          <button
            onClick={() => updateState('backgroundSource', 'upload')}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              state.backgroundSource === 'upload' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {t('storyVideo.background.upload')}
          </button>
        </div>
      </div>
      {state.backgroundSource === 'library' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {BACKGROUND_VIDEOS.map(video => (
            <div
              key={video.id}
              onClick={() => updateState('selectedBackground', video.id)}
              className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer transition-all group ${
                state.selectedBackground === video.id
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900'
                  : 'hover:ring-2 hover:ring-zinc-600'
              }`}
            >
              <img src={video.thumbnail} alt={video.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <span className="text-xs text-white font-medium">{video.label}</span>
                <span className="text-xs text-white/70">{video.duration}</span>
              </div>
              {state.selectedBackground === video.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Play size={32} className="text-white" fill="white" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <label className="block">
          <input
            type="file"
            accept="video/mp4,video/mov,video/webm"
            onChange={handleBackgroundUpload}
            className="hidden"
          />
          <div className="border-2 border-dashed border-zinc-700 rounded-xl p-12 flex flex-col items-center justify-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer">
            {state.uploadedBackgroundFile ? (
              <>
                <Check size={48} className="text-emerald-500 mb-4" />
                <span className="text-emerald-400 font-medium">{state.uploadedBackgroundFile.name}</span>
                <span className="text-zinc-500 text-sm mt-1">
                  {(state.uploadedBackgroundFile.size / BYTES_PER_MB).toFixed(2)} MB
                </span>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setState(prev => ({ ...prev, uploadedBackgroundFile: null }));
                  }}
                  className="mt-4 text-sm text-red-400 hover:text-red-300"
                >
                  {t('storyVideo.background.removeFile')}
                </button>
              </>
            ) : (
              <>
                <Upload size={48} className="text-zinc-600 mb-4" />
                  <span className="text-zinc-400 font-medium">{t('storyVideo.background.dropOrClick')}</span>
                  <span className="text-zinc-600 text-sm mt-1">{t('storyVideo.background.supported', { max: MAX_BACKGROUND_FILE_SIZE_MB })}</span>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
};







