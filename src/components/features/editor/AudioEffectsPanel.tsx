import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Waves, 
  TrendingUp, 
  TrendingDown, 
  Mic, 
  Sliders, 
  RotateCcw,
  Play,
  Pause,
  Check
} from 'lucide-react';

interface AudioEffectsConfig {
  volume: number;
  fadeIn: number;
  fadeOut: number;
  noiseReduction: boolean;
  noiseReductionLevel: number;
  voiceBoost: boolean;
  voiceBoostLevel: number;
  bassBoost: number;
  trebleBoost: number;
  compression: boolean;
  compressionThreshold: number;
  compressionRatio: number;
  normalization: boolean;
  pan: number;
}

interface VolumeKeyframe {
  id: string;
  time: number;
  value: number;
}

interface AudioEffectsPanelProps {
  config: AudioEffectsConfig;
  onChange: (config: AudioEffectsConfig) => void;
  duration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
  audioUrl?: string;
}

const DEFAULT_CONFIG: AudioEffectsConfig = {
  volume: 100,
  fadeIn: 0,
  fadeOut: 0,
  noiseReduction: false,
  noiseReductionLevel: 50,
  voiceBoost: false,
  voiceBoostLevel: 50,
  bassBoost: 0,
  trebleBoost: 0,
  compression: false,
  compressionThreshold: -24,
  compressionRatio: 4,
  normalization: false,
  pan: 0,
};

const FADE_PRESETS = [
  { label: 'None', value: 0 },
  { label: '0.5s', value: 0.5 },
  { label: '1s', value: 1 },
  { label: '2s', value: 2 },
  { label: '3s', value: 3 },
  { label: '5s', value: 5 },
];

