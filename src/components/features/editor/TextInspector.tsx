import { Type } from 'lucide-react';
import { FONTS } from '../../../constants';
import { ClipProperties } from '../../../types';
interface TextInspectorProps {
  properties: ClipProperties;
  onPropertyUpdate: (key: keyof ClipProperties, value: unknown) => void;
}
export const TextInspector = ({
  properties,
  onPropertyUpdate,
}) => {
  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase">
        <span>Text</span>
        <Type size={12} />
      </div>
      <textarea
        value={properties.text}
        onChange={(e) => onPropertyUpdate('text', e.target.value)}
        className="w-full bg-zinc-900/80 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none resize-none focus:border-blue-500 transition-colors"
        rows={3}
        placeholder="Enter text..."
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] text-zinc-500 mb-1 block">Font</span>
          <select
            value={properties.fontFamily}
            onChange={(e) => onPropertyUpdate('fontFamily', e.target.value)}
            className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
          >
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 mb-1 block">Size</span>
          <input
            type="number"
            value={properties.fontSize}
            onChange={(e) => onPropertyUpdate('fontSize', parseInt(e.target.value, 10))}
            className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
            min={8}
            max={200}
          />
        </div>
      </div>
      <div>
        <span className="text-[10px] text-zinc-500 mb-1 block">Text Color</span>
        <div className="flex gap-2">
          <input
            type="color"
            value={properties.color || '#ffffff'}
            onChange={(e) => onPropertyUpdate('color', e.target.value)}
            className="w-10 h-8 bg-transparent rounded cursor-pointer border border-white/10"
          />
          <input
            type="text"
            value={properties.color || '#ffffff'}
            onChange={(e) => onPropertyUpdate('color', e.target.value)}
            className="flex-1 bg-zinc-900/80 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase"
          />
        </div>
      </div>
    </div>
  );
};







