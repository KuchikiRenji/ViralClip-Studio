import { useState, useCallback } from 'react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  AlignLeft, 
  MessageSquare, 
  Quote, 
  Layers, 
  Sparkles,
  Check,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

type TextPresetType = 'title' | 'subtitle' | 'body' | 'caption' | 'lower-third' | 'highlight' | 'content-block' | 'custom';

interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  letterSpacing: number;
  lineHeight: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  animation: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'zoom' | 'typewriter' | 'bounce' | 'glow';
  animationDuration: number;
}

interface TextPreset {
  id: string;
  type: TextPresetType;
  name: string;
  description: string;
  style: TextStyle;
  isCustom?: boolean;
}

interface TextPresetsProps {
  onSelectPreset: (preset: TextPreset) => void;
  onSaveCustomPreset?: (preset: TextPreset) => void;
  customPresets?: TextPreset[];
}

const DEFAULT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 32,
  fontWeight: 600,
  color: '#ffffff',
  backgroundColor: 'transparent',
  backgroundOpacity: 0,
  strokeColor: '#000000',
  strokeWidth: 0,
  shadowColor: '#000000',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  letterSpacing: 0,
  lineHeight: 1.2,
  textTransform: 'none',
  animation: 'none',
  animationDuration: 500,
};

const BUILT_IN_PRESETS: TextPreset[] = [
  {
    id: 'title',
    type: 'title',
    name: 'Title',
    description: 'Large, bold heading',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Montserrat',
      fontSize: 72,
      fontWeight: 800,
      strokeColor: '#000000',
      strokeWidth: 3,
      shadowColor: '#000000',
      shadowBlur: 10,
      shadowOffsetY: 4,
      textTransform: 'uppercase',
      animation: 'zoom',
    },
  },
  {
    id: 'subtitle',
    type: 'subtitle',
    name: 'Subtitle',
    description: 'Secondary heading',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Poppins',
      fontSize: 42,
      fontWeight: 600,
      strokeWidth: 2,
      animation: 'fade',
    },
  },
  {
    id: 'body',
    type: 'body',
    name: 'Body Text',
    description: 'Regular paragraph text',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 400,
      lineHeight: 1.5,
      animation: 'fade',
    },
  },
  {
    id: 'caption',
    type: 'caption',
    name: 'Caption',
    description: 'Small descriptive text',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 500,
      backgroundColor: '#000000',
      backgroundOpacity: 70,
      animation: 'slide-up',
    },
  },
  {
    id: 'lower-third',
    type: 'lower-third',
    name: 'Lower Third',
    description: 'Name/title overlay',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Roboto',
      fontSize: 28,
      fontWeight: 700,
      backgroundColor: '#3b82f6',
      backgroundOpacity: 90,
      letterSpacing: 1,
      textTransform: 'uppercase',
      animation: 'slide-up',
    },
  },
  {
    id: 'highlight',
    type: 'highlight',
    name: 'Highlight',
    description: 'Emphasized text with glow',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Montserrat',
      fontSize: 48,
      fontWeight: 800,
      color: '#fbbf24',
      strokeColor: '#000000',
      strokeWidth: 2,
      shadowColor: '#fbbf24',
      shadowBlur: 20,
      textTransform: 'uppercase',
      animation: 'glow',
    },
  },
  {
    id: 'content-block',
    type: 'content-block',
    name: 'Content Block',
    description: 'Multi-line content area',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 400,
      backgroundColor: '#000000',
      backgroundOpacity: 60,
      lineHeight: 1.6,
      animation: 'fade',
    },
  },
  {
    id: 'tiktok-style',
    type: 'custom',
    name: 'TikTok Style',
    description: 'Bold word-by-word caption',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Montserrat',
      fontSize: 36,
      fontWeight: 900,
      strokeColor: '#000000',
      strokeWidth: 4,
      textTransform: 'uppercase',
      animation: 'bounce',
    },
  },
  {
    id: 'neon',
    type: 'custom',
    name: 'Neon Glow',
    description: 'Glowing neon effect',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Orbitron',
      fontSize: 48,
      fontWeight: 700,
      color: '#00ffff',
      shadowColor: '#00ffff',
      shadowBlur: 30,
      animation: 'glow',
    },
  },
  {
    id: 'cinematic',
    type: 'custom',
    name: 'Cinematic',
    description: 'Movie-style subtitles',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Playfair Display',
      fontSize: 32,
      fontWeight: 400,
      letterSpacing: 2,
      textTransform: 'uppercase',
      animation: 'fade',
      animationDuration: 800,
    },
  },
  {
    id: 'retro',
    type: 'custom',
    name: 'Retro',
    description: '80s style text',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'Press Start 2P',
      fontSize: 24,
      fontWeight: 400,
      color: '#ff00ff',
      strokeColor: '#00ffff',
      strokeWidth: 2,
      shadowColor: '#ff00ff',
      shadowBlur: 15,
      shadowOffsetY: 4,
      animation: 'typewriter',
    },
  },
  {
    id: 'minimal',
    type: 'custom',
    name: 'Minimal',
    description: 'Clean, simple text',
    style: {
      ...DEFAULT_STYLE,
      fontFamily: 'SF Pro Display',
      fontSize: 28,
      fontWeight: 300,
      letterSpacing: 1,
      animation: 'fade',
    },
  },
];

const PRESET_ICONS: Record<TextPresetType, React.ElementType> = {
  title: Heading1,
  subtitle: Heading2,
  body: Type,
  caption: MessageSquare,
  'lower-third': Layers,
  highlight: Sparkles,
  'content-block': AlignLeft,
  custom: Quote,
};

