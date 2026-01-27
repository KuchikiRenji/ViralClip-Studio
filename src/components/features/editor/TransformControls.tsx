import { Move, RotateCw } from 'lucide-react';
import { ClipProperties } from '../../../types';
interface TransformControlsProps {
  properties: ClipProperties;
  onPropertyUpdate: (key: keyof ClipProperties, value: unknown) => void;
}
export const TransformControls = ({
  properties,
  onPropertyUpdate,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase">
        <span>Transform</span>
        <Move size={12} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>Position X</span>
            <span>{properties.positionX || 0}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={properties.positionX || 50} 
            onChange={(e) => onPropertyUpdate('positionX', parseInt(e.target.value, 10))} 
            className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
          />
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>Position Y</span>
            <span>{properties.positionY || 0}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={properties.positionY || 50} 
            onChange={(e) => onPropertyUpdate('positionY', parseInt(e.target.value, 10))} 
            className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
          <span>Scale</span>
          <span>{properties.scale}%</span>
        </div>
        <input 
          type="range" 
          min="10" 
          max="200" 
          value={properties.scale} 
          onChange={(e) => onPropertyUpdate('scale', parseInt(e.target.value, 10))} 
          className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
        />
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
          <span className="flex items-center gap-1"><RotateCw size={10} /> Rotation</span>
          <span>{properties.rotation || 0}°</span>
        </div>
        <input 
          type="range" 
          min="-180" 
          max="180" 
          value={properties.rotation || 0} 
          onChange={(e) => onPropertyUpdate('rotation', parseInt(e.target.value, 10))} 
          className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
        />
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
          <span>Opacity</span>
          <span>{properties.opacity}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={properties.opacity} 
          onChange={(e) => onPropertyUpdate('opacity', parseInt(e.target.value, 10))} 
          className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
        />
      </div>
    </div>
  );
};







