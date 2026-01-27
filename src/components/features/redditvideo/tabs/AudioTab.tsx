import { useState, useMemo } from 'react';
import { Search, Volume2, Music, Settings2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { RedditVideoState, VoiceOption } from '../types';
import { VOICE_OPTIONS, MUSIC_OPTIONS } from '../constants';
import sharedStyles from '../RedditVideo.module.css';

interface AudioTabProps {
  state: RedditVideoState;
  updateState: <K extends keyof RedditVideoState>(key: K, value: RedditVideoState[K]) => void;
  onPreviewVoice: (voiceId: string) => void;
  onGenerate: () => void;
}

const WAVEFORM_BARS_COUNT = 40;

const generateWaveformData = () =>
  Array.from({ length: WAVEFORM_BARS_COUNT }, () => ({
    height: Math.random() * 100,
    opacity: 0.3 + Math.random() * 0.7,
  }));

export const AudioTab = ({
  state,
  updateState,
  onPreviewVoice,
  onGenerate,
}: AudioTabProps) => {
  const { t } = useTranslation();
  const [introSearch, setIntroSearch] = useState('');
  const [scriptSearch, setScriptSearch] = useState('');

  const waveformData = useMemo(() => {
    const data: Record<string, { height: number; opacity: number }[]> = {};
    MUSIC_OPTIONS.forEach(music => {
      if (music.id !== 'none') {
        data[music.id] = generateWaveformData();
      }
    });
    return data;
  }, []);

  const filterVoices = (search: string) => {
    if (!search) return VOICE_OPTIONS;
    const lowerSearch = search.toLowerCase();
    return VOICE_OPTIONS.filter(v =>
      v.name.toLowerCase().includes(lowerSearch) ||
      v.gender.includes(lowerSearch) ||
      v.age.includes(lowerSearch) ||
      v.language.includes(lowerSearch)
    );
  };

  const renderVoiceOption = (
    voice: VoiceOption,
    isSelected: boolean,
    onSelect: () => void
  ) => (
    <button
      key={voice.id}
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border text-left transition-all group ${
        isSelected
          ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
          : 'bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-800/80'
      }`}
      type="button"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-zinc-700'}`} />
          <span className="text-white font-semibold text-sm">{voice.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreviewVoice(voice.id);
          }}
          className="p-2 rounded-lg bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100"
          type="button"
        >
          <Settings2 size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
          voice.gender === 'male' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
        }`}>
          {t(`redditVideo.audio.gender.${voice.gender}`)}
        </span>
        <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-zinc-800 text-zinc-400 border border-white/5">
          {t(`redditVideo.audio.age.${voice.age}`)}
        </span>
        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
          voice.language === 'english' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
        }`}>
          {t(`redditVideo.audio.language.${voice.language}`)}
        </span>
      </div>
    </button>
  );

  const renderMusicOption = (musicId: string, name: string, duration: string, isSelected: boolean) => (
    <button
      key={musicId}
      onClick={() => updateState('backgroundMusic', musicId)}
      className={`w-full p-4 rounded-xl border text-left transition-all group ${
        isSelected
          ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-800/80'
      }`}
      type="button"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-700'}`} />
          <div>
            <span className="text-white font-semibold text-sm">{name}</span>
            {musicId === 'none' && (
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                {t('redditVideo.audio.noMusicNote')}
              </p>
            )}
          </div>
        </div>
        {duration && (
          <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-300">
            <span className="text-[10px] font-mono">{duration}</span>
            <Music size={14} />
          </div>
        )}
      </div>
      {musicId !== 'none' && waveformData[musicId] && (
        <div className="mt-4 h-8 flex items-end gap-0.5 px-2">
          {waveformData[musicId].map((bar, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${isSelected ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              style={{
                height: `${bar.height}%`,
                opacity: isSelected ? bar.opacity : bar.opacity * 0.5,
              }}
            />
          ))}
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Audio Status Header */}
      <div className={`${sharedStyles.panel} p-4 bg-zinc-900/80 border-blue-500/30`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {state.isGenerating ? (
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <RefreshCw size={20} className="text-blue-400 animate-spin" />
              </div>
            ) : state.validationError ? (
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
            ) : state.generatedScriptAudioUrl ? (
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={20} className="text-green-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <Volume2 size={20} className="text-zinc-400" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-white">
                {state.isGenerating 
                  ? t('redditVideo.audio.generating') 
                  : state.validationError 
                    ? 'Generation Error' 
                    : state.generatedScriptAudioUrl 
                      ? 'Audio Ready' 
                      : 'Voiceover Status'}
              </h3>
              <p className="text-xs text-zinc-500">
                {state.isGenerating 
                  ? `Processing your audio (${state.generationProgress}%)` 
                  : state.validationError 
                    ? state.validationError 
                    : state.generatedScriptAudioUrl 
                      ? 'Intro and script audio are generated and synced.' 
                      : 'Click generate to create your voiceover tracks.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onGenerate}
            disabled={state.isGenerating || !state.scriptContent.trim()}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              state.isGenerating
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : state.validationError
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : state.generatedScriptAudioUrl
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            type="button"
          >
            {state.isGenerating ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {state.validationError ? 'Retry' : state.generatedScriptAudioUrl ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${sharedStyles.panel} p-4 sm:p-5 flex flex-col h-[520px]`}>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Volume2 size={18} className="text-blue-500" />
            {t('redditVideo.audio.selectIntroVoice')}
          </h2>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={introSearch}
              onChange={(e) => setIntroSearch(e.target.value)}
              placeholder={t('redditVideo.audio.searchVoice')}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-white/5 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 pr-1">
            {filterVoices(introSearch).map((voice) =>
              renderVoiceOption(
                voice,
                state.introVoice === voice.id,
                () => updateState('introVoice', voice.id)
              )
            )}
          </div>
        </div>

        <div className={`${sharedStyles.panel} p-4 sm:p-5 flex flex-col h-[520px]`}>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Volume2 size={18} className="text-purple-500" />
            {t('redditVideo.audio.selectScriptVoice')}
          </h2>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={scriptSearch}
              onChange={(e) => setScriptSearch(e.target.value)}
              placeholder={t('redditVideo.audio.searchVoice')}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-white/5 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 pr-1">
            {filterVoices(scriptSearch).map((voice) =>
              renderVoiceOption(
                voice,
                state.scriptVoice === voice.id,
                () => updateState('scriptVoice', voice.id)
              )
            )}
          </div>
        </div>

        <div className={`${sharedStyles.panel} p-4 sm:p-5 flex flex-col h-[520px]`}>
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Music size={18} className="text-emerald-500" />
            {t('redditVideo.audio.selectMusic')}
          </h2>
          <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 pr-1">
            {MUSIC_OPTIONS.map((music) =>
              renderMusicOption(
                music.id,
                music.name,
                music.duration,
                state.backgroundMusic === music.id
              )
            )}
          </div>
        </div>
      </div>

      <div className={`${sharedStyles.panel} p-4 sm:p-6`}>
        <h2 className="text-lg font-semibold text-white mb-4">
          {t('redditVideo.audio.volumeSettings')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <Volume2 size={16} />
                {t('redditVideo.audio.voiceVolume')}
              </label>
              <span className="text-sm text-white font-mono">
                {Math.round(state.voiceVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.voiceVolume}
              onChange={(e) => updateState('voiceVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <Music size={16} />
                {t('redditVideo.audio.musicVolume')}
              </label>
              <span className="text-sm text-white font-mono">
                {Math.round(state.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.musicVolume}
              onChange={(e) => updateState('musicVolume', parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
