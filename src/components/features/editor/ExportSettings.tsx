import { 
  Music, 
  Youtube, 
  Instagram, 
  Settings2, 
  ChevronDown, 
  ChevronUp,
  Facebook,
  Twitter,
  Linkedin,
  Camera,
  Smartphone,
  Monitor,
  Film
} from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

type ExportPreset = 
  | 'TikTok' 
  | 'YouTube' 
  | 'YouTubeShorts'
  | 'Instagram' 
  | 'InstagramReels'
  | 'InstagramStory'
  | 'Facebook'
  | 'Twitter'
  | 'Snapchat'
  | 'LinkedIn'
  | 'Pinterest'
  | 'Custom';

type ExportQuality = '720p' | '1080p' | '1440p' | '4K';

interface ExportSettingsState {
  preset: ExportPreset;
  quality: ExportQuality;
  fps: number;
  includeAudio: boolean;
  includeCaptions: boolean;
  addWatermark: boolean;
}

interface ExportSettingsProps {
  settings: ExportSettingsState;
  showAdvanced: boolean;
  duration: number;
  clipCount: number;
  estimatedSize: string;
  onSettingsChange: (settings: Partial<ExportSettingsState>) => void;
  onToggleAdvanced: () => void;
}

interface PresetConfig {
  name: ExportPreset;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  width: number;
  height: number;
  aspectRatio: string;
  category: 'vertical' | 'horizontal' | 'square';
  translationKey: string;
}

const EXPORT_PRESETS: PresetConfig[] = [
  { name: 'TikTok', icon: Music, width: 1080, height: 1920, aspectRatio: '9:16', category: 'vertical', translationKey: 'export.preset.tiktok' },
  { name: 'YouTubeShorts', icon: Youtube, width: 1080, height: 1920, aspectRatio: '9:16', category: 'vertical', translationKey: 'export.preset.youtubeShorts' },
  { name: 'InstagramReels', icon: Instagram, width: 1080, height: 1920, aspectRatio: '9:16', category: 'vertical', translationKey: 'export.preset.instagramReels' },
  { name: 'InstagramStory', icon: Camera, width: 1080, height: 1920, aspectRatio: '9:16', category: 'vertical', translationKey: 'export.preset.instagramStory' },
  { name: 'Snapchat', icon: Smartphone, width: 1080, height: 1920, aspectRatio: '9:16', category: 'vertical', translationKey: 'export.preset.snapchat' },
  { name: 'YouTube', icon: Youtube, width: 1920, height: 1080, aspectRatio: '16:9', category: 'horizontal', translationKey: 'export.preset.youtube' },
  { name: 'Facebook', icon: Facebook, width: 1920, height: 1080, aspectRatio: '16:9', category: 'horizontal', translationKey: 'export.preset.facebook' },
  { name: 'Twitter', icon: Twitter, width: 1920, height: 1080, aspectRatio: '16:9', category: 'horizontal', translationKey: 'export.preset.twitter' },
  { name: 'LinkedIn', icon: Linkedin, width: 1920, height: 1080, aspectRatio: '16:9', category: 'horizontal', translationKey: 'export.preset.linkedin' },
  { name: 'Instagram', icon: Instagram, width: 1080, height: 1080, aspectRatio: '1:1', category: 'square', translationKey: 'export.preset.instagram' },
  { name: 'Pinterest', icon: Film, width: 1000, height: 1500, aspectRatio: '2:3', category: 'vertical', translationKey: 'export.preset.pinterest' },
  { name: 'Custom', icon: Monitor, width: 1920, height: 1080, aspectRatio: '16:9', category: 'horizontal', translationKey: 'export.preset.custom' },
];

interface QualityConfig {
  value: ExportQuality;
  translationKey: string;
  bitrate: number;
  multiplier: number;
}

const QUALITY_OPTIONS: QualityConfig[] = [
  { value: '720p', translationKey: 'export.quality.720p', bitrate: 5000000, multiplier: 0.667 },
  { value: '1080p', translationKey: 'export.quality.1080p', bitrate: 10000000, multiplier: 1 },
  { value: '1440p', translationKey: 'export.quality.1440p', bitrate: 16000000, multiplier: 1.333 },
  { value: '4K', translationKey: 'export.quality.4k', bitrate: 25000000, multiplier: 2 },
];

const FPS_OPTIONS = [24, 30, 60];

