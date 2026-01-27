import { useCallback, useState } from 'react';
import { User, Upload, Play, Loader2, Check, Camera, Mic } from 'lucide-react';
import { TIMING } from '../../../../constants/timing';
import { EditorPanelState } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
interface TalkingHeadPanelProps {
  state: EditorPanelState;
  onStateChange: (updates: Partial<EditorPanelState>) => void;
}
const AVATAR_PRESETS = [
  { id: 'avatar-1', name: 'Alex', style: 'Pro' },
  { id: 'avatar-2', name: 'Sarah', style: 'Pro' },
  { id: 'avatar-3', name: 'Mike', style: 'Casual' },
  { id: 'avatar-4', name: 'Emma', style: 'Casual' },
];
const AVATAR_POSITIONS = [
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
];
const AVATAR_SIZES = [
  { id: 'small', label: 'S', value: 100 },
  { id: 'medium', label: 'M', value: 150 },
  { id: 'large', label: 'L', value: 200 },
];
export const TalkingHeadPanel = ({
  state,
  onStateChange,
}) => {
  const { t } = useTranslation();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [position, setPosition] = useState('bottom-right');
  const [size, setSize] = useState('medium');
  const [scriptText, setScriptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBorder, setShowBorder] = useState(true);
  const [borderColor, setBorderColor] = useState('#3b82f6');
  const [isUploading, setIsUploading] = useState(false);
  const handleAvatarSelect = useCallback((avatarId: string) => {
    setSelectedAvatar(avatarId);
  }, []);
  const handleGenerate = useCallback(async () => {
    if (!selectedAvatar || !scriptText.trim()) return;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, TIMING.DELAY_MS.ULTRA_LONG));
    setIsGenerating(false);
    setScriptText('');
  }, [selectedAvatar, scriptText]);
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    await new Promise(resolve => setTimeout(resolve, TIMING.DELAY_MS.LONG));
    setIsUploading(false);
    e.target.value = '';
  }, []);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-white/5 shrink-0">
        <User size={16} className="text-cyan-400" />
        <h3 className="text-sm font-bold text-white">{t('avatarPanel.title')}</h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <div>
          <span className="text-[10px] text-zinc-500 mb-2 block">{t('avatarPanel.selectAvatar')}</span>
          <div className="grid grid-cols-4 gap-1.5">
            {AVATAR_PRESETS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => handleAvatarSelect(avatar.id)}
                className={`relative p-1.5 rounded-xl border-2 transition-all ${
                  selectedAvatar === avatar.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/5 bg-zinc-800/30 hover:border-white/20'
                }`}
                type="button"
              >
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center mb-1">
                  <User size={16} className="text-zinc-500" />
                </div>
                <div className="text-[9px] font-medium text-white text-center truncate">
                  {avatar.name}
                </div>
                {selectedAvatar === avatar.id && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={8} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 mb-2 block">{t('avatarPanel.orUpload')}</span>
          <label className="flex items-center justify-center w-full h-16 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 size={18} className="text-blue-500 animate-spin" />
            ) : (
              <div className="text-center">
                <Camera size={16} className="mx-auto text-zinc-500 group-hover:text-blue-400 mb-1" />
                <span className="text-[10px] text-zinc-500 group-hover:text-blue-400">
                  {t('avatarPanel.uploadPhoto')}
                </span>
              </div>
            )}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-zinc-500 mb-1.5 block">{t('avatarPanel.position')}</span>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              {AVATAR_POSITIONS.map((pos) => (
                <option key={pos.id} value={pos.id}>{pos.label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 mb-1.5 block">{t('avatarPanel.size')}</span>
            <div className="flex gap-1">
              {AVATAR_SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    size === s.id ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white'
                  }`}
                  type="button"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">{t('avatarPanel.border')}</span>
            <button
              onClick={() => setShowBorder(!showBorder)}
              className={`w-8 h-4 rounded-full relative transition-colors ${
                showBorder ? 'bg-blue-500' : 'bg-zinc-700'
              }`}
              type="button"
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                showBorder ? 'left-4' : 'left-0.5'
              }`} />
            </button>
          </div>
          {showBorder && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-white/10 bg-transparent"
              />
              <input
                type="text"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="flex-1 bg-zinc-800/50 border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white uppercase"
              />
            </div>
          )}
        </div>
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic size={12} className="text-zinc-500" />
            <span className="text-[10px] text-zinc-500">{t('avatarPanel.script')}</span>
          </div>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder={t('avatarPanel.scriptPlaceholder')}
            className="w-full bg-zinc-800/50 border border-white/5 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 resize-none outline-none focus:border-blue-500/50 transition-colors"
            rows={3}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!selectedAvatar || !scriptText.trim() || isGenerating}
          className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
          type="button"
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> {t('avatarPanel.generating')}
            </>
          ) : (
            <>
              <Play size={14} /> {t('avatarPanel.generateAvatar')}
            </>
          )}
        </button>
        <p className="text-[9px] text-zinc-600 text-center">
          {t('avatarPanel.hint')}
        </p>
      </div>
    </div>
  );
};