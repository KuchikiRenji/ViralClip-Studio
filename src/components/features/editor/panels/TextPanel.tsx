import { useCallback, useState } from 'react';
import { Type, Plus, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Check } from 'lucide-react';
import { EditorPanelState, TextLayerState } from './types';
import { FONTS } from '../../../../constants';
import { useTranslation } from '../../../../hooks/useTranslation';
interface TextPanelProps {
  state: EditorPanelState;
  onStateChange: (updates: Partial<EditorPanelState>) => void;
  onAddTextLayer?: (layer: TextLayerState) => void;
}
const TEXT_PRESETS = [
  { id: 'title', labelKey: 'textPanel.preset.title', fontSize: 64, fontWeight: 'bold' },
  { id: 'subtitle', labelKey: 'textPanel.preset.subtitle', fontSize: 32, fontWeight: 'medium' },
  { id: 'body', labelKey: 'textPanel.preset.body', fontSize: 18, fontWeight: 'normal' },
  { id: 'caption', labelKey: 'textPanel.preset.caption', fontSize: 14, fontWeight: 'normal' },
];
const FONT_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];
export const TextPanel = ({
  state,
  onStateChange,
  onAddTextLayer,
}) => {
  const { t } = useTranslation();
  const [textContent, setTextContent] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(32);
  const [fontColor, setFontColor] = useState('#ffffff');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const handleAddText = useCallback(() => {
    if (!textContent.trim() || !onAddTextLayer) return;
    const newLayer: TextLayerState = {
      id: `text-${Date.now()}`,
      text: textContent,
      content: textContent,
      font: selectedFont,
      fontFamily: selectedFont,
      size: fontSize,
      fontSize,
      color: fontColor,
      alignment,
      animation: 'none',
      presetId: '',
      bold: isBold,
      italic: isItalic,
      underline: isUnderline,
      positionX: 50,
      positionY: 50,
    };
    onAddTextLayer(newLayer);
    setTextContent('');
  }, [textContent, selectedFont, fontSize, fontColor, alignment, isBold, isItalic, isUnderline, onAddTextLayer]);
  const handlePresetSelect = useCallback((preset: typeof TEXT_PRESETS[0]) => {
    setFontSize(preset.fontSize);
    setIsBold(preset.fontWeight === 'bold');
  }, []);
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Type size={14} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">{t('textPanel.title')}</h3>
          <p className="text-[10px] text-zinc-500">{t('textPanel.subtitle')}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('textPanel.presets')}</span>
            <div className="grid grid-cols-2 gap-1.5">
              {TEXT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="py-2.5 px-3 bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 hover:border-white/10 rounded-xl text-xs text-white transition-all text-left group"
                  type="button"
                >
                  <span className="block font-medium truncate group-hover:text-blue-400 transition-colors">{t(preset.labelKey)}</span>
                  <span className="text-[9px] text-zinc-500">{preset.fontSize}px</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('textPanel.content')}</span>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={t('textPanel.contentPlaceholder')}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-zinc-600 resize-none outline-none focus:border-blue-500/50 transition-colors"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('textPanel.font')}</span>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-colors"
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('textPanel.size')}</span>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                min={8}
                max={200}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('textPanel.color')}</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fontColor}
                onChange={(e) => setFontColor(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent shrink-0"
              />
              <div className="flex gap-1.5 flex-wrap flex-1">
                {FONT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFontColor(color)}
                    className={`w-6 h-6 rounded-lg border-2 transition-all hover:scale-110 ${
                      fontColor === color 
                        ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110' 
                        : 'border-transparent hover:border-white/30'
                    }`}
                    style={{ backgroundColor: color }}
                    type="button"
                  >
                    {fontColor === color && (
                      <Check size={10} className="mx-auto text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('textPanel.style')}</span>
            <div className="flex gap-1 bg-zinc-800/30 p-1 rounded-xl">
              <button
                onClick={() => setAlignment('left')}
                className={`p-2 rounded-lg transition-all ${
                  alignment === 'left' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                title={t('textPanel.alignLeft')}
              >
                <AlignLeft size={14} />
              </button>
              <button
                onClick={() => setAlignment('center')}
                className={`p-2 rounded-lg transition-all ${
                  alignment === 'center' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                title={t('textPanel.alignCenter')}
              >
                <AlignCenter size={14} />
              </button>
              <button
                onClick={() => setAlignment('right')}
                className={`p-2 rounded-lg transition-all ${
                  alignment === 'right' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                title={t('textPanel.alignRight')}
              >
                <AlignRight size={14} />
              </button>
              <div className="w-px bg-zinc-700 mx-1" />
              <button
                onClick={() => setIsBold(!isBold)}
                className={`p-2 rounded-lg transition-all ${
                  isBold ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                title={t('textPanel.bold')}
              >
                <Bold size={14} />
              </button>
              <button
                onClick={() => setIsItalic(!isItalic)}
                className={`p-2 rounded-lg transition-all ${
                  isItalic ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                title={t('textPanel.italic')}
              >
                <Italic size={14} />
              </button>
              <button
                onClick={() => setIsUnderline(!isUnderline)}
                className={`p-2 rounded-lg transition-all ${
                  isUnderline ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                title={t('textPanel.underline')}
              >
                <Underline size={14} />
              </button>
            </div>
          </div>
          {textContent && (
            <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block mb-2">{t('textPanel.preview')}</span>
              <div
                className="p-3 rounded-lg bg-zinc-900/50 min-h-[48px] flex items-center overflow-hidden"
                style={{ justifyContent: alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center' }}
              >
                <span
                  className="break-words max-w-full"
                  style={{
                    fontFamily: selectedFont,
                    fontSize: Math.min(fontSize, 24),
                    color: fontColor,
                    fontWeight: isBold ? 'bold' : 'normal',
                    fontStyle: isItalic ? 'italic' : 'normal',
                    textDecoration: isUnderline ? 'underline' : 'none',
                    textAlign: alignment,
                  }}
                >
                  {textContent}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleAddText}
            disabled={!textContent.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 disabled:shadow-none"
            type="button"
          >
            <Plus size={16} />
            {t('textPanel.addToCanvas')}
          </button>
        </div>
      </div>
    </div>
  );
};