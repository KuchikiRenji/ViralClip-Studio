import {
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Shuffle,
  RotateCw,
  Maximize2,
  Timer,
} from 'lucide-react';
import { TransitionSettings, TransitionType } from './types';

interface TransitionSelectorProps {
  settings: TransitionSettings;
  onChange: (settings: TransitionSettings) => void;
}

import type { LucideIcon } from 'lucide-react';

interface TransitionOption {
  type: TransitionType;
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const TRANSITIONS: TransitionOption[] = [
  { type: 'none', label: 'None', icon: Maximize2, color: '#6b7280', description: 'No transition' },
  { type: 'fade', label: 'Fade', icon: Sparkles, color: '#3b82f6', description: 'Smooth fade effect' },
  { type: 'wipe-left', label: 'Wipe Left', icon: ArrowLeft, color: '#8b5cf6', description: 'Wipe from right to left' },
  { type: 'wipe-right', label: 'Wipe Right', icon: ArrowRight, color: '#8b5cf6', description: 'Wipe from left to right' },
  { type: 'wipe-up', label: 'Wipe Up', icon: ArrowUp, color: '#8b5cf6', description: 'Wipe from bottom to top' },
  { type: 'wipe-down', label: 'Wipe Down', icon: ArrowDown, color: '#8b5cf6', description: 'Wipe from top to bottom' },
  { type: 'slide-left', label: 'Slide Left', icon: ArrowLeft, color: '#ec4899', description: 'Slide to the left' },
  { type: 'slide-right', label: 'Slide Right', icon: ArrowRight, color: '#ec4899', description: 'Slide to the right' },
  { type: 'zoom-in', label: 'Zoom In', icon: ZoomIn, color: '#10b981', description: 'Zoom in effect' },
  { type: 'zoom-out', label: 'Zoom Out', icon: ZoomOut, color: '#10b981', description: 'Zoom out effect' },
  { type: 'blur', label: 'Blur', icon: Sparkles, color: '#f59e0b', description: 'Blur transition' },
  { type: 'glitch', label: 'Glitch', icon: Shuffle, color: '#ef4444', description: 'Glitch effect' },
  { type: 'rotate', label: 'Rotate', icon: RotateCw, color: '#06b6d4', description: 'Rotation effect' },
  { type: 'cube', label: 'Cube', icon: Maximize2, color: '#a855f7', description: '3D cube flip' },
];

const TIMING_FUNCTIONS = [
  { value: 'linear' as const, label: 'Linear', description: 'Constant speed' },
  { value: 'ease-in' as const, label: 'Ease In', description: 'Slow start' },
  { value: 'ease-out' as const, label: 'Ease Out', description: 'Slow end' },
  { value: 'ease-in-out' as const, label: 'Ease In-Out', description: 'Slow start and end' },
  { value: 'bounce' as const, label: 'Bounce', description: 'Bouncy effect' },
];

export const TransitionSelector = ({
  settings,
  onChange,
}) => {
  const updateSettings = (updates: Partial<TransitionSettings>) => {
    onChange({ ...settings, ...updates });
  };

  const selectedTransition = TRANSITIONS.find((t) => t.type === settings.type);

  return (
    <div className="transition-selector">
      <style>{`
        .transition-selector {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .transition-header {
          padding: 24px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .transition-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .transition-icon-container {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-center;
          background: linear-gradient(135deg, ${selectedTransition?.color || '#3b82f6'} 0%, ${selectedTransition?.color || '#3b82f6'}dd 100%);
          border-radius: 18px;
          box-shadow: 0 8px 28px ${selectedTransition?.color || '#3b82f6'}40;
          position: relative;
          overflow: hidden;
        }

        .transition-icon-glow {
          position: absolute;
          inset: -6px;
          background: linear-gradient(135deg, ${selectedTransition?.color || '#3b82f6'} 0%, ${selectedTransition?.color || '#3b82f6'}dd 100%);
          border-radius: 20px;
          opacity: 0.4;
          filter: blur(16px);
          animation: glow-pulse 2.5s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .transition-header-text {
          flex: 1;
        }

        .transition-title {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .transition-description {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        .transition-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .transition-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .transition-section-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .transition-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 10px;
        }

        .transition-card {
          padding: 16px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          position: relative;
          overflow: hidden;
          width: 100%;
          border: none;
          font-family: inherit;
        }

        .transition-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, var(--card-color) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .transition-card:hover::before {
          opacity: 0.08;
        }

        .transition-card:hover {
          transform: translateY(-3px);
          border-color: var(--card-color);
          box-shadow: 0 8px 24px var(--card-color-alpha);
        }

        .transition-card.selected {
          background: linear-gradient(135deg, var(--card-color)15 0%, var(--card-color)08 100%);
          border-color: var(--card-color);
          box-shadow: 0 0 0 2px var(--card-color)40, 0 8px 24px var(--card-color-alpha);
        }

        .transition-card-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }

        .transition-card.selected .transition-card-icon {
          background: var(--card-color);
          transform: scale(1.1);
        }

        .transition-card-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          position: relative;
          z-index: 1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .transition-card.selected .transition-card-label {
          color: #ffffff;
        }

        .transition-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
        }

        .transition-control-item {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .transition-control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .transition-control-label {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .transition-control-value {
          font-size: 16px;
          font-weight: 800;
          color: ${selectedTransition?.color || '#3b82f6'};
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        .transition-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          position: relative;
        }

        .transition-slider::-webkit-slider-track {
          height: 8px;
          background: linear-gradient(to right,
            ${selectedTransition?.color || '#3b82f6'}20 0%,
            ${selectedTransition?.color || '#3b82f6'}20 var(--slider-percentage, 50%),
            rgba(255, 255, 255, 0.06) var(--slider-percentage, 50%)
          );
          border-radius: 4px;
        }

        .transition-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 26px;
          height: 26px;
          background: linear-gradient(135deg, ${selectedTransition?.color || '#3b82f6'} 0%, ${selectedTransition?.color || '#3b82f6'}dd 100%);
          border: 3px solid #0a0a0a;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 14px ${selectedTransition?.color || '#3b82f6'}60;
          transition: all 0.2s ease;
        }

        .transition-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 20px ${selectedTransition?.color || '#3b82f6'}80;
        }

        .transition-slider::-moz-range-thumb {
          width: 26px;
          height: 26px;
          background: linear-gradient(135deg, ${selectedTransition?.color || '#3b82f6'} 0%, ${selectedTransition?.color || '#3b82f6'}dd 100%);
          border: 3px solid #0a0a0a;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 14px ${selectedTransition?.color || '#3b82f6'}60;
          transition: all 0.2s ease;
        }

        .transition-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 20px ${selectedTransition?.color || '#3b82f6'}80;
        }

        .transition-timing-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .transition-timing-button {
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          text-align: left;
          font-family: inherit;
        }

        .transition-timing-button:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .transition-timing-button.selected {
          background: linear-gradient(135deg, ${selectedTransition?.color || '#3b82f6'}15 0%, ${selectedTransition?.color || '#3b82f6'}08 100%);
          border-color: ${selectedTransition?.color || '#3b82f6'};
          box-shadow: 0 0 0 2px ${selectedTransition?.color || '#3b82f6'}20;
        }

        .transition-timing-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          text-align: left;
        }

        .transition-timing-label {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
        }

        .transition-timing-description {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .transition-timing-indicator {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .transition-timing-button.selected .transition-timing-indicator {
          background: ${selectedTransition?.color || '#3b82f6'};
          border-color: ${selectedTransition?.color || '#3b82f6'};
          box-shadow: 0 0 12px ${selectedTransition?.color || '#3b82f6'}80;
        }
      `}</style>

      <div className="transition-header">
        <div className="transition-header-content">
          <div className="transition-icon-container">
            <div className="transition-icon-glow" />
            {selectedTransition && (
              <selectedTransition.icon
                size={30}
                color="#ffffff"
                strokeWidth={2.5}
                style={{ position: 'relative', zIndex: 1 }}
              />
            )}
          </div>
          <div className="transition-header-text">
            <div className="transition-title">{selectedTransition?.label || 'Transition'}</div>
            <div className="transition-description">
              {selectedTransition?.description || 'Select a transition effect'}
            </div>
          </div>
        </div>
      </div>

      <div className="transition-body">
        <div className="transition-section">
          <div className="transition-section-title">
            <Sparkles size={12} />
            Transition Effects
          </div>
          <div className="transition-grid">
            {TRANSITIONS.map((transition) => (
              <button
                type="button"
                key={transition.type}
                className={`transition-card ${settings.type === transition.type ? 'selected' : ''}`}
                style={{
                  '--card-color': transition.color,
                  '--card-color-alpha': `${transition.color}40`,
                } as React.CSSProperties}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateSettings({ type: transition.type });
                }}
                aria-label={`Select ${transition.label} transition`}
              >
                <div className="transition-card-icon">
                  <transition.icon
                    size={20}
                    color={settings.type === transition.type ? '#ffffff' : transition.color}
                    strokeWidth={2}
                  />
                </div>
                <div className="transition-card-label">{transition.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="transition-controls">
          <div className="transition-control-item">
            <div className="transition-control-header">
              <div className="transition-control-label">
                <Timer size={12} />
                Duration
              </div>
              <div className="transition-control-value">{settings.duration.toFixed(1)}s</div>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={settings.duration}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateSettings({ duration: Number(e.target.value) });
              }}
              className="transition-slider"
              style={{
                '--slider-percentage': `${((settings.duration - 0.2) / (2.0 - 0.2)) * 100}%`,
                pointerEvents: 'auto',
                zIndex: 10,
              } as React.CSSProperties}
              aria-label={`Transition duration: ${settings.duration.toFixed(1)} seconds`}
            />
          </div>

          <div className="transition-control-item">
            <div className="transition-control-label">
              <RotateCw size={12} />
              Timing Function
            </div>
            <div className="transition-timing-options">
              {TIMING_FUNCTIONS.map((func) => (
                <button
                  type="button"
                  key={func.value}
                  className={`transition-timing-button ${settings.timingFunction === func.value ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateSettings({ timingFunction: func.value });
                  }}
                  aria-label={`Select ${func.label} timing function`}
                >
                  <div className="transition-timing-text">
                    <div className="transition-timing-label">{func.label}</div>
                    <div className="transition-timing-description">{func.description}</div>
                  </div>
                  <div className="transition-timing-indicator" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
