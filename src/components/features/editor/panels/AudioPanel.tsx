import { useCallback, useState, useRef } from 'react';
import { Music, Play, Pause, Plus, Upload, Search, Volume2, Loader2, Zap } from 'lucide-react';
import { TIMING } from '../../../../constants/timing';
import { EditorPanelState, AudioTrackState } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
interface AudioPanelProps {
  state: EditorPanelState;
  onStateChange: (updates: Partial<EditorPanelState>) => void;
  onAddAudioTrack?: (track: AudioTrackState) => void;
}
const MUSIC_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'upbeat', label: 'Upbeat' },
  { id: 'chill', label: 'Chill' },
  { id: 'cinematic', label: 'Cinema' },
];
const STOCK_MUSIC = [
  { id: 'track-1', name: 'Uplifting', category: 'upbeat', duration: 180, bpm: 120 },
  { id: 'track-2', name: 'Lofi Beat', category: 'chill', duration: 240, bpm: 85 },
  { id: 'track-3', name: 'Epic', category: 'cinematic', duration: 300, bpm: 100 },
  { id: 'track-4', name: 'Tech House', category: 'upbeat', duration: 210, bpm: 128 },
  { id: 'track-5', name: 'Acoustic', category: 'chill', duration: 195, bpm: 95 },
  { id: 'track-6', name: 'Trailer', category: 'cinematic', duration: 120, bpm: 140 },
];
const SOUND_EFFECTS = [
  { id: 'sfx-1', name: 'Whoosh', duration: 2 },
  { id: 'sfx-2', name: 'Pop', duration: 1 },
  { id: 'sfx-3', name: 'Click', duration: 0.5 },
  { id: 'sfx-4', name: 'Notify', duration: 2 },
  { id: 'sfx-5', name: 'Success', duration: 3 },
  { id: 'sfx-6', name: 'Impact', duration: 1 },
];
type AudioTab = 'music' | 'sfx' | 'upload';
import type { LucideIcon } from 'lucide-react';
const TAB_CONFIG: { id: AudioTab; icon: LucideIcon; labelKey: string }[] = [
  { id: 'music', icon: Music, labelKey: 'audioPanel.tab.music' },
  { id: 'sfx', icon: Zap, labelKey: 'audioPanel.tab.effects' },
  { id: 'upload', icon: Upload, labelKey: 'audioPanel.tab.upload' },
];
export const AudioPanel = ({
  state,
  onStateChange,
  onAddAudioTrack,
}) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AudioTab>('music');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [volume, setVolume] = useState(80);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filteredMusic = STOCK_MUSIC.filter((track) => {
    const matchesCategory = selectedCategory === 'all' || track.category === selectedCategory;
    const matchesSearch = track.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const filteredSfx = SOUND_EFFECTS.filter((sfx) =>
    sfx.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handlePlayTrack = useCallback((trackId: string) => {
    setPlayingTrack(playingTrack === trackId ? null : trackId);
  }, [playingTrack]);
  const handleAddTrack = useCallback((track: typeof STOCK_MUSIC[0] | typeof SOUND_EFFECTS[0]) => {
    if (!onAddAudioTrack) return;
    const audioTrack: AudioTrackState = {
      id: `audio-${Date.now()}`,
      title: track.name,
      name: track.name,
      url: '',
      duration: track.duration,
      volume,
      type: 'bpm' in track ? 'music' : 'sfx',
    };
    onAddAudioTrack(audioTrack);
  }, [onAddAudioTrack, volume]);
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddAudioTrack) return;
    setIsUploading(true);
    const url = URL.createObjectURL(file);
    await new Promise(resolve => setTimeout(resolve, TIMING.DELAY_MS.MEDIUM));
    const track: AudioTrackState = {
      id: `upload-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      name: file.name.replace(/\.[^/.]+$/, ''),
      url,
      duration: 0,
      volume,
      type: 'music',
    };
    onAddAudioTrack(track);
    setIsUploading(false);
    e.target.value = '';
  }, [onAddAudioTrack, volume]);
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Music size={14} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">{t('audioPanel.title')}</h3>
          <p className="text-[10px] text-zinc-500">{t('audioPanel.subtitle')}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="grid grid-cols-3 gap-1 bg-zinc-800/50 rounded-xl p-1">
            {TAB_CONFIG.map((tabItem) => {
              const Icon = tabItem.icon;
              const isActive = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  className={`flex flex-col items-center gap-0.5 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  }`}
                  type="button"
                >
                  <Icon size={14} />
                  <span className="text-[9px] font-medium">{t(tabItem.labelKey)}</span>
                </button>
              );
            })}
          </div>
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              placeholder={t('audioPanel.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Volume2 size={12} /> {t('audioPanel.masterVolume')}
              </span>
              <span className="font-mono">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
            />
          </div>
          {tab === 'music' && (
            <div className="space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {MUSIC_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-[10px] font-medium rounded-full whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                    }`}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                {filteredMusic.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    {t('audioPanel.noTracks')}
                  </div>
                ) : (
                  filteredMusic.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-2 p-2.5 bg-zinc-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <button
                        onClick={() => handlePlayTrack(track.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          playingTrack === track.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-zinc-700/50 text-white hover:bg-blue-600'
                        }`}
                        type="button"
                      >
                        {playingTrack === track.id ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} className="ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{track.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {formatDuration(track.duration)} • {track.bpm} BPM
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddTrack(track)}
                        className="w-7 h-7 rounded-lg bg-zinc-700/50 text-zinc-400 hover:bg-blue-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shrink-0"
                        type="button"
                        title={t('audioPanel.addToTimeline')}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {tab === 'sfx' && (
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('audioPanel.soundEffects')}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {filteredSfx.length === 0 ? (
                  <div className="col-span-2 text-center py-6 text-zinc-500 text-xs">
                    {t('audioPanel.noEffects')}
                  </div>
                ) : (
                  filteredSfx.map((sfx) => (
                    <button
                      key={sfx.id}
                      onClick={() => handleAddTrack(sfx)}
                      className="flex items-center gap-2 p-2.5 bg-zinc-800/30 rounded-xl border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
                      type="button"
                    >
                      <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center group-hover:bg-blue-600 transition-colors shrink-0">
                        <Zap size={14} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{sfx.name}</div>
                        <div className="text-[10px] text-zinc-500">{sfx.duration}s</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          {tab === 'upload' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 size={24} className="text-blue-500 animate-spin" />
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                      <Upload size={20} className="text-zinc-400 group-hover:text-blue-400" />
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-blue-400 font-medium">
                      {t('audioPanel.uploadAudio')}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-1">
                      {t('audioPanel.audioFormats')}
                    </span>
                  </>
                )}
              </label>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="flex items-start gap-2">
                  <Music size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {t('audioPanel.uploadHint')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};