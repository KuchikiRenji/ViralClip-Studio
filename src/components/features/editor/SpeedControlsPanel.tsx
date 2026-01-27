import { useState, useCallback } from 'react';
import { 
  Gauge, 
  FastForward, 
  Rewind, 
  Play, 
  RotateCcw,
  Layers,
  Move,
  Maximize2,
  Check
} from 'lucide-react';
import { Clip, ClipProperties } from '../../../types';
import { useTranslation } from '../../../hooks/useTranslation';
interface SpeedControlsPanelProps {
  selectedClip: Clip | undefined;
  onPropertyUpdate: (key: keyof ClipProperties, value: unknown) => void;
  onEnablePiP?: (clipId: string, config: PiPConfig) => void;
}
interface PiPConfig {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
  scale: number;
  offsetX: number;
  offsetY: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}
const SPEED_PRESETS = [
  { value: 0.25, label: '0.25x', descKey: 'speedPanel.slowMotion' },
  { value: 0.5, label: '0.5x', descKey: 'speedPanel.halfSpeed' },
  { value: 0.75, label: '0.75x', descKey: 'speedPanel.slightlySlow' },
  { value: 1, label: '1x', descKey: 'speedPanel.normal' },
  { value: 1.25, label: '1.25x', descKey: 'speedPanel.slightlyFast' },
  { value: 1.5, label: '1.5x', descKey: 'speedPanel.fast' },
  { value: 2, label: '2x', descKey: 'speedPanel.doubleSpeed' },
  { value: 4, label: '4x', descKey: 'speedPanel.veryFast' },
];
const PIP_POSITIONS = [
  { id: 'top-left' as const, label: 'Top Left', x: 5, y: 5 },
  { id: 'top-right' as const, label: 'Top Right', x: 95, y: 5 },
  { id: 'bottom-left' as const, label: 'Bottom Left', x: 5, y: 95 },
  { id: 'bottom-right' as const, label: 'Bottom Right', x: 95, y: 95 },
  { id: 'custom' as const, label: 'Custom', x: 50, y: 50 },
];
export const SpeedControlsPanel = ({
  selectedClip,
  onPropertyUpdate,
  onEnablePiP,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'speed' | 'pip'>('speed');
  const [pipConfig, setPipConfig] = useState<PiPConfig>({
    enabled: false,
    position: 'bottom-right',
    scale: 30,
    offsetX: 10,
    offsetY: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
  });
  const currentSpeed = selectedClip?.properties.speed ?? 1;
  const handleSpeedChange = useCallback((speed: number) => {
    onPropertyUpdate('speed', speed);
  }, [onPropertyUpdate]);
  const handleResetSpeed = useCallback(() => {
    onPropertyUpdate('speed', 1);
  }, [onPropertyUpdate]);
  const handlePiPToggle = useCallback(() => {
    const newConfig = { ...pipConfig, enabled: !pipConfig.enabled };
    setPipConfig(newConfig);
    if (selectedClip && onEnablePiP) {
      onEnablePiP(selectedClip.id, newConfig);
    }
  }, [pipConfig, selectedClip, onEnablePiP]);
  const handlePiPConfigChange = useCallback((key: keyof PiPConfig, value: unknown) => {
    const newConfig = { ...pipConfig, [key]: value };
    setPipConfig(newConfig);
    if (selectedClip && onEnablePiP && pipConfig.enabled) {
      onEnablePiP(selectedClip.id, newConfig);
    }
  }, [pipConfig, selectedClip, onEnablePiP]);
  const getDurationAtSpeed = useCallback((duration: number, speed: number): string => {
    const adjustedDuration = duration / speed;
    const mins = Math.floor(adjustedDuration / 60);
    const secs = Math.floor(adjustedDuration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  if (!selectedClip) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Gauge size={14} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">{t('speedPanel.title')}</h3>
            <p className="text-[10px] text-zinc-500">{t('speedPanel.subtitle')}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs p-4 text-center">
          {t('speedPanel.selectClip')}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <Gauge size={14} className="text-amber-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">Speed & PiP</h3>
          <p className="text-[10px] text-zinc-500">{selectedClip.title}</p>
        </div>
      </div>
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setActiveTab('speed')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors ${
            activeTab === 'speed'
              ? 'text-white border-b-2 border-amber-500 bg-amber-500/5'
              : 'text-zinc-500 hover:text-white border-b-2 border-transparent'
          }`}
          type="button"
        >
          <Gauge size={12} />
          {t('speedPanel.speed')}
        </button>
        <button
          onClick={() => setActiveTab('pip')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium transition-colors ${
            activeTab === 'pip'
              ? 'text-white border-b-2 border-amber-500 bg-amber-500/5'
              : 'text-zinc-500 hover:text-white border-b-2 border-transparent'
          }`}
          type="button"
        >
          <Layers size={12} />
          {t('speedPanel.pip')}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          {activeTab === 'speed' && (
            <>
              <div className="p-4 bg-zinc-800/30 rounded-xl border border-white/5 text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {currentSpeed}x
                </div>
                <div className="text-xs text-zinc-500">
                  {currentSpeed < 1 ? t('speedPanel.slowMotionLabel') : currentSpeed > 1 ? t('speedPanel.fastForwardLabel') : t('speedPanel.normalSpeedLabel')}
                </div>
                {selectedClip.duration && (
                  <div className="text-[10px] text-zinc-600 mt-2">
                    {t('speedPanel.duration')}: {getDurationAtSpeed(selectedClip.duration, currentSpeed)}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span className="font-medium uppercase tracking-wider">Speed</span>
                  <span>{currentSpeed}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <Rewind size={12} className="text-zinc-500" />
                  <input
                    type="range"
                    min="0.25"
                    max="4"
                    step="0.25"
                    value={currentSpeed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-zinc-700 rounded-lg accent-amber-500 cursor-pointer"
                  />
                  <FastForward size={12} className="text-zinc-500" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('speedPanel.presets')}</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {SPEED_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleSpeedChange(preset.value)}
                      className={`py-2 rounded-lg text-[11px] font-medium transition-all ${
                        currentSpeed === preset.value
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                          : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                      }`}
                      type="button"
                      title={t(preset.descKey)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSpeedChange(Math.max(0.25, currentSpeed - 0.25))}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  type="button"
                >
                  <Rewind size={14} />
                  {t('speedPanel.slower')}
                </button>
                <button
                  onClick={handleResetSpeed}
                  className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  type="button"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => handleSpeedChange(Math.min(4, currentSpeed + 0.25))}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  type="button"
                >
                  {t('speedPanel.faster')}
                  <FastForward size={14} />
                </button>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <Play size={14} className="text-amber-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-amber-300">{t('speedPanel.tipTitle')}</div>
                    <p className="text-[10px] text-amber-400/80 mt-0.5">
                      {currentSpeed < 1 
                        ? t('speedPanel.tipSlow')
                        : currentSpeed > 1
                        ? t('speedPanel.tipFast')
                        : t('speedPanel.tipNormal')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'pip' && (
            <>
              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-amber-400" />
                    <span className="text-sm font-medium text-white">{t('speedPanel.enablePip')}</span>
                  </div>
                  <button
                    onClick={handlePiPToggle}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      pipConfig.enabled ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                    type="button"
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      pipConfig.enabled ? 'left-6' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
              {pipConfig.enabled && (
                <>
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('speedPanel.position')}</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PIP_POSITIONS.map((pos) => (
                        <button
                          key={pos.id}
                          onClick={() => handlePiPConfigChange('position', pos.id)}
                          className={`py-2 px-3 rounded-lg text-[11px] font-medium transition-all flex items-center gap-2 ${
                            pipConfig.position === pos.id
                              ? 'bg-amber-600 text-white'
                              : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                          }`}
                          type="button"
                        >
                          {pipConfig.position === pos.id && <Check size={10} />}
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span className="font-medium uppercase tracking-wider flex items-center gap-1">
                        <Maximize2 size={10} />
                        {t('speedPanel.scale')}
                      </span>
                      <span>{pipConfig.scale}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={pipConfig.scale}
                      onChange={(e) => handlePiPConfigChange('scale', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-amber-500 cursor-pointer"
                    />
                  </div>
                  {pipConfig.position === 'custom' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>Offset X</span>
                          <span>{pipConfig.offsetX}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pipConfig.offsetX}
                          onChange={(e) => handlePiPConfigChange('offsetX', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-zinc-700 rounded-lg accent-amber-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>Offset Y</span>
                          <span>{pipConfig.offsetY}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pipConfig.offsetY}
                          onChange={(e) => handlePiPConfigChange('offsetY', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-zinc-700 rounded-lg accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span className="font-medium uppercase tracking-wider">{t('speedPanel.borderRadius')}</span>
                      <span>{pipConfig.borderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={pipConfig.borderRadius}
                      onChange={(e) => handlePiPConfigChange('borderRadius', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('speedPanel.border')}</span>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={pipConfig.borderColor}
                        onChange={(e) => handlePiPConfigChange('borderColor', e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-white/10 bg-transparent"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>Width</span>
                          <span>{pipConfig.borderWidth}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={pipConfig.borderWidth}
                          onChange={(e) => handlePiPConfigChange('borderWidth', parseInt(e.target.value))}
                          className="w-full h-1.5 bg-zinc-700 rounded-lg accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                    <div className="text-[10px] text-zinc-500 mb-2">{t('speedPanel.preview')}</div>
                    <div className="relative w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                      <div
                        className="absolute bg-amber-500/30"
                        style={{
                          width: `${pipConfig.scale}%`,
                          height: `${pipConfig.scale}%`,
                          borderRadius: `${pipConfig.borderRadius}px`,
                          border: `${pipConfig.borderWidth}px solid ${pipConfig.borderColor}`,
                          ...(pipConfig.position === 'top-left' && { top: '5%', left: '5%' }),
                          ...(pipConfig.position === 'top-right' && { top: '5%', right: '5%' }),
                          ...(pipConfig.position === 'bottom-left' && { bottom: '5%', left: '5%' }),
                          ...(pipConfig.position === 'bottom-right' && { bottom: '5%', right: '5%' }),
                          ...(pipConfig.position === 'custom' && {
                            top: `${pipConfig.offsetY}%`,
                            left: `${pipConfig.offsetX}%`,
                            transform: 'translate(-50%, -50%)',
                          }),
                        }}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers size={16} className="text-amber-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};