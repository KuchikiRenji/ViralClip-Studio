import { useState, useCallback, useRef, useEffect } from 'react';
import { Palette, Check, RotateCcw, Plus, Trash2, Move } from 'lucide-react';
import { DESIGN_TOKENS } from '../../../constants/designTokens';

type ColorMode = 'solid' | 'linear' | 'radial';
type GradientDirection = 'to-right' | 'to-left' | 'to-top' | 'to-bottom' | 'to-top-right' | 'to-top-left' | 'to-bottom-right' | 'to-bottom-left';

interface GradientStop {
  id: string;
  color: string;
  position: number;
}

interface ColorGradientPickerProps {
  value: string;
  onChange: (value: string, mode: ColorMode) => void;
  showPreview?: boolean;
}

const PRESET_COLORS = [
  '#000000', '#1a1a1a', '#2d2d2d', '#404040', '#525252', '#737373',
  '#ffffff', '#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];

const PRESET_GRADIENTS = [
  { id: 'sunset', stops: [{ color: '#f43f5e', position: 0 }, { color: '#f97316', position: 100 }], label: 'Sunset' },
  { id: 'ocean', stops: [{ color: '#06b6d4', position: 0 }, { color: '#3b82f6', position: 100 }], label: 'Ocean' },
  { id: 'forest', stops: [{ color: '#22c55e', position: 0 }, { color: '#14b8a6', position: 100 }], label: 'Forest' },
  { id: 'purple', stops: [{ color: '#8b5cf6', position: 0 }, { color: '#ec4899', position: 100 }], label: 'Purple' },
  { id: 'dark', stops: [{ color: '#1a1a1a', position: 0 }, { color: '#404040', position: 100 }], label: 'Dark' },
  { id: 'neon', stops: [{ color: '#00ff87', position: 0 }, { color: '#60efff', position: 100 }], label: 'Neon' },
  { id: 'fire', stops: [{ color: '#ff0000', position: 0 }, { color: '#ff8c00', position: 50 }, { color: '#ffff00', position: 100 }], label: 'Fire' },
  { id: 'rainbow', stops: [{ color: '#ff0000', position: 0 }, { color: '#ff8c00', position: 17 }, { color: '#ffff00', position: 33 }, { color: '#00ff00', position: 50 }, { color: '#0000ff', position: 67 }, { color: '#8b00ff', position: 100 }], label: 'Rainbow' },
];

const GRADIENT_DIRECTIONS: { id: GradientDirection; label: string; angle: number }[] = [
  { id: 'to-right', label: '→', angle: 90 },
  { id: 'to-left', label: '←', angle: 270 },
  { id: 'to-top', label: '↑', angle: 0 },
  { id: 'to-bottom', label: '↓', angle: 180 },
  { id: 'to-top-right', label: '↗', angle: 45 },
  { id: 'to-top-left', label: '↖', angle: 315 },
  { id: 'to-bottom-right', label: '↘', angle: 135 },
  { id: 'to-bottom-left', label: '↙', angle: 225 },
];

const generateGradientCSS = (stops: GradientStop[], mode: ColorMode, angle: number): string => {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const stopsString = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
  
  if (mode === 'radial') {
    return `radial-gradient(circle, ${stopsString})`;
  }
  return `linear-gradient(${angle}deg, ${stopsString})`;
};

const parseGradientValue = (value: string): { mode: ColorMode; stops: GradientStop[]; angle: number } => {
  if (value.startsWith('radial-gradient')) {
    const match = value.match(/radial-gradient\(circle,\s*(.+)\)/);
    if (match) {
      const stopsStr = match[1];
      const stops = parseStopsFromString(stopsStr);
      return { mode: 'radial', stops, angle: 0 };
    }
  } else if (value.startsWith('linear-gradient')) {
    const match = value.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
    if (match) {
      const angle = parseInt(match[1], 10);
      const stopsStr = match[2];
      const stops = parseStopsFromString(stopsStr);
      return { mode: 'linear', stops, angle };
    }
  }
  return {
    mode: 'solid',
    stops: [{ id: 'stop-0', color: value || '#3b82f6', position: 0 }],
    angle: 90,
  };
};

const parseStopsFromString = (stopsStr: string): GradientStop[] => {
  const stopRegex = /(#[0-9a-fA-F]{6}|rgb[a]?\([^)]+\))\s*(\d+)?%?/g;
  const stops: GradientStop[] = [];
  let match;
  let index = 0;
  
  while ((match = stopRegex.exec(stopsStr)) !== null) {
    stops.push({
      id: `stop-${index}`,
      color: match[1],
      position: match[2] ? parseInt(match[2], 10) : (index === 0 ? 0 : 100),
    });
    index++;
  }
  
  if (stops.length === 0) {
    return [
      { id: 'stop-0', color: '#3b82f6', position: 0 },
      { id: 'stop-1', color: '#8b5cf6', position: 100 },
    ];
  }
  
  return stops;
};

export const ColorGradientPicker = ({
  value,
  onChange,
  showPreview = true,
}) => {
  const parsed = parseGradientValue(value);
  const [mode, setMode] = useState<ColorMode>(parsed.mode);
  const [solidColor, setSolidColor] = useState(parsed.stops[0]?.color || DESIGN_TOKENS.colors.brand.primary);
  const [gradientStops, setGradientStops] = useState<GradientStop[]>(
    parsed.stops.length > 1 ? parsed.stops : [
      { id: 'stop-0', color: DESIGN_TOKENS.colors.brand.primary, position: 0 },
      { id: 'stop-1', color: DESIGN_TOKENS.colors.brand.secondary, position: 100 },
    ]
  );
  const [gradientAngle, setGradientAngle] = useState(parsed.angle);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(gradientStops[0]?.id || null);
  const [isDragging, setIsDragging] = useState(false);
  
  const gradientBarRef = useRef<HTMLDivElement>(null);

  const selectedStop = gradientStops.find(s => s.id === selectedStopId);

  const updateOutput = useCallback(() => {
    if (mode === 'solid') {
      onChange(solidColor, mode);
    } else {
      const css = generateGradientCSS(gradientStops, mode, gradientAngle);
      onChange(css, mode);
    }
  }, [mode, solidColor, gradientStops, gradientAngle, onChange]);

  useEffect(() => {
    updateOutput();
  }, [mode, solidColor, gradientStops, gradientAngle]);

  const handleModeChange = useCallback((newMode: ColorMode) => {
    setMode(newMode);
  }, []);

  const handleSolidColorChange = useCallback((color: string) => {
    setSolidColor(color);
  }, []);

  const handleStopColorChange = useCallback((color: string) => {
    if (!selectedStopId) return;
    setGradientStops(prev => prev.map(s => 
      s.id === selectedStopId ? { ...s, color } : s
    ));
  }, [selectedStopId]);

  const handleStopPositionChange = useCallback((position: number) => {
    if (!selectedStopId) return;
    setGradientStops(prev => prev.map(s => 
      s.id === selectedStopId ? { ...s, position: Math.max(0, Math.min(100, position)) } : s
    ));
  }, [selectedStopId]);

  const handleAddStop = useCallback(() => {
    const newId = `stop-${Date.now()}`;
    const positions = gradientStops.map(s => s.position).sort((a, b) => a - b);
    let newPosition = 50;
    
    for (let i = 0; i < positions.length - 1; i++) {
      const gap = positions[i + 1] - positions[i];
      if (gap > 20) {
        newPosition = positions[i] + gap / 2;
        break;
      }
    }
    
    const newStop: GradientStop = {
      id: newId,
      color: '#ffffff',
      position: newPosition,
    };
    
    setGradientStops(prev => [...prev, newStop]);
    setSelectedStopId(newId);
  }, [gradientStops]);

  const handleRemoveStop = useCallback(() => {
    if (!selectedStopId || gradientStops.length <= 2) return;
    setGradientStops(prev => prev.filter(s => s.id !== selectedStopId));
    setSelectedStopId(gradientStops[0]?.id || null);
  }, [selectedStopId, gradientStops]);

  const handleGradientBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!gradientBarRef.current || isDragging) return;
    const rect = gradientBarRef.current.getBoundingClientRect();
    const position = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    
    const clickedStop = gradientStops.find(s => Math.abs(s.position - position) < 5);
    if (clickedStop) {
      setSelectedStopId(clickedStop.id);
    }
  }, [gradientStops, isDragging]);

  const handleStopDrag = useCallback((e: React.MouseEvent, stopId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setSelectedStopId(stopId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!gradientBarRef.current) return;
      const rect = gradientBarRef.current.getBoundingClientRect();
      const position = Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100);
      setGradientStops(prev => prev.map(s => 
        s.id === stopId ? { ...s, position: Math.max(0, Math.min(100, position)) } : s
      ));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handlePresetGradient = useCallback((preset: typeof PRESET_GRADIENTS[0]) => {
    const stops = preset.stops.map((s, i) => ({
      id: `stop-${i}`,
      color: s.color,
      position: s.position,
    }));
    setGradientStops(stops);
    setSelectedStopId(stops[0].id);
  }, []);

  const handleDirectionChange = useCallback((direction: GradientDirection) => {
    const dir = GRADIENT_DIRECTIONS.find(d => d.id === direction);
    if (dir) {
      setGradientAngle(dir.angle);
    }
  }, []);

  const handleReset = useCallback(() => {
    setSolidColor(DESIGN_TOKENS.colors.brand.primary);
    setGradientStops([
      { id: 'stop-0', color: DESIGN_TOKENS.colors.brand.primary, position: 0 },
      { id: 'stop-1', color: DESIGN_TOKENS.colors.brand.secondary, position: 100 },
    ]);
    setGradientAngle(90);
    setSelectedStopId('stop-0');
  }, []);

  const currentGradientCSS = mode === 'solid' 
    ? solidColor 
    : generateGradientCSS(gradientStops, mode, gradientAngle);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
          <Palette size={14} className="text-pink-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">Color & Gradient</h3>
          <p className="text-[10px] text-zinc-500">Solid, linear, or radial</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="grid grid-cols-3 gap-1 bg-zinc-800/50 rounded-xl p-1">
            {(['solid', 'linear', 'radial'] as ColorMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`py-2 rounded-lg text-[11px] font-medium transition-all capitalize ${
                  mode === m
                    ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                type="button"
              >
                {m}
              </button>
            ))}
          </div>

          {showPreview && (
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Preview</span>
              <div
                className="w-full h-20 rounded-xl border border-white/10 transition-all"
                style={{ background: currentGradientCSS }}
              />
            </div>
          )}

          {mode === 'solid' && (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-3">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Custom Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={solidColor}
                    onChange={(e) => handleSolidColorChange(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white/10 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={solidColor}
                    onChange={(e) => handleSolidColorChange(e.target.value)}
                    className="flex-1 min-w-0 bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white uppercase font-mono focus:border-pink-500/50 outline-none transition-colors"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Preset Colors</span>
                <div className="grid grid-cols-7 gap-1.5">
                  {PRESET_COLORS.map((color) => {
                    const isSelected = solidColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => handleSolidColorChange(color)}
                        className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                          isSelected
                            ? 'border-pink-500 ring-2 ring-pink-500/30 scale-110'
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

          {(mode === 'linear' || mode === 'radial') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Gradient Stops</span>
                  <div className="flex gap-1">
                    <button
                      onClick={handleAddStop}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                      type="button"
                      title="Add stop"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={handleRemoveStop}
                      disabled={gradientStops.length <= 2}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      type="button"
                      title="Remove stop"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <div
                  ref={gradientBarRef}
                  className="relative w-full h-8 rounded-lg cursor-pointer border border-white/10"
                  style={{ background: currentGradientCSS }}
                  onClick={handleGradientBarClick}
                >
                  {gradientStops.map((stop) => (
                    <div
                      key={stop.id}
                      className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing transition-all ${
                        selectedStopId === stop.id
                          ? 'border-white ring-2 ring-pink-500/50 scale-125 z-10'
                          : 'border-white/70 hover:border-white'
                      }`}
                      style={{
                        left: `calc(${stop.position}% - 8px)`,
                        backgroundColor: stop.color,
                      }}
                      onMouseDown={(e) => handleStopDrag(e, stop.id)}
                    />
                  ))}
                </div>
              </div>

              {selectedStop && (
                <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-3">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Selected Stop</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-zinc-500">Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedStop.color}
                          onChange={(e) => handleStopColorChange(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-white/10 bg-transparent shrink-0"
                        />
                        <input
                          type="text"
                          value={selectedStop.color}
                          onChange={(e) => handleStopColorChange(e.target.value)}
                          className="flex-1 min-w-0 bg-zinc-900/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white uppercase font-mono focus:border-pink-500/50 outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-zinc-500">Position</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedStop.position}
                          onChange={(e) => handleStopPositionChange(parseInt(e.target.value, 10))}
                          className="flex-1 h-1.5 bg-zinc-700 rounded-lg accent-pink-500 cursor-pointer"
                        />
                        <span className="text-[10px] text-zinc-400 w-8 text-right">{selectedStop.position}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'linear' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Direction</span>
                    <span className="text-[10px] text-zinc-500">{gradientAngle}°</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {GRADIENT_DIRECTIONS.map((dir) => (
                      <button
                        key={dir.id}
                        onClick={() => handleDirectionChange(dir.id)}
                        className={`py-2 rounded-lg text-sm transition-all ${
                          gradientAngle === dir.angle
                            ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/25'
                            : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                        }`}
                        type="button"
                        title={`${dir.angle}°`}
                      >
                        {dir.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientAngle}
                    onChange={(e) => setGradientAngle(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg accent-pink-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Preset Gradients</span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_GRADIENTS.map((preset) => {
                    const previewCSS = generateGradientCSS(
                      preset.stops.map((s, i) => ({ id: `p-${i}`, ...s })),
                      mode,
                      gradientAngle
                    );
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetGradient(preset)}
                        className="h-12 rounded-xl border border-white/5 hover:border-pink-500/30 transition-all hover:scale-[1.02] relative overflow-hidden"
                        style={{ background: previewCSS }}
                        type="button"
                      >
                        <span className="absolute bottom-1.5 left-2 text-[9px] text-white font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/5"
            type="button"
          >
            <RotateCcw size={12} />
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};


