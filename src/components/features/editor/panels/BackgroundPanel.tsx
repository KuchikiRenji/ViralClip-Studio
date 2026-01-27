import { useCallback, useState, useRef, useEffect } from 'react';
import { Palette, Image, Video, X, Upload, Loader2, Check, Sparkles, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { TIMING } from '../../../../constants/timing';
import { BACKGROUND_IMAGES } from '../../../../constants/editorLibrary';
import { EditorPanelState } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { searchStockMedia } from '../../../../services/api/stockMediaService';
import type { StockMediaItem } from '../../../../types/media';
interface BackgroundPanelProps {
  state: EditorPanelState;
  onStateChange: (updates: Partial<EditorPanelState>) => void;
  onBackgroundChange: (url: string, type: 'image' | 'video' | 'color' | 'gradient') => void;
}
const SOLID_COLORS = [
  '#000000', '#1a1a1a', '#2d2d2d', '#404040', '#525252', '#737373',
  '#ffffff', '#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];
const GRADIENTS = [
  { id: 'sunset', colors: ['#f43f5e', '#f97316'], label: 'Sunset' },
  { id: 'ocean', colors: ['#06b6d4', '#3b82f6'], label: 'Ocean' },
  { id: 'forest', colors: ['#22c55e', '#14b8a6'], label: 'Forest' },
  { id: 'purple', colors: ['#8b5cf6', '#ec4899'], label: 'Purple' },
  { id: 'dark', colors: ['#1a1a1a', '#404040'], label: 'Dark' },
  { id: 'neon', colors: ['#00ff87', '#60efff'], label: 'Neon' },
];
type BackgroundTab = 'color' | 'gradient' | 'image' | 'video';
import type { LucideIcon } from 'lucide-react';
const TAB_CONFIG: { id: BackgroundTab; icon: LucideIcon; labelKey: string }[] = [
  { id: 'color', icon: Palette, labelKey: 'bgPanel.tab.color' },
  { id: 'gradient', icon: Sparkles, labelKey: 'bgPanel.tab.gradient' },
  { id: 'image', icon: Image, labelKey: 'bgPanel.tab.image' },
  { id: 'video', icon: Video, labelKey: 'bgPanel.tab.video' },
];
export const BackgroundPanel = ({
  state,
  onStateChange,
  onBackgroundChange,
}) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<BackgroundTab>('color');
  const [customColor, setCustomColor] = useState('#3b82f6');
  const [isUploading, setIsUploading] = useState(false);
  const [stockImages, setStockImages] = useState<StockMediaItem[]>([]);
  const [stockVideos, setStockVideos] = useState<StockMediaItem[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab === 'image' && stockImages.length === 0 && !isLoadingImages) {
      setIsLoadingImages(true);
      setImageError(null);
      searchStockMedia({ type: 'image', query: 'abstract background', per_page: 12 })
        .then((response) => {
          setStockImages(response.results);
          setIsLoadingImages(false);
        })
        .catch((err) => {
          setImageError(err.message || 'Failed to load images');
          setIsLoadingImages(false);
        });
    }
  }, [tab, stockImages.length, isLoadingImages]);

  useEffect(() => {
    if (tab === 'video' && stockVideos.length === 0 && !isLoadingVideos) {
      setIsLoadingVideos(true);
      setVideoError(null);
      searchStockMedia({ type: 'video', query: 'abstract background', per_page: 12 })
        .then((response) => {
          setStockVideos(response.results);
          setIsLoadingVideos(false);
        })
        .catch((err) => {
          setVideoError(err.message || 'Failed to load videos');
          setIsLoadingVideos(false);
        });
    }
  }, [tab, stockVideos.length, isLoadingVideos]);

  const handleRetryImages = useCallback(() => {
    setStockImages([]);
    setIsLoadingImages(false);
    setImageError(null);
  }, []);

  const handleRetryVideos = useCallback(() => {
    setStockVideos([]);
    setIsLoadingVideos(false);
    setVideoError(null);
  }, []);
  const handleColorSelect = useCallback((color: string) => {
    setCustomColor(color);
    onStateChange({ selectedBackground: color });
    onBackgroundChange(color, 'color');
  }, [onStateChange, onBackgroundChange]);
  const handleApplyCustomColor = useCallback(() => {
    onStateChange({ selectedBackground: customColor });
    onBackgroundChange(customColor, 'color');
  }, [customColor, onStateChange, onBackgroundChange]);
  const handleGradientSelect = useCallback((gradient: typeof GRADIENTS[0]) => {
    const gradientCss = `linear-gradient(135deg, ${gradient.colors.join(', ')})`;
    onStateChange({ selectedBackground: gradientCss });
    onBackgroundChange(gradientCss, 'gradient');
  }, [onStateChange, onBackgroundChange]);
  const handleImageSelect = useCallback((url: string) => {
    onStateChange({ selectedBackground: url });
    onBackgroundChange(url, 'image');
  }, [onStateChange, onBackgroundChange]);

  const handleVideoSelect = useCallback((url: string) => {
    onStateChange({ selectedBackground: url });
    onBackgroundChange(url, 'video');
  }, [onStateChange, onBackgroundChange]);
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    await new Promise(resolve => setTimeout(resolve, TIMING.DELAY_MS.SHORT));
    onStateChange({ selectedBackground: url });
    onBackgroundChange(url, type);
    setIsUploading(false);
    e.target.value = '';
  }, [onStateChange, onBackgroundChange]);
  const handleClearBackground = useCallback(() => {
    onStateChange({ selectedBackground: undefined });
    onBackgroundChange('', 'color');
  }, [onStateChange, onBackgroundChange]);
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Palette size={14} className="text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">{t('bgPanel.title')}</h3>
          <p className="text-[10px] text-zinc-500">{t('bgPanel.subtitle')}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="grid grid-cols-4 gap-1 bg-zinc-800/50 rounded-xl p-1">
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
          {tab === 'color' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('bgPanel.customColor')}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="flex-1 min-w-0 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:border-blue-500/50 outline-none transition-colors"
                    placeholder="#000000"
                  />
                </div>
                <button
                  onClick={handleApplyCustomColor}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <Check size={12} />
                  {t('bgPanel.applyColor')}
                </button>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('bgPanel.presetColors')}</span>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                  {SOLID_COLORS.map((color) => {
                    const isSelected = state.selectedBackground === color;
                    return (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110' 
                            : 'border-transparent hover:border-white/30'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                        type="button"
                      >
                        {isSelected && (
                          <Check size={10} className="mx-auto text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {tab === 'gradient' && (
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('bgPanel.presetGradients')}</span>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENTS.map((gradient) => {
                  const isSelected = state.selectedBackground?.includes(gradient.colors[0]);
                  return (
                    <button
                      key={gradient.id}
                      onClick={() => handleGradientSelect(gradient)}
                      className={`h-20 sm:h-16 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-95 relative overflow-hidden touch-target ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-white/5 hover:border-white/20'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${gradient.colors.join(', ')})`,
                      }}
                      type="button"
                    >
                      <span className="absolute bottom-2 left-2 text-[10px] text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {gradient.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tab === 'image' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 size={20} className="text-blue-500 animate-spin" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                      <Upload size={18} className="text-zinc-500 group-hover:text-blue-400" />
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-blue-400 font-medium">
                      {t('bgPanel.uploadImage')}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-0.5">
                      {t('bgPanel.imageFormats')}
                    </span>
                  </>
                )}
              </label>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('bgPanel.stockBackgrounds')}</span>
                {isLoadingImages ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-video rounded-xl bg-zinc-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : imageError ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 bg-zinc-800/30 rounded-xl border border-red-500/20">
                    <AlertCircle size={20} className="text-red-400 mb-2" />
                    <p className="text-xs text-red-400 mb-3 text-center">{imageError}</p>
                    <button
                      onClick={handleRetryImages}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
                      type="button"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  </div>
                ) : stockImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {stockImages.map((img) => {
                      const isSelected = state.selectedBackground === img.src;
                      return (
                        <button
                          key={img.id}
                          onClick={() => handleImageSelect(img.src)}
                          className={`aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] relative ${
                            isSelected
                              ? 'border-blue-500 ring-2 ring-blue-500/30'
                              : 'border-white/5 hover:border-white/20'
                          }`}
                          type="button"
                        >
                          <img
                            src={img.thumbnail}
                            alt={img.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={320}
                            height={180}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-1.5 left-2 text-[10px] text-white font-medium truncate max-w-[calc(100%-2rem)]">
                            {img.title}
                          </span>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {tab === 'video' && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 size={20} className="text-blue-500 animate-spin" />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                      <Video size={18} className="text-zinc-500 group-hover:text-blue-400" />
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-blue-400 font-medium">
                      {t('bgPanel.uploadVideo')}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-0.5">
                      {t('bgPanel.videoFormats')}
                    </span>
                  </>
                )}
              </label>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('bgPanel.stockBackgrounds')}</span>
                {isLoadingVideos ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-video rounded-xl bg-zinc-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : videoError ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 bg-zinc-800/30 rounded-xl border border-red-500/20">
                    <AlertCircle size={20} className="text-red-400 mb-2" />
                    <p className="text-xs text-red-400 mb-3 text-center">{videoError}</p>
                    <button
                      onClick={handleRetryVideos}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-white transition-colors"
                      type="button"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                  </div>
                ) : stockVideos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {stockVideos.map((video) => {
                      const isSelected = state.selectedBackground === video.src;
                      return (
                        <button
                          key={video.id}
                          onClick={() => handleVideoSelect(video.src)}
                          className={`aspect-video rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02] relative ${
                            isSelected
                              ? 'border-blue-500 ring-2 ring-blue-500/30'
                              : 'border-white/5 hover:border-white/20'
                          }`}
                          type="button"
                        >
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={320}
                            height={180}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                            <Play size={12} className="text-white ml-0.5" fill="white" />
                          </div>
                          {video.duration && (
                            <div className="absolute bottom-8 right-2 bg-black/60 rounded px-1.5 py-0.5 text-[9px] text-white">
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                          <span className="absolute bottom-1.5 left-2 text-[10px] text-white font-medium truncate max-w-[calc(100%-2rem)]">
                            {video.title}
                          </span>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="flex items-start gap-2">
                  <Video size={14} className="text-zinc-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {t('bgPanel.videoHint')}
                  </p>
                </div>
              </div>
            </div>
          )}
          {state.selectedBackground && (
            <button
              onClick={handleClearBackground}
              className="w-full py-2.5 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/5 hover:border-red-500/30"
              type="button"
            >
              <X size={14} />
              {t('bgPanel.clearBackground')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};