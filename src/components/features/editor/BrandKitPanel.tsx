import { useState, useCallback, useRef } from 'react';
import { Palette, Type, Image, Upload, Check, Trash2, Plus, Save, Loader2 } from 'lucide-react';
import { BrandKit } from '../../../types';
import { FONTS } from '../../../constants';
interface BrandKitPanelProps {
  brandKit: BrandKit | null;
  onBrandKitChange: (brandKit: BrandKit) => void;
  onApplyToProject: () => void;
}
const DEFAULT_BRAND_KIT: BrandKit = {
  id: 'default',
  name: 'My Brand',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#f59e0b',
  fontFamily: 'Inter',
  headingFont: 'Montserrat',
  watermarkOpacity: 50,
  watermarkPosition: 'bottom-right',
};
const PRESET_PALETTES = [
  { name: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#14b8a6'] },
  { name: 'Sunset', colors: ['#f97316', '#ef4444', '#ec4899'] },
  { name: 'Forest', colors: ['#22c55e', '#16a34a', '#15803d'] },
  { name: 'Royal', colors: ['#8b5cf6', '#7c3aed', '#6d28d9'] },
  { name: 'Monochrome', colors: ['#18181b', '#3f3f46', '#71717a'] },
  { name: 'Pastel', colors: ['#fda4af', '#c4b5fd', '#a5f3fc'] },
];
const WATERMARK_POSITIONS = [
  { id: 'top-left' as const, label: 'Top Left' },
  { id: 'top-right' as const, label: 'Top Right' },
  { id: 'bottom-left' as const, label: 'Bottom Left' },
  { id: 'bottom-right' as const, label: 'Bottom Right' },
];
export const BrandKitPanel = ({
  brandKit,
  onBrandKitChange,
  onApplyToProject,
}) => {
  const [currentKit, setCurrentKit] = useState<BrandKit>(brandKit ?? DEFAULT_BRAND_KIT);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'assets'>('colors');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const handleColorChange = useCallback((key: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    setCurrentKit(prev => ({ ...prev, [key]: value }));
  }, []);
  const handleFontChange = useCallback((key: 'fontFamily' | 'headingFont', value: string) => {
    setCurrentKit(prev => ({ ...prev, [key]: value }));
  }, []);
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentKit(prev => ({ ...prev, logoUrl: url }));
    }
    e.target.value = '';
  }, []);
  const handleWatermarkUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentKit(prev => ({ ...prev, watermarkUrl: url }));
    }
    e.target.value = '';
  }, []);
  const handleApplyPalette = useCallback((colors: string[]) => {
    setCurrentKit(prev => ({
      ...prev,
      primaryColor: colors[0],
      secondaryColor: colors[1],
      accentColor: colors[2],
    }));
  }, []);
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    onBrandKitChange(currentKit);
    setIsSaving(false);
  }, [currentKit, onBrandKitChange]);
  const handleRemoveLogo = useCallback(() => {
    if (currentKit.logoUrl) {
      URL.revokeObjectURL(currentKit.logoUrl);
    }
    setCurrentKit(prev => ({ ...prev, logoUrl: undefined }));
  }, [currentKit.logoUrl]);
  const handleRemoveWatermark = useCallback(() => {
    if (currentKit.watermarkUrl) {
      URL.revokeObjectURL(currentKit.watermarkUrl);
    }
    setCurrentKit(prev => ({ ...prev, watermarkUrl: undefined }));
  }, [currentKit.watermarkUrl]);
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center">
          <Palette size={14} className="text-pink-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">Brand Kit</h3>
          <p className="text-[10px] text-zinc-500">Colors, fonts & assets</p>
        </div>
      </div>
      <div className="flex border-b border-white/5">
        {[
          { id: 'colors' as const, label: 'Colors', icon: Palette },
          { id: 'fonts' as const, label: 'Fonts', icon: Type },
          { id: 'assets' as const, label: 'Assets', icon: Image },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-pink-500 bg-pink-500/5'
                  : 'text-zinc-500 hover:text-white border-b-2 border-transparent'
              }`}
              type="button"
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Brand Name</label>
            <input
              type="text"
              value={currentKit.name}
              onChange={(e) => setCurrentKit(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-pink-500/50 transition-colors"
              placeholder="Your Brand Name"
            />
          </div>
          {activeTab === 'colors' && (
            <>
              <div className="space-y-3">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Brand Colors</span>
                {[
                  { key: 'primaryColor' as const, label: 'Primary', color: currentKit.primaryColor },
                  { key: 'secondaryColor' as const, label: 'Secondary', color: currentKit.secondaryColor },
                  { key: 'accentColor' as const, label: 'Accent', color: currentKit.accentColor },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={item.color}
                      onChange={(e) => handleColorChange(item.key, e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent"
                    />
                    <div className="flex-1">
                      <div className="text-xs text-white font-medium">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.color.toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Preset Palettes</span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      onClick={() => handleApplyPalette(palette.colors)}
                      className="p-2.5 bg-zinc-800/50 rounded-xl border border-white/5 hover:border-pink-500/30 transition-colors group"
                      type="button"
                    >
                      <div className="flex gap-1 mb-1.5">
                        {palette.colors.map((color, i) => (
                          <div
                            key={i}
                            className="flex-1 h-6 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-white transition-colors">
                        {palette.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 mb-2">Preview</div>
                <div className="flex gap-2">
                  <div
                    className="flex-1 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: currentKit.primaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="flex-1 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: currentKit.secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div
                    className="flex-1 h-12 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: currentKit.accentColor }}
                  >
                    Accent
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'fonts' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Heading Font</label>
                <select
                  value={currentKit.headingFont}
                  onChange={(e) => handleFontChange('headingFont', e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-pink-500/50 transition-colors"
                >
                  {FONTS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Body Font</label>
                <select
                  value={currentKit.fontFamily}
                  onChange={(e) => handleFontChange('fontFamily', e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-pink-500/50 transition-colors"
                >
                  {FONTS.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
              <div className="p-4 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 mb-3">Font Preview</div>
                <div className="space-y-3">
                  <div>
                    <h4 
                      className="text-lg font-bold text-white"
                      style={{ fontFamily: currentKit.headingFont }}
                    >
                      Heading Text
                    </h4>
                    <p className="text-[10px] text-zinc-500">{currentKit.headingFont}</p>
                  </div>
                  <div>
                    <p 
                      className="text-sm text-zinc-300"
                      style={{ fontFamily: currentKit.fontFamily }}
                    >
                      This is body text that demonstrates how your content will look with the selected font.
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">{currentKit.fontFamily}</p>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'assets' && (
            <>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Logo</span>
                {currentKit.logoUrl ? (
                  <div className="relative">
                    <img
                      src={currentKit.logoUrl}
                      alt="Brand logo"
                      className="w-full h-24 object-contain bg-zinc-800/50 rounded-xl border border-white/10"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-500/5 transition-all group">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Upload size={20} className="text-zinc-500 group-hover:text-pink-400 mb-1" />
                    <span className="text-[11px] text-zinc-500 group-hover:text-pink-400">Upload Logo</span>
                  </label>
                )}
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Watermark</span>
                {currentKit.watermarkUrl ? (
                  <div className="relative">
                    <img
                      src={currentKit.watermarkUrl}
                      alt="Watermark"
                      className="w-full h-20 object-contain bg-zinc-800/50 rounded-xl border border-white/10"
                    />
                    <button
                      onClick={handleRemoveWatermark}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-pink-500 hover:bg-pink-500/5 transition-all group">
                    <input
                      ref={watermarkInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleWatermarkUpload}
                      className="hidden"
                    />
                    <Upload size={16} className="text-zinc-500 group-hover:text-pink-400 mb-1" />
                    <span className="text-[10px] text-zinc-500 group-hover:text-pink-400">Upload Watermark</span>
                  </label>
                )}
              </div>
              {currentKit.watermarkUrl && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Watermark Position</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {WATERMARK_POSITIONS.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => setCurrentKit(prev => ({ ...prev, watermarkPosition: pos.id }))}
                          className={`py-2 px-3 rounded-lg text-[11px] font-medium transition-all ${
                            currentKit.watermarkPosition === pos.id
                              ? 'bg-pink-600 text-white'
                              : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                          }`}
                          type="button"
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span className="font-medium uppercase tracking-wider">Watermark Opacity</span>
                      <span>{currentKit.watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={currentKit.watermarkOpacity}
                      onChange={(e) => setCurrentKit(prev => ({ ...prev, watermarkOpacity: parseInt(e.target.value) }))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-pink-500 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div className="p-3 border-t border-white/5 space-y-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          type="button"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={14} />
              Save Brand Kit
            </>
          )}
        </button>
        <button
          onClick={onApplyToProject}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-medium transition-colors"
          type="button"
        >
          Apply to Current Project
        </button>
      </div>
    </div>
  );
};