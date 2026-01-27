import { Move } from 'lucide-react';
import { Toggle } from '../../shared/Toggle';
import { SubtitlePreview } from './SubtitlePreview';
import type { SubtitleTemplate, SubtitlePosition, SubtitleCustomPosition } from './types';
import { FONT_OPTIONS, FONT_SIZE_MIN, FONT_SIZE_MAX, STROKE_SIZE_MIN, STROKE_SIZE_MAX } from './constants';
import { useTranslation } from '../../../hooks/useTranslation';
import { useMemo } from 'react';

// Helper to resolve CSS variables to actual values
const resolveCSSVar = (value: string): string => {
  if (typeof window === 'undefined') return value;
  const root = getComputedStyle(document.documentElement);
  const match = value.match(/var\((--[^)]+)\)/);
  if (!match) return value;
  const resolved = root.getPropertyValue(match[1]).trim();
  return resolved || value;
};

// Helper to resolve color-mix functions
const resolveColorMix = (value: string): string => {
  if (!value.includes('color-mix')) return value;
  
  const match = value.match(/color-mix\(in\s+srgb,\s*var\((--[^)]+)\)\s+(\d+)%,\s*transparent\)/);
  if (match) {
    const [, varName, percentage] = match;
    const baseColor = resolveCSSVar(`var(${varName})`);
    
    if (baseColor.startsWith('#')) {
      const hex = baseColor.replace('#', '');
      let r: number, g: number, b: number;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      const opacity = parseInt(percentage) / 100;
      const finalOpacity = Math.max(0.7, Math.min(1, opacity));
      return `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
    }
    
    const rgbaMatch = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const [, r, g, b, a = '1'] = rgbaMatch;
      const opacity = (parseInt(percentage) / 100) * parseFloat(a);
      const finalOpacity = Math.max(0.7, Math.min(1, opacity));
      return `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
    }
  }
  
  return 'rgba(0, 0, 0, 0.7)';
};

// Main color resolver
const resolveColor = (value: string): string => {
  if (!value || value === 'transparent') return 'transparent';
  if (value.includes('color-mix')) return resolveColorMix(value);
  if (value.startsWith('var(')) return resolveCSSVar(value);
  return value;
};

// Convert any color format to hex for color input
const colorToHex = (color: string): string => {
  if (!color || color === 'transparent') return '#000000';
  
  // Skip gradient and split colors (they're special and don't need hex conversion)
  if (color === 'gradient' || color === 'split') return '#ffffff';
  
  try {
    // Resolve CSS variables and color-mix first
    const resolved = resolveColor(color);
    
    // If still contains var() or color-mix, try to get computed value from a test element
    if (resolved.includes('var(') || resolved.includes('color-mix')) {
      // Create a temporary element to get computed color
      if (typeof window !== 'undefined') {
        const testEl = document.createElement('div');
        testEl.style.color = color;
        testEl.style.position = 'absolute';
        testEl.style.visibility = 'hidden';
        document.body.appendChild(testEl);
        const computed = window.getComputedStyle(testEl).color;
        document.body.removeChild(testEl);
        
        // Parse rgb/rgba from computed style
        const rgbMatch = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch;
          const toHex = (n: string) => {
            const num = parseInt(n, 10);
            return num.toString(16).padStart(2, '0');
          };
          return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }
      }
    }
    
    // If already hex, return it
    if (resolved.startsWith('#')) {
      // Ensure it's 6-digit hex
      const hex = resolved.replace('#', '');
      if (hex.length === 3) {
        return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
      }
      if (hex.length === 6) {
        return `#${hex}`;
      }
      return '#000000';
    }
    
    // Convert rgba to hex
    const rgbaMatch = resolved.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const [, r, g, b] = rgbaMatch;
      const toHex = (n: string) => {
        const num = parseInt(n, 10);
        return num.toString(16).padStart(2, '0');
      };
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  } catch (e) {
    // If anything fails, return a default
    console.warn('Failed to convert color to hex:', color, e);
  }
  
  // Fallback
  return '#000000';
};

