import { useCallback, ReactNode } from 'react';
import { Settings, Palette, Zap, Volume2, Trash2, MousePointer2, Copy, Scissors, Eye, EyeOff } from 'lucide-react';
import { Clip } from '../../../types';
import { InspectorTab } from './types';
import { TextInspector } from './TextInspector';
import { TransformControls } from './TransformControls';
interface InspectorPanelProps {
  selectedClip: Clip | undefined;
  inspectorTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onClipUpdate: (id: string, updates: Partial<Clip>) => void;
  onPropertyUpdate: (key: keyof ClipProperties, value: unknown) => void;
  onDeleteClip: (id: string) => void;
  onDuplicateClip?: (id: string) => void;
  onSplitClip?: (id: string) => void;
}
const TABS: { id: InspectorTab; label: string; icon: React.ReactNode }[] = [
  { id: 'properties', label: 'Properties', icon: <Settings size={14} /> },
  { id: 'color', label: 'Color', icon: <Palette size={14} /> },
  { id: 'effects', label: 'Effects', icon: <Zap size={14} /> },
  { id: 'audio', label: 'Audio', icon: <Volume2 size={14} /> },
];
const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
];
export const InspectorPanel = ({
  selectedClip,
  inspectorTab,
  onTabChange,
  onClipUpdate,
  onPropertyUpdate,
  onDeleteClip,
  onDuplicateClip,
  onSplitClip,
}) => {
  const handleVisibilityToggle = useCallback(() => {
    if (!selectedClip) return;
    onPropertyUpdate('visible', !(selectedClip.properties.visible ?? true));
  }, [selectedClip, onPropertyUpdate]);
  const isVisible = selectedClip?.properties.visible ?? true;
  return (
    <div className="flex flex-col h-full bg-surface-dark border-l border-white/5 font-sans overflow-hidden">
      <div className="h-11 border-b border-white/5 flex items-center px-1.5 bg-zinc-900/50 shrink-0 gap-0.5 overflow-x-auto custom-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-lg whitespace-nowrap transition-colors touch-target ${
              inspectorTab === t.id 
                ? 'bg-blue-600 text-white' 
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
            type="button"
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4 sm:space-y-5">
        {selectedClip ? (
          <>
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <input
                value={selectedClip.title}
                onChange={(e) => onClipUpdate(selectedClip.id, { title: e.target.value })}
                className="bg-transparent font-bold text-sm text-white truncate flex-1 outline-none border-b border-transparent focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleVisibilityToggle}
                className={`p-1.5 rounded-lg transition-colors ${isVisible ? 'text-white hover:bg-white/10' : 'text-zinc-500 hover:bg-white/10'}`}
                title={isVisible ? 'Hide clip' : 'Show clip'}
                type="button"
              >
                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
            </div>
            <div className="flex gap-1.5">
              {onDuplicateClip && (
                <button
                  onClick={() => onDuplicateClip(selectedClip.id)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-target"
                  type="button"
                >
                  <Copy size={12} /> Duplicate
                </button>
              )}
              {onSplitClip && (
                <button
                  onClick={() => onSplitClip(selectedClip.id)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors touch-target"
                  type="button"
                >
                  <Scissors size={12} /> Split
                </button>
              )}
            </div>
            {inspectorTab === 'properties' && (
              <>
                {selectedClip.type === 'text' && (
                  <TextInspector
                    properties={selectedClip.properties}
                    onPropertyUpdate={onPropertyUpdate}
                  />
                )}
                <TransformControls
                  properties={selectedClip.properties}
                  onPropertyUpdate={onPropertyUpdate}
                />
              </>
            )}
            {inspectorTab === 'color' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase">
                  <span>Color Correction</span>
                  <Palette size={12} />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Brightness</span>
                      <span>{selectedClip.properties.brightness || 100}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={selectedClip.properties.brightness || 100} 
                      onChange={(e) => onPropertyUpdate('brightness', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Contrast</span>
                      <span>{selectedClip.properties.contrast || 100}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={selectedClip.properties.contrast || 100} 
                      onChange={(e) => onPropertyUpdate('contrast', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Saturation</span>
                      <span>{selectedClip.properties.saturation || 100}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      value={selectedClip.properties.saturation || 100} 
                      onChange={(e) => onPropertyUpdate('saturation', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Hue Rotate</span>
                      <span>{selectedClip.properties.hue || 0}°</span>
                    </div>
                    <input 
                      type="range" 
                      min="-180" 
                      max="180" 
                      value={selectedClip.properties.hue || 0} 
                      onChange={(e) => onPropertyUpdate('hue', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 mb-2 block">Blend Mode</span>
                  <select
                    value={selectedClip.properties.blendMode || 'normal'}
                    onChange={(e) => onPropertyUpdate('blendMode', e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-2 py-2 text-xs text-white capitalize"
                  >
                    {BLEND_MODES.map((mode) => (
                      <option key={mode} value={mode} className="capitalize">{mode}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            {inspectorTab === 'effects' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase">
                  <span>Effects</span>
                  <Zap size={12} />
                </div>
                {selectedClip.type === 'video' && (
                  <div className="p-3 bg-zinc-900 rounded-lg border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Green Screen</span>
                      <button
                        onClick={() => onPropertyUpdate('chromaKeyEnabled', !selectedClip.properties.chromaKeyEnabled)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          selectedClip.properties.chromaKeyEnabled ? 'bg-green-500' : 'bg-zinc-700'
                        }`}
                        type="button"
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                          selectedClip.properties.chromaKeyEnabled ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                    {selectedClip.properties.chromaKeyEnabled && (
                      <div className="space-y-2 pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[10px] text-zinc-500 mb-1 block">Key Color</span>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={selectedClip.properties.chromaKeyColor || '#00ff00'}
                              onChange={(e) => onPropertyUpdate('chromaKeyColor', e.target.value)}
                              className="w-10 h-8 bg-transparent rounded cursor-pointer border border-white/10"
                            />
                            <input
                              type="text"
                              value={selectedClip.properties.chromaKeyColor || '#00ff00'}
                              onChange={(e) => onPropertyUpdate('chromaKeyColor', e.target.value)}
                              className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>Tolerance</span>
                            <span>{selectedClip.properties.chromaKeyTolerance || 30}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={selectedClip.properties.chromaKeyTolerance || 30} 
                            onChange={(e) => onPropertyUpdate('chromaKeyTolerance', parseInt(e.target.value, 10))} 
                            className="w-full h-1.5 bg-zinc-700 rounded-lg accent-green-500" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Blur</span>
                      <span>{selectedClip.properties.blur || 0}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="20" 
                      value={selectedClip.properties.blur || 0} 
                      onChange={(e) => onPropertyUpdate('blur', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Shadow</span>
                      <span>{selectedClip.properties.shadow || 0}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="50" 
                      value={selectedClip.properties.shadow || 0} 
                      onChange={(e) => onPropertyUpdate('shadow', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Border Radius</span>
                      <span>{selectedClip.properties.borderRadius || 0}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={selectedClip.properties.borderRadius || 0} 
                      onChange={(e) => onPropertyUpdate('borderRadius', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                </div>
              </div>
            )}
            {inspectorTab === 'audio' && (selectedClip.type === 'video' || selectedClip.type === 'audio') && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase">
                  <span>Audio</span>
                  <Volume2 size={12} />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Volume</span>
                      <span>{selectedClip.properties.volume}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={selectedClip.properties.volume} 
                      onChange={(e) => onPropertyUpdate('volume', parseInt(e.target.value, 10))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Mute</span>
                      <button
                        onClick={() => onPropertyUpdate('muted', !selectedClip.properties.muted)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          selectedClip.properties.muted ? 'bg-red-500' : 'bg-zinc-700'
                        }`}
                        type="button"
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                          selectedClip.properties.muted ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-900 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Noise Reduction</span>
                      <button
                        onClick={() => onPropertyUpdate('noiseReduction', !selectedClip.properties.noiseReduction)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          selectedClip.properties.noiseReduction ? 'bg-blue-500' : 'bg-zinc-700'
                        }`}
                        type="button"
                      >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                          selectedClip.properties.noiseReduction ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Fade In</span>
                      <span>{selectedClip.properties.fadeIn || 0}s</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="0.1"
                      value={selectedClip.properties.fadeIn || 0} 
                      onChange={(e) => onPropertyUpdate('fadeIn', parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                      <span>Fade Out</span>
                      <span>{selectedClip.properties.fadeOut || 0}s</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="5" 
                      step="0.1"
                      value={selectedClip.properties.fadeOut || 0} 
                      onChange={(e) => onPropertyUpdate('fadeOut', parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500" 
                    />
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => onDeleteClip(selectedClip.id)}
              className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2 mt-4 transition-colors touch-target"
              type="button"
            >
              <Trash2 size={14} /> Delete Clip
            </button>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50 py-12">
            <MousePointer2 size={48} strokeWidth={1} />
            <p className="mt-4 text-xs font-medium text-center px-4">Select a clip on the timeline to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
};