export const ExportSettings = ({
  settings,
  showAdvanced,
  duration,
  clipCount,
  estimatedSize,
  onSettingsChange,
  onToggleAdvanced,
}) => {
  const { t } = useTranslation();
  const selectedPresetInfo = EXPORT_PRESETS.find(p => p.name === settings.preset);
  const qualityMultiplier = QUALITY_OPTIONS.find(q => q.value === settings.quality)?.multiplier ?? 1;

  const getOutputResolution = () => {
    if (!selectedPresetInfo) return '1920x1080';
    const w = Math.round(selectedPresetInfo.width * qualityMultiplier);
    const h = Math.round(selectedPresetInfo.height * qualityMultiplier);
    return `${w}x${h}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const verticalPresets = EXPORT_PRESETS.filter(p => p.category === 'vertical');
  const horizontalPresets = EXPORT_PRESETS.filter(p => p.category === 'horizontal');
  const squarePresets = EXPORT_PRESETS.filter(p => p.category === 'square' || p.name === 'Custom');

  const renderPresetButton = (preset: PresetConfig) => {
    const Icon = preset.icon;
    const isSelected = settings.preset === preset.name;
    
    return (
      <button
        key={preset.name}
        onClick={() => onSettingsChange({ preset: preset.name })}
        className={`flex flex-col items-center justify-center gap-1 p-2 sm:p-3 rounded-xl transition-all touch-target ${
          isSelected
            ? 'bg-blue-600 border-2 border-blue-400 shadow-lg shadow-blue-600/20'
            : 'bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:border-blue-500/50'
        }`}
        type="button"
      >
        <Icon size={18} className="text-white" />
        <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">{t(preset.translationKey)}</span>
        <span className="text-[8px] sm:text-[10px] text-zinc-400">{preset.aspectRatio}</span>
      </button>
    );
  };

  return (
    <>
      <div>
        <span className="text-xs text-zinc-400 uppercase font-medium mb-3 block">{t('export.platformPreset')}</span>
        
        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-zinc-500 mb-1.5 block">Vertical (9:16)</span>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {verticalPresets.map(renderPresetButton)}
            </div>
          </div>
          
          <div>
            <span className="text-[10px] text-zinc-500 mb-1.5 block">Horizontal (16:9)</span>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {horizontalPresets.map(renderPresetButton)}
            </div>
          </div>
          
          <div>
            <span className="text-[10px] text-zinc-500 mb-1.5 block">Square & Other</span>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {squarePresets.map(renderPresetButton)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <span className="text-xs text-zinc-400 uppercase font-medium mb-3 block">{t('export.quality')}</span>
        <div className="grid grid-cols-4 gap-2">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q.value}
              onClick={() => onSettingsChange({ quality: q.value })}
              className={`px-2 py-2.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all touch-target ${
                settings.quality === q.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/5'
              }`}
              type="button"
            >
              {t(q.translationKey)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onToggleAdvanced}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 rounded-lg text-sm text-zinc-300 hover:bg-zinc-900 transition-colors"
        type="button"
      >
        <span className="flex items-center gap-2">
          <Settings2 size={16} />
          {t('export.advancedSettings')}
        </span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 bg-zinc-900/30 rounded-lg border border-white/5">
          <div>
            <span className="text-xs text-zinc-400 mb-2 block">{t('export.frameRate')}</span>
            <div className="flex gap-2">
              {FPS_OPTIONS.map((fps) => (
                <button
                  key={fps}
                  onClick={() => onSettingsChange({ fps })}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    settings.fps === fps
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                  type="button"
                >
                  {fps} fps
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 bg-zinc-800/50 rounded-lg">
            <span className="text-xs text-zinc-500">{t('export.format')}: {t('export.formatDescription')}</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
              <span className="text-sm text-white">{t('export.includeAudio')}</span>
              <input
                type="checkbox"
                checked={settings.includeAudio}
                onChange={(e) => onSettingsChange({ includeAudio: e.target.checked })}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
              <span className="text-sm text-white">{t('export.includeCaptions')}</span>
              <input
                type="checkbox"
                checked={settings.includeCaptions}
                onChange={(e) => onSettingsChange({ includeCaptions: e.target.checked })}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
              <span className="text-sm text-white">{t('export.watermark')}</span>
              <input
                type="checkbox"
                checked={settings.addWatermark}
                onChange={(e) => onSettingsChange({ addWatermark: e.target.checked })}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 sm:p-4 bg-zinc-900 rounded-xl border border-white/5">
          <span className="text-[10px] sm:text-xs text-zinc-500 uppercase">{t('export.duration')}</span>
          <p className="text-sm sm:text-base font-bold text-white mt-1">{formatDuration(duration)}</p>
        </div>
        <div className="p-3 sm:p-4 bg-zinc-900 rounded-xl border border-white/5">
          <span className="text-[10px] sm:text-xs text-zinc-500 uppercase">{t('export.estimatedSize')}</span>
          <p className="text-sm sm:text-base font-bold text-white mt-1">{estimatedSize} MB</p>
        </div>
      </div>

      {selectedPresetInfo && (
        <div className="p-3 sm:p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-400">{t('export.outputResolution')}</span>
              <p className="text-sm font-bold text-white mt-0.5">{getOutputResolution()}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-blue-400">{t('export.clips')}</span>
              <p className="text-sm font-bold text-white mt-0.5">{clipCount}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export type { ExportPreset, ExportQuality, ExportSettingsState };
export { EXPORT_PRESETS, QUALITY_OPTIONS };
