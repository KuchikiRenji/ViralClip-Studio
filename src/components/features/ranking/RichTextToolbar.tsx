import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Palette } from 'lucide-react';
interface RichTextToolbarProps {
  format: {
    bold: boolean;
    italic: boolean;
    fontFamily: string;
    fontSize: number;
    color: string;
    alignment: 'left' | 'center' | 'right';
  };
  onFormatChange: (format: Partial<RichTextToolbarProps['format']>) => void;
}
const FONT_FAMILIES = ['Inter', 'Arial', 'Roboto', 'Open Sans', 'Montserrat'];
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
export const RichTextToolbar = ({ format, onFormatChange }: RichTextToolbarProps) => {
  return (
    <div className="flex items-center gap-1 p-2 bg-zinc-900 rounded-lg border border-white/5 overflow-x-auto max-w-full">
      <button
        className="p-1.5 hover:bg-white/10 rounded transition-colors"
        title="Emoji"
      >
        <span className="text-sm">😀</span>
      </button>
      <select
        value={format.fontFamily}
        onChange={(e) => onFormatChange({ fontFamily: e.target.value })}
        className="px-2 py-1 bg-zinc-800 border border-white/5 rounded text-xs text-white focus:outline-none focus:border-blue-500"
      >
        {FONT_FAMILIES.map((font) => (
          <option key={font} value={font}>{font}</option>
        ))}
      </select>
      <button
        onClick={() => onFormatChange({ bold: !format.bold })}
        className={`p-1.5 hover:bg-white/10 rounded transition-colors ${format.bold ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
        title="Bold"
      >
        <Bold size={14} />
      </button>
      <button
        onClick={() => onFormatChange({ italic: !format.italic })}
        className={`p-1.5 hover:bg-white/10 rounded transition-colors ${format.italic ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
        title="Italic"
      >
        <Italic size={14} />
      </button>
      <select
        value={format.fontSize}
        onChange={(e) => onFormatChange({ fontSize: Number(e.target.value) })}
        className="px-2 py-1 bg-zinc-800 border border-white/5 rounded text-xs text-white focus:outline-none focus:border-blue-500"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>{size}px</option>
        ))}
      </select>
      <div className="relative">
        <input
          type="color"
          value={format.color}
          onChange={(e) => onFormatChange({ color: e.target.value })}
          className="w-8 h-8 bg-transparent border border-white/5 rounded cursor-pointer"
          title="Text Color"
        />
        <Palette size={12} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
      </div>
      <button
        className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400"
        title="AI"
      >
        <span className="text-xs font-bold">AI</span>
      </button>
      <div className="flex items-center gap-0.5 border-l border-white/10 pl-1 ml-1">
        <button
          onClick={() => onFormatChange({ alignment: 'left' })}
          className={`p-1.5 hover:bg-white/10 rounded transition-colors ${format.alignment === 'left' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </button>
        <button
          onClick={() => onFormatChange({ alignment: 'center' })}
          className={`p-1.5 hover:bg-white/10 rounded transition-colors ${format.alignment === 'center' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </button>
        <button
          onClick={() => onFormatChange({ alignment: 'right' })}
          className={`p-1.5 hover:bg-white/10 rounded transition-colors ${format.alignment === 'right' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
          title="Align Right"
        >
          <AlignRight size={14} />
        </button>
      </div>
      <div className="flex items-center gap-0.5 border-l border-white/10 pl-1 ml-1">
        <button
          className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400"
          title="Undo"
        >
          <Undo size={14} />
        </button>
        <button
          className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400"
          title="Redo"
        >
          <Redo size={14} />
        </button>
      </div>
    </div>
  );
};