export const AudioEffectsPanel = ({
  config,
  onChange,
  duration,
  currentTime,
  onSeek,
  audioUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'volume' | 'effects' | 'advanced'>('volume');
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumeKeyframes, setVolumeKeyframes] = useState<VolumeKeyframe[]>([
    { id: 'start', time: 0, value: 100 },
    { id: 'end', time: duration, value: 100 },
  ]);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleConfigChange = useCallback(<K extends keyof AudioEffectsConfig>(
    key: K,
    value: AudioEffectsConfig[K]
  ) => {
    onChange({ ...config, [key]: value });
  }, [config, onChange]);

  const handleReset = useCallback(() => {
    onChange(DEFAULT_CONFIG);
    setVolumeKeyframes([
      { id: 'start', time: 0, value: 100 },
      { id: 'end', time: duration, value: 100 },
    ]);
  }, [onChange, duration]);

  const handleAddKeyframe = useCallback(() => {
    const newKeyframe: VolumeKeyframe = {
      id: `kf-${Date.now()}`,
      time: currentTime,
      value: config.volume,
    };
    setVolumeKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    setSelectedKeyframeId(newKeyframe.id);
  }, [currentTime, config.volume]);

  const handleRemoveKeyframe = useCallback((id: string) => {
    if (id === 'start' || id === 'end') return;
    setVolumeKeyframes(prev => prev.filter(kf => kf.id !== id));
    if (selectedKeyframeId === id) {
      setSelectedKeyframeId(null);
    }
  }, [selectedKeyframeId]);

  const handleKeyframeValueChange = useCallback((id: string, value: number) => {
    setVolumeKeyframes(prev => prev.map(kf => 
      kf.id === id ? { ...kf, value: Math.max(0, Math.min(100, value)) } : kf
    ));
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const drawVolumeCurve = useCallback(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = 'rgba(39, 39, 42, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    const fadeInWidth = (config.fadeIn / duration) * width;
    if (fadeInWidth > 0) {
      const gradient = ctx.createLinearGradient(0, 0, fadeInWidth, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, fadeInWidth, height);
    }
    
    const fadeOutWidth = (config.fadeOut / duration) * width;
    if (fadeOutWidth > 0) {
      const gradient = ctx.createLinearGradient(width - fadeOutWidth, 0, width, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(width - fadeOutWidth, 0, fadeOutWidth, height);
    }
    
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    
    const sortedKeyframes = [...volumeKeyframes].sort((a, b) => a.time - b.time);
    
    sortedKeyframes.forEach((kf, index) => {
      const x = (kf.time / duration) * width;
      const y = height - (kf.value / 100) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    sortedKeyframes.forEach((kf) => {
      const x = (kf.time / duration) * width;
      const y = height - (kf.value / 100) * height;
      
      ctx.beginPath();
      ctx.arc(x, y, selectedKeyframeId === kf.id ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = selectedKeyframeId === kf.id ? '#60a5fa' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    const playheadX = (currentTime / duration) * width;
    ctx.beginPath();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [volumeKeyframes, config.fadeIn, config.fadeOut, duration, currentTime, selectedKeyframeId]);

  useEffect(() => {
    drawVolumeCurve();
  }, [drawVolumeCurve]);

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.volume = config.volume / 100;
      
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && onSeek) {
          onSeek(audioRef.current.currentTime);
        }
      };
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = config.volume / 100;
    }
  }, [config.volume]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    
    const clickedKeyframe = volumeKeyframes.find(kf => {
      const kfX = (kf.time / duration) * rect.width;
      return Math.abs(kfX - x) < 10;
    });
    
    if (clickedKeyframe) {
      setSelectedKeyframeId(clickedKeyframe.id);
    } else if (onSeek) {
      onSeek(time);
    }
  }, [volumeKeyframes, duration, onSeek]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
          <Waves size={14} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">Audio Effects</h3>
          <p className="text-[10px] text-zinc-500">Enhance your audio</p>
        </div>
      </div>

      <div className="flex border-b border-white/5">
        {(['volume', 'effects', 'advanced'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-white border-b-2 border-green-500 bg-green-500/5'
                : 'text-zinc-500 hover:text-white border-b-2 border-transparent'
            }`}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          {activeTab === 'volume' && (
            <>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <Volume2 size={12} />
                    Master Volume
                  </span>
                  <span className="text-xs text-white font-mono">{config.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={config.volume}
                  onChange={(e) => handleConfigChange('volume', parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-600">
                  <span>0%</span>
                  <span>100%</span>
                  <span>150%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Volume Curve</span>
                  <button
                    onClick={handleAddKeyframe}
                    className="text-[10px] text-green-400 hover:text-green-300 transition-colors"
                    type="button"
                  >
                    + Add Keyframe
                  </button>
                </div>
                <canvas
                  ref={curveCanvasRef}
                  width={280}
                  height={80}
                  className="w-full h-20 rounded-lg cursor-pointer"
                  onClick={handleCanvasClick}
                />
                <div className="flex justify-between text-[9px] text-zinc-600">
                  <span>{formatTime(0)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {selectedKeyframeId && (
                <div className="p-3 bg-zinc-800/30 rounded-xl border border-green-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-medium">Selected Keyframe</span>
                    {selectedKeyframeId !== 'start' && selectedKeyframeId !== 'end' && (
                      <button
                        onClick={() => handleRemoveKeyframe(selectedKeyframeId)}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        type="button"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500 w-12">Volume</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volumeKeyframes.find(kf => kf.id === selectedKeyframeId)?.value || 100}
                      onChange={(e) => handleKeyframeValueChange(selectedKeyframeId, parseInt(e.target.value, 10))}
                      className="flex-1 h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-white w-8 text-right">
                      {volumeKeyframes.find(kf => kf.id === selectedKeyframeId)?.value}%
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp size={10} />
                    Fade In
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {FADE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handleConfigChange('fadeIn', preset.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
                          config.fadeIn === preset.value
                            ? 'bg-green-600 text-white'
                            : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                        }`}
                        type="button"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown size={10} />
                    Fade Out
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {FADE_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handleConfigChange('fadeOut', preset.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] transition-all ${
                          config.fadeOut === preset.value
                            ? 'bg-green-600 text-white'
                            : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                        }`}
                        type="button"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Pan (L/R)</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-500">L</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={config.pan}
                    onChange={(e) => handleConfigChange('pan', parseInt(e.target.value, 10))}
                    className="flex-1 h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-500">R</span>
                  <span className="text-[10px] text-white w-8 text-right">{config.pan}</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'effects' && (
            <>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VolumeX size={14} className="text-zinc-400" />
                    <span className="text-xs font-medium text-white">Noise Reduction</span>
                  </div>
                  <button
                    onClick={() => handleConfigChange('noiseReduction', !config.noiseReduction)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      config.noiseReduction ? 'bg-green-500' : 'bg-zinc-700'
                    }`}
                    type="button"
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      config.noiseReduction ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
                {config.noiseReduction && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Reduction Level</span>
                      <span>{config.noiseReductionLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.noiseReductionLevel}
                      onChange={(e) => handleConfigChange('noiseReductionLevel', parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic size={14} className="text-zinc-400" />
                    <span className="text-xs font-medium text-white">Voice Boost</span>
                  </div>
                  <button
                    onClick={() => handleConfigChange('voiceBoost', !config.voiceBoost)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      config.voiceBoost ? 'bg-green-500' : 'bg-zinc-700'
                    }`}
                    type="button"
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      config.voiceBoost ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
                {config.voiceBoost && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Boost Level</span>
                      <span>{config.voiceBoostLevel}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.voiceBoostLevel}
                      onChange={(e) => handleConfigChange('voiceBoostLevel', parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span className="font-medium uppercase tracking-wider">Bass Boost</span>
                    <span>{config.bassBoost > 0 ? '+' : ''}{config.bassBoost} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={config.bassBoost}
                    onChange={(e) => handleConfigChange('bassBoost', parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span className="font-medium uppercase tracking-wider">Treble Boost</span>
                    <span>{config.trebleBoost > 0 ? '+' : ''}{config.trebleBoost} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    value={config.trebleBoost}
                    onChange={(e) => handleConfigChange('trebleBoost', parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'advanced' && (
            <>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-zinc-400" />
                    <span className="text-xs font-medium text-white">Compression</span>
                  </div>
                  <button
                    onClick={() => handleConfigChange('compression', !config.compression)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      config.compression ? 'bg-green-500' : 'bg-zinc-700'
                    }`}
                    type="button"
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      config.compression ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
                {config.compression && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Threshold</span>
                        <span>{config.compressionThreshold} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="0"
                        value={config.compressionThreshold}
                        onChange={(e) => handleConfigChange('compressionThreshold', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-zinc-400">
                        <span>Ratio</span>
                        <span>{config.compressionRatio}:1</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={config.compressionRatio}
                        onChange={(e) => handleConfigChange('compressionRatio', parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg accent-green-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves size={14} className="text-zinc-400" />
                    <span className="text-xs font-medium text-white">Normalize Audio</span>
                  </div>
                  <button
                    onClick={() => handleConfigChange('normalization', !config.normalization)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      config.normalization ? 'bg-green-500' : 'bg-zinc-700'
                    }`}
                    type="button"
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      config.normalization ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  Automatically adjust volume to optimal levels
                </p>
              </div>

              <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-green-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-green-300">Audio Enhancement Active</div>
                    <p className="text-[10px] text-green-400/80 mt-0.5">
                      {[
                        config.noiseReduction && 'Noise Reduction',
                        config.voiceBoost && 'Voice Boost',
                        config.compression && 'Compression',
                        config.normalization && 'Normalization',
                      ].filter(Boolean).join(', ') || 'No effects enabled'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={handleReset}
            className="w-full py-2.5 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-white/5"
            type="button"
          >
            <RotateCcw size={12} />
            Reset All Effects
          </button>

          {audioUrl && (
            <button
              onClick={handleTogglePlay}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              type="button"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause Preview' : 'Preview Audio'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


