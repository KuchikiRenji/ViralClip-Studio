import { useCallback, useState, useMemo } from 'react';
import { Diamond, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Keyframe, KeyframeProperty, EasingType, Clip } from '../../../types';
interface KeyframeEditorProps {
  clip: Clip;
  currentTime: number;
  onKeyframeAdd: (clipId: string, keyframe: Keyframe) => void;
  onKeyframeUpdate: (clipId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  onKeyframeDelete: (clipId: string, keyframeId: string) => void;
}
const KEYFRAME_PROPERTIES: { id: KeyframeProperty; label: string; min: number; max: number; step: number; unit: string }[] = [
  { id: 'scale', label: 'Scale', min: 0, max: 300, step: 1, unit: '%' },
  { id: 'positionX', label: 'Position X', min: -100, max: 200, step: 1, unit: '%' },
  { id: 'positionY', label: 'Position Y', min: -100, max: 200, step: 1, unit: '%' },
  { id: 'rotation', label: 'Rotation', min: -360, max: 360, step: 1, unit: '°' },
  { id: 'opacity', label: 'Opacity', min: 0, max: 100, step: 1, unit: '%' },
  { id: 'volume', label: 'Volume', min: 0, max: 100, step: 1, unit: '%' },
];
const EASING_OPTIONS: { id: EasingType; label: string }[] = [
  { id: 'linear', label: 'Linear' },
  { id: 'ease-in', label: 'Ease In' },
  { id: 'ease-out', label: 'Ease Out' },
  { id: 'ease-in-out', label: 'Ease In-Out' },
  { id: 'bounce', label: 'Bounce' },
];
export const KeyframeEditor = ({
  clip,
  currentTime,
  onKeyframeAdd,
  onKeyframeUpdate,
  onKeyframeDelete,
}) => {
  const [expandedProperty, setExpandedProperty] = useState<KeyframeProperty | null>(null);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const keyframes = useMemo(() => clip.properties.keyframes ?? [], [clip.properties.keyframes]);
  const getKeyframesForProperty = useCallback((property: KeyframeProperty) => {
    return keyframes.filter(kf => kf.property === property).sort((a, b) => a.time - b.time);
  }, [keyframes]);
  const getCurrentValue = useCallback((property: KeyframeProperty): number => {
    const propKeyframes = getKeyframesForProperty(property);
    if (propKeyframes.length === 0) {
      return clip.properties[property] as number;
    }
    const relativeTime = currentTime - clip.startTime;
    const before = propKeyframes.filter(kf => kf.time <= relativeTime).pop();
    const after = propKeyframes.find(kf => kf.time > relativeTime);
    if (!before) return after?.value ?? (clip.properties[property] as number);
    if (!after) return before.value;
    const progress = (relativeTime - before.time) / (after.time - before.time);
    return before.value + (after.value - before.value) * progress;
  }, [clip, currentTime, getKeyframesForProperty]);
  const handleAddKeyframe = useCallback((property: KeyframeProperty) => {
    const relativeTime = Math.max(0, currentTime - clip.startTime);
    const currentValue = getCurrentValue(property);
    const newKeyframe: Keyframe = {
      id: `kf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      time: relativeTime,
      property,
      value: currentValue,
      easing: 'ease-in-out',
    };
    onKeyframeAdd(clip.id, newKeyframe);
  }, [clip, currentTime, getCurrentValue, onKeyframeAdd]);
  const hasKeyframeAtCurrentTime = useCallback((property: KeyframeProperty): boolean => {
    const relativeTime = currentTime - clip.startTime;
    return getKeyframesForProperty(property).some(kf => Math.abs(kf.time - relativeTime) < 0.1);
  }, [currentTime, clip.startTime, getKeyframesForProperty]);
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
          <Diamond size={14} className="text-yellow-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">Keyframes</h3>
          <p className="text-[10px] text-zinc-500">Animate properties over time</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-2">
          {KEYFRAME_PROPERTIES.map((prop) => {
            const propKeyframes = getKeyframesForProperty(prop.id);
            const isExpanded = expandedProperty === prop.id;
            const hasKeyframe = hasKeyframeAtCurrentTime(prop.id);
            const currentValue = getCurrentValue(prop.id);
            return (
              <div key={prop.id} className="bg-zinc-800/30 rounded-xl border border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedProperty(isExpanded ? null : prop.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      propKeyframes.length > 0 ? 'bg-yellow-500/20' : 'bg-zinc-700/50'
                    }`}>
                      <Diamond size={12} className={propKeyframes.length > 0 ? 'text-yellow-400' : 'text-zinc-500'} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-medium text-white">{prop.label}</div>
                      <div className="text-[10px] text-zinc-500">
                        {currentValue.toFixed(0)}{prop.unit} • {propKeyframes.length} keyframe{propKeyframes.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddKeyframe(prop.id);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        hasKeyframe 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-zinc-700/50 text-zinc-400 hover:bg-yellow-500/20 hover:text-yellow-400'
                      }`}
                      type="button"
                      title={hasKeyframe ? 'Keyframe exists' : 'Add keyframe'}
                    >
                      {hasKeyframe ? <Diamond size={12} fill="currentColor" /> : <Plus size={12} />}
                    </button>
                    <ChevronDown 
                      size={14} 
                      className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Value</span>
                        <span>{currentValue.toFixed(0)}{prop.unit}</span>
                      </div>
                      <input
                        type="range"
                        min={prop.min}
                        max={prop.max}
                        step={prop.step}
                        value={currentValue}
                        onChange={(e) => {
                          const relativeTime = currentTime - clip.startTime;
                          const existingKf = propKeyframes.find(kf => Math.abs(kf.time - relativeTime) < 0.1);
                          if (existingKf) {
                            onKeyframeUpdate(clip.id, existingKf.id, { value: parseFloat(e.target.value) });
                          }
                        }}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg accent-yellow-500 cursor-pointer"
                      />
                    </div>
                    {propKeyframes.length > 0 && (
                      <div className="space-y-1.5 mt-3">
                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Keyframes</span>
                        <div className="space-y-1">
                          {propKeyframes.map((kf) => (
                            <div
                              key={kf.id}
                              onClick={() => setSelectedKeyframeId(kf.id)}
                              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                selectedKeyframeId === kf.id 
                                  ? 'bg-yellow-500/20 border border-yellow-500/50' 
                                  : 'bg-zinc-800/50 border border-transparent hover:border-white/10'
                              }`}
                            >
                              <Diamond size={10} className="text-yellow-400 shrink-0" fill="currentColor" />
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-white font-medium">
                                  {kf.time.toFixed(2)}s
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                  {kf.value.toFixed(0)}{prop.unit} • {kf.easing}
                                </div>
                              </div>
                              <select
                                value={kf.easing}
                                onChange={(e) => onKeyframeUpdate(clip.id, kf.id, { easing: e.target.value as EasingType })}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-zinc-700 border-none rounded px-1.5 py-0.5 text-[10px] text-white outline-none"
                              >
                                {EASING_OPTIONS.map(opt => (
                                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                                ))}
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onKeyframeDelete(clip.id, kf.id);
                                }}
                                className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                type="button"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};