interface SubtitleTabProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  templates: SubtitleTemplate[];
  selectedTemplate: string;
  onTemplateSelect: (id: string) => void;
  enableDrag: boolean;
  onDragChange: (enabled: boolean) => void;
  position: SubtitlePosition;
  onPositionChange: (position: SubtitlePosition) => void;
  customPosition: SubtitleCustomPosition;
  onCustomPositionChange: (position: SubtitleCustomPosition) => void;
  font: string;
  onFontChange: (font: string) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  strokeSize: number;
  onStrokeSizeChange: (size: number) => void;
  strokeColor: string;
  onStrokeColorChange: (color: string) => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
}
export const SubtitleTab = ({
  enabled,
  onEnabledChange,
  templates,
  selectedTemplate,
  onTemplateSelect,
  enableDrag,
  onDragChange,
  position,
  onPositionChange,
  customPosition,
  onCustomPositionChange,
  font,
  onFontChange,
  color,
  onColorChange,
  size,
  onSizeChange,
  strokeSize,
  onStrokeSizeChange,
  strokeColor,
  onStrokeColorChange,
  bgColor,
  onBgColorChange,
}: SubtitleTabProps) => {
  const { t } = useTranslation();
  
  // Resolve colors to hex for color inputs (they require hex format)
  const colorHex = useMemo(() => colorToHex(color), [color]);
  const strokeColorHex = useMemo(() => colorToHex(strokeColor), [strokeColor]);
  const bgColorHex = useMemo(() => {
    if (bgColor === 'transparent') return '#000000';
    return colorToHex(bgColor);
  }, [bgColor]);
  
  return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-white">{t('splitscreen.subtitles')}</h2>
      <Toggle enabled={enabled} onChange={onEnabledChange} />
    </div>
    {enabled && (
      <>
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">{t('splitscreen.subtitleTemplate')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onTemplateSelect(template.id)}
                className={`h-16 rounded-lg border-2 flex items-center justify-center transition-all bg-zinc-900/80 ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
                type="button"
              >
                <SubtitlePreview template={template} />
              </button>
            ))}
          </div>
          <button className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium" type="button">
            {t('splitscreen.loadMore')}
          </button>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-400">{t('splitscreen.subtitleSettings')}</h3>
          <Toggle label={t('splitscreen.enableDrag')} enabled={enableDrag} onChange={onDragChange} />
          
          <div className="space-y-3">
            <span className="text-sm text-zinc-400 block">{t('splitscreen.subtitlePosition')}</span>
            <div className="grid grid-cols-4 gap-2">
              {(['top', 'center', 'bottom', 'custom'] as SubtitlePosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onPositionChange(pos)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    position === pos
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                  }`}
                  type="button"
                >
                  {pos === 'custom' ? (
                    <span className="flex items-center justify-center gap-1">
                      <Move size={14} />
                      {t('splitscreen.positionCustom')}
                    </span>
                  ) : (
                    t(`splitscreen.position${pos.charAt(0).toUpperCase() + pos.slice(1)}`)
                  )}
                </button>
              ))}
            </div>
          </div>

          {position === 'custom' && (
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-4 border border-zinc-700">
              <p className="text-xs text-zinc-500">{t('splitscreen.customPositionHint')}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t('splitscreen.horizontalPosition')}</span>
                <div className="flex items-center gap-3 min-w-[200px]">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={customPosition.x}
                    onChange={(e) => onCustomPositionChange({ ...customPosition, x: parseInt(e.target.value, 10) })}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-white text-sm w-12 text-right">{customPosition.x}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t('splitscreen.verticalPosition')}</span>
                <div className="flex items-center gap-3 min-w-[200px]">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={customPosition.y}
                    onChange={(e) => onCustomPositionChange({ ...customPosition, y: parseInt(e.target.value, 10) })}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-white text-sm w-12 text-right">{customPosition.y}%</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('splitscreen.font')}</span>
            <div className="flex items-center gap-2">
              <select
                value={font}
                onChange={(e) => onFontChange(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 min-w-[180px]"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button 
                className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center text-white font-bold hover:bg-zinc-700 transition-colors"
                type="button"
              >
                B
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('splitscreen.fontColor')}</span>
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 min-w-[200px]">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="bg-transparent text-white text-sm flex-1 focus:outline-none uppercase"
                placeholder="#ffffff"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('splitscreen.fontSize')}</span>
            <div className="flex items-center gap-3 min-w-[200px]">
              <input
                type="range"
                min={FONT_SIZE_MIN}
                max={FONT_SIZE_MAX}
                value={size}
                onChange={(e) => onSizeChange(parseInt(e.target.value, 10))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-white text-sm w-12 text-right">{size} px</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('splitscreen.strokeSize')}</span>
            <div className="flex items-center gap-3 min-w-[200px]">
              <input
                type="range"
                min={STROKE_SIZE_MIN}
                max={STROKE_SIZE_MAX}
                value={strokeSize}
                onChange={(e) => onStrokeSizeChange(parseInt(e.target.value, 10))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-white text-sm w-12 text-right">{strokeSize} px</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('splitscreen.strokeColor')}</span>
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 min-w-[200px]">
              <input
                type="color"
                value={strokeColorHex}
                onChange={(e) => onStrokeColorChange(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <input
                type="text"
                value={strokeColor}
                onChange={(e) => onStrokeColorChange(e.target.value)}
                className="bg-transparent text-white text-sm flex-1 focus:outline-none uppercase"
                placeholder="#000000"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{t('splitscreen.bgColor')}</span>
            <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 min-w-[200px]">
              <input
                type="color"
                value={bgColorHex}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => onBgColorChange(e.target.value)}
                className="bg-transparent text-white text-sm flex-1 focus:outline-none"
                placeholder="transparent"
              />
            </div>
          </div>
        </div>
      </>
    )}
  </div>
  );
};