const ANIMATION_LABELS: Record<string, string> = {
  none: 'None',
  fade: 'Fade In',
  'slide-up': 'Slide Up',
  'slide-down': 'Slide Down',
  zoom: 'Zoom In',
  typewriter: 'Typewriter',
  bounce: 'Bounce',
  glow: 'Glow Pulse',
};

export const TextPresets = ({
  onSelectPreset,
  onSaveCustomPreset,
  customPresets = [],
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [customStyle, setCustomStyle] = useState<TextStyle>(DEFAULT_STYLE);
  const [customName, setCustomName] = useState('');
  const [filter, setFilter] = useState<'all' | 'built-in' | 'custom'>('all');

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];
  const filteredPresets = filter === 'all' 
    ? allPresets 
    : filter === 'built-in' 
      ? BUILT_IN_PRESETS 
      : customPresets;

  const handlePresetSelect = useCallback((preset: TextPreset) => {
    setSelectedPresetId(preset.id);
    onSelectPreset(preset);
  }, [onSelectPreset]);

  const handleSaveCustom = useCallback(() => {
    if (!customName.trim() || !onSaveCustomPreset) return;
    
    const newPreset: TextPreset = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      name: customName,
      description: 'Custom preset',
      style: customStyle,
      isCustom: true,
    };
    
    onSaveCustomPreset(newPreset);
    setShowCustomEditor(false);
    setCustomName('');
    setCustomStyle(DEFAULT_STYLE);
  }, [customName, customStyle, onSaveCustomPreset]);

  const handleStyleChange = useCallback(<K extends keyof TextStyle>(key: K, value: TextStyle[K]) => {
    setCustomStyle(prev => ({ ...prev, [key]: value }));
  }, []);

  const renderPresetPreview = (preset: TextPreset) => {
    const { style } = preset;
    return (
      <div
        className="text-center truncate px-2"
        style={{
          fontFamily: style.fontFamily,
          fontSize: Math.min(style.fontSize * 0.4, 18),
          fontWeight: style.fontWeight,
          color: style.color,
          textTransform: style.textTransform,
          letterSpacing: style.letterSpacing,
          textShadow: style.shadowBlur > 0 
            ? `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}` 
            : 'none',
          WebkitTextStroke: style.strokeWidth > 0 
            ? `${style.strokeWidth * 0.3}px ${style.strokeColor}` 
            : 'none',
        }}
      >
        {preset.name}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Type size={14} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">Text Presets</h3>
          <p className="text-[10px] text-zinc-500">Ready-to-use text styles</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="flex gap-1 bg-zinc-800/50 rounded-xl p-1">
            {(['all', 'built-in', 'custom'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredPresets.map((preset) => {
              const Icon = PRESET_ICONS[preset.type] || Type;
              const isSelected = selectedPresetId === preset.id;
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`relative p-3 rounded-xl border transition-all text-left group ${
                    isSelected
                      ? 'border-purple-500/50 bg-purple-500/10 ring-2 ring-purple-500/20'
                      : 'border-white/5 bg-zinc-800/30 hover:border-purple-500/30 hover:bg-purple-500/5'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-purple-500/30' : 'bg-zinc-700/50 group-hover:bg-purple-500/20'
                    }`}>
                      <Icon size={12} className={isSelected ? 'text-purple-300' : 'text-zinc-400 group-hover:text-purple-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">{preset.name}</div>
                    </div>
                    {isSelected && (
                      <Check size={12} className="text-purple-400 shrink-0" />
                    )}
                  </div>
                  
                  <div className="h-10 bg-zinc-900/50 rounded-lg flex items-center justify-center overflow-hidden">
                    {renderPresetPreview(preset)}
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[9px] text-zinc-500 truncate">{preset.description}</span>
                    <span className="text-[9px] text-zinc-600 px-1.5 py-0.5 bg-zinc-800 rounded">
                      {ANIMATION_LABELS[preset.style.animation]}
                    </span>
                  </div>
                  
                  {preset.isCustom && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[8px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                        Custom
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {onSaveCustomPreset && (
            <div className="pt-2 border-t border-white/5">
              {!showCustomEditor ? (
                <button
                  onClick={() => setShowCustomEditor(true)}
                  className="w-full py-2.5 bg-zinc-800/50 hover:bg-purple-500/10 text-zinc-400 hover:text-purple-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-white/5 hover:border-purple-500/30"
                  type="button"
                >
                  <Plus size={14} />
                  Create Custom Preset
                </button>
              ) : (
                <div className="space-y-3 p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">New Custom Preset</span>
                    <button
                      onClick={() => setShowCustomEditor(false)}
                      className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Preset name..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500/50 transition-colors"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500">Font Size</span>
                      <input
                        type="number"
                        value={customStyle.fontSize}
                        onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value, 10))}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500">Font Weight</span>
                      <select
                        value={customStyle.fontWeight}
                        onChange={(e) => handleStyleChange('fontWeight', parseInt(e.target.value, 10))}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-purple-500/50"
                      >
                        <option value={300}>Light</option>
                        <option value={400}>Regular</option>
                        <option value={500}>Medium</option>
                        <option value={600}>Semibold</option>
                        <option value={700}>Bold</option>
                        <option value={800}>Extrabold</option>
                        <option value={900}>Black</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500">Text Color</span>
                      <input
                        type="color"
                        value={customStyle.color}
                        onChange={(e) => handleStyleChange('color', e.target.value)}
                        className="w-full h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500">Animation</span>
                      <select
                        value={customStyle.animation}
                        onChange={(e) => handleStyleChange('animation', e.target.value as TextStyle['animation'])}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-purple-500/50"
                      >
                        {Object.entries(ANIMATION_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSaveCustom}
                    disabled={!customName.trim()}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    type="button"
                  >
                    <Save size={12} />
                    Save Preset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


