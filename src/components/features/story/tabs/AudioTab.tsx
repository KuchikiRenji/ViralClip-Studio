import { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { Play, Pause, Volume2, Search, Check, Upload, AlertCircle, ChevronDown } from 'lucide-react';
import type { StoryVideoState } from '../StoryVideoTypes';
import { VOICE_OPTIONS, MUSIC_TRACKS, BYTES_PER_MB, MAX_MUSIC_FILE_SIZE_MB } from '../StoryVideoConstants';
import { useTranslation } from '../../../../hooks/useTranslation';
interface AudioTabProps {
  state: StoryVideoState;
  updateState: <K extends keyof StoryVideoState>(key: K, value: StoryVideoState[K]) => void;
  setState: Dispatch<SetStateAction<StoryVideoState>>;
  previewVoice: () => void;
  handleMusicUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}
export const AudioTab = ({ state, updateState, setState, previewVoice, handleMusicUpload }: AudioTabProps) => {
  const { t } = useTranslation();
  const filteredMusicTracks = MUSIC_TRACKS.filter(track => 
    track.name.toLowerCase().includes(state.musicSearchQuery.toLowerCase())
  );
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{t('storyVideo.audio.voiceoverTitle')}</h3>
            <p className="text-xs text-zinc-500 mt-1">{t('storyVideo.audio.voiceoverSubtitle')}</p>
          </div>
          <button
            onClick={() => updateState('voiceoverEnabled', !state.voiceoverEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${state.voiceoverEnabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.voiceoverEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {state.voiceoverEnabled && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.audio.selectVoice')}</label>
              <div className="relative w-48 flex items-center">
                <select
                  value={state.selectedVoice}
                  onChange={(e) => updateState('selectedVoice', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none appearance-none cursor-pointer"
                >
                  {VOICE_OPTIONS.map(voice => (
                    <option key={voice.id} value={voice.id}>{voice.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 w-4 h-4 text-zinc-400 pointer-events-none flex-shrink-0" />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={previewVoice}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  state.isPreviewingVoice 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-zinc-800 hover:bg-zinc-700'
                }`}
              >
                {state.isPreviewingVoice ? (
                  <>
                    <Pause size={14} />
                    {t('storyVideo.audio.stopPreview')}
                  </>
                ) : (
                  <>
                    <Play size={14} fill="white" />
                    {t('storyVideo.audio.previewVoice')}
                  </>
                )}
              </button>
            </div>
            {!state.script.trim() && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle size={12} /> {t('storyVideo.audio.addScriptNotice')}
              </p>
            )}
          </div>
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{t('storyVideo.audio.musicTitle')}</h3>
            <p className="text-xs text-zinc-500 mt-1">{t('storyVideo.audio.musicSubtitle')}</p>
          </div>
          <button
            onClick={() => updateState('backgroundMusicEnabled', !state.backgroundMusicEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${state.backgroundMusicEnabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.backgroundMusicEnabled ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        {state.backgroundMusicEnabled && (
          <>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-zinc-400">{t('storyVideo.audio.musicSource')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateState('musicSource', 'library')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    state.musicSource === 'library' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {t('storyVideo.audio.library')}
                </button>
                <button
                  onClick={() => updateState('musicSource', 'upload')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    state.musicSource === 'upload' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {t('storyVideo.audio.upload')}
                </button>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">{t('storyVideo.audio.musicVolume')}</label>
                <div className="flex items-center gap-3 w-48">
                  <Volume2 size={14} className="text-zinc-500" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={state.musicVolume}
                    onChange={(e) => updateState('musicVolume', Number(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-xs text-zinc-400 w-8">{Math.round(state.musicVolume * 100)}%</span>
                </div>
              </div>
            </div>
            {state.musicSource === 'library' ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h4 className="text-sm font-medium mb-3">{t('storyVideo.audio.libraryTitle')}</h4>
                <div className="relative mb-4 flex items-center">
                  <Search size={16} className="absolute left-3 w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={state.musicSearchQuery}
                    onChange={(e) => updateState('musicSearchQuery', e.target.value)}
                    placeholder={t('storyVideo.audio.searchPlaceholder')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {filteredMusicTracks.length > 0 ? (
                    filteredMusicTracks.map(track => (
                      <button
                        key={track.id}
                        onClick={() => updateState('selectedMusic', track.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                          state.selectedMusic === track.id
                            ? 'bg-blue-600/20 border border-blue-500/50'
                            : 'hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${state.selectedMusic === track.id ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                            <Play size={12} fill="white" className="text-white" />
                          </div>
                          <span className="text-sm">{track.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">{track.duration}</span>
                          {state.selectedMusic === track.id && (
                            <Check size={14} className="text-blue-400" />
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 text-center py-4">{t('storyVideo.audio.noTracks')}</p>
                  )}
                </div>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/ogg"
                  onChange={handleMusicUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer">
                  {state.uploadedMusicFile ? (
                    <>
                      <Check size={32} className="text-emerald-500 mb-3" />
                      <span className="text-emerald-400 font-medium">{state.uploadedMusicFile.name}</span>
                      <span className="text-zinc-500 text-sm mt-1">
                        {(state.uploadedMusicFile.size / BYTES_PER_MB).toFixed(2)} MB
                      </span>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setState(prev => ({ ...prev, uploadedMusicFile: null }));
                        }}
                        className="mt-3 text-sm text-red-400 hover:text-red-300"
                      >
                        {t('storyVideo.audio.removeFile')}
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="text-zinc-600 mb-3" />
                      <span className="text-zinc-400 font-medium">{t('storyVideo.audio.uploadMusic')}</span>
                      <span className="text-zinc-600 text-sm mt-1">{t('storyVideo.audio.supported', { max: MAX_MUSIC_FILE_SIZE_MB })}</span>
                    </>
                  )}
                </div>
              </label>
            )}
          </>
        )}
      </div>
    </div>
  );
};