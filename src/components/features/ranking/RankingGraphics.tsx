import { useState } from 'react';
import { Trophy, Award, Star, Hash, Crown } from 'lucide-react';
import { RankingStyle, RankingGraphic } from './types';
import type { LucideIcon } from 'lucide-react';

interface RankingGraphicsProps {
  graphic?: RankingGraphic;
  onChange: (graphic: RankingGraphic | undefined) => void;
}

interface RankingStyleOption {
  type: RankingStyle;
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

const RANKING_STYLES: RankingStyleOption[] = [
  { type: 'number', label: 'Number', icon: Hash, color: '#3b82f6', description: 'Simple numbered ranking' },
  { type: 'badge', label: 'Badge', icon: Award, color: '#8b5cf6', description: 'Circular badge design' },
  { type: 'medal', label: 'Medal', icon: Star, color: '#f59e0b', description: 'Medal with ribbon' },
  { type: 'trophy', label: 'Trophy', icon: Trophy, color: '#10b981', description: 'Trophy icon' },
  { type: 'custom', label: 'Custom', icon: Crown, color: '#ec4899', description: 'Custom design' },
];

const POSITIONS = [
  { value: 'top-left' as const, label: 'Top Left' },
  { value: 'top-right' as const, label: 'Top Right' },
  { value: 'bottom-left' as const, label: 'Bottom Left' },
  { value: 'bottom-right' as const, label: 'Bottom Right' },
  { value: 'center' as const, label: 'Center' },
];

export const RankingGraphics = ({ graphic, onChange }: RankingGraphicsProps) => {
  const [enabled, setEnabled] = useState(!!graphic);

  const currentGraphic: RankingGraphic = graphic || {
    style: 'number',
    position: 'top-left',
    size: 80,
    animation: true,
  };

  const updateGraphic = (updates: Partial<RankingGraphic>) => {
    const newGraphic = { ...currentGraphic, ...updates };
    onChange(enabled ? newGraphic : undefined);
  };

  const toggleEnabled = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    onChange(newEnabled ? currentGraphic : undefined);
  };

  const selectedStyle = RANKING_STYLES.find((s) => s.type === currentGraphic.style);

  return (
    <div className="ranking-graphics">
      <style>{`
        .ranking-graphics {
          background: linear-gradient(135deg, #1e1b26 0%, #0f0c14 100%);
          border: 1px solid rgba(236, 72, 153, 0.2);
          border-radius: 20px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (min-width: 375px) {
          .ranking-graphics {
            border-radius: 22px;
          }
        }

        @media (min-width: 640px) {
          .ranking-graphics {
            border-radius: 24px;
          }
        }

        .ranking-header {
          padding: 16px;
          background: linear-gradient(90deg, rgba(236, 72, 153, 0.12) 0%, transparent 100%);
          border-bottom: 1px solid rgba(236, 72, 153, 0.15);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (min-width: 375px) {
          .ranking-header {
            padding: 20px;
          }
        }

        @media (min-width: 640px) {
          .ranking-header {
            padding: 28px 24px;
            flex-wrap: nowrap;
          }
        }

        .ranking-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        @media (min-width: 375px) {
          .ranking-header-left {
            gap: 16px;
          }
        }

        @media (min-width: 640px) {
          .ranking-header-left {
            gap: 18px;
          }
        }

        .ranking-icon-display {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-center;
          background: linear-gradient(135deg, ${selectedStyle?.color || '#ec4899'} 0%, ${selectedStyle?.color || '#ec4899'}dd 100%);
          border-radius: 12px;
          box-shadow: 0 10px 32px ${selectedStyle?.color || '#ec4899'}50;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }

        @media (min-width: 375px) {
          .ranking-icon-display {
            width: 56px;
            height: 56px;
            border-radius: 16px;
          }
        }

        @media (min-width: 640px) {
          .ranking-icon-display {
            width: 66px;
            height: 66px;
            border-radius: 20px;
          }
        }

        .ranking-icon-shimmer {
          position: absolute;
          inset: -8px;
          background: linear-gradient(135deg, ${selectedStyle?.color || '#ec4899'} 0%, ${selectedStyle?.color || '#ec4899'}dd 100%);
          border-radius: 22px;
          opacity: 0.35;
          filter: blur(20px);
          animation: shimmer-rotate 3s linear infinite;
        }

        .ranking-icon-inner {
          width: 24px;
          height: 24px;
        }

        @media (min-width: 375px) {
          .ranking-icon-inner {
            width: 28px;
            height: 28px;
          }
        }

        @media (min-width: 640px) {
          .ranking-icon-inner {
            width: 34px;
            height: 34px;
          }
        }

        @keyframes shimmer-rotate {
          0% { transform: rotate(0deg) scale(1); opacity: 0.35; }
          50% { transform: rotate(180deg) scale(1.1); opacity: 0.5; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.35; }
        }

        .ranking-header-info {
          flex: 1;
          min-width: 0;
        }

        .ranking-title-main {
          font-size: 16px;
          font-weight: 900;
          color: #ffffff;
          margin-bottom: 4px;
          letter-spacing: -0.4px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .ranking-subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        @media (min-width: 375px) {
          .ranking-title-main {
            font-size: 18px;
            margin-bottom: 5px;
            letter-spacing: -0.5px;
          }
          .ranking-subtitle {
            font-size: 12px;
          }
        }

        @media (min-width: 640px) {
          .ranking-title-main {
            font-size: 22px;
            margin-bottom: 6px;
            letter-spacing: -0.6px;
          }
          .ranking-subtitle {
            font-size: 13px;
          }
        }

        .ranking-enable-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        @media (min-width: 375px) {
          .ranking-enable-toggle {
            gap: 12px;
          }
        }

        @media (min-width: 640px) {
          .ranking-enable-toggle {
            gap: 14px;
          }
        }

        .ranking-toggle-label {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ranking-toggle-switch {
          width: 54px;
          height: 30px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.08);
          position: relative;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .ranking-toggle-switch.active {
          background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
          border-color: transparent;
          box-shadow: 0 4px 16px rgba(236, 72, 153, 0.4);
        }

        .ranking-toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: #ffffff;
          border-radius: 50%;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .ranking-toggle-switch.active .ranking-toggle-knob {
          transform: translateX(24px);
        }

        .ranking-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ranking-content.visible {
          max-height: 1000px;
        }

        .ranking-inner {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (min-width: 375px) {
          .ranking-inner {
            padding: 20px;
            gap: 24px;
          }
        }

        @media (min-width: 640px) {
          .ranking-inner {
            padding: 28px 24px;
            gap: 32px;
          }
        }

        .ranking-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ranking-section-title {
          font-size: 11px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ranking-styles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        @media (min-width: 375px) {
          .ranking-styles-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
          }
        }

        @media (min-width: 640px) {
          .ranking-styles-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 12px;
          }
        }

        .ranking-style-card {
          padding: 20px 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .ranking-style-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, var(--style-color) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .ranking-style-card:hover::before {
          opacity: 0.12;
        }

        .ranking-style-card:hover {
          transform: translateY(-4px);
          border-color: var(--style-color);
          box-shadow: 0 12px 32px var(--style-color-alpha);
        }

        .ranking-style-card.selected {
          background: linear-gradient(135deg, var(--style-color)18 0%, var(--style-color)0A 100%);
          border-color: var(--style-color);
          box-shadow: 0 0 0 3px var(--style-color)30, 0 12px 32px var(--style-color-alpha);
        }

        .ranking-style-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-center;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }

        @media (min-width: 375px) {
          .ranking-style-icon {
            width: 44px;
            height: 44px;
            border-radius: 11px;
          }
        }

        @media (min-width: 640px) {
          .ranking-style-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
          }
        }

        .ranking-style-card.selected .ranking-style-icon {
          background: var(--style-color);
          transform: scale(1.15) rotate(5deg);
        }

        .ranking-style-label {
          font-size: 12px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.6);
          position: relative;
          z-index: 1;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .ranking-style-card.selected .ranking-style-label {
          color: #ffffff;
        }

        .ranking-controls {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
        }

        @media (min-width: 375px) {
          .ranking-controls {
            gap: 20px;
            padding: 20px;
            border-radius: 16px;
          }
        }

        @media (min-width: 640px) {
          .ranking-controls {
            gap: 24px;
            padding: 24px;
            border-radius: 18px;
          }
        }

        .ranking-control-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ranking-control-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ranking-control-name {
          font-size: 11px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .ranking-control-val {
          font-size: 17px;
          font-weight: 900;
          color: ${selectedStyle?.color || '#ec4899'};
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        .ranking-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 5px;
          outline: none;
          cursor: pointer;
        }

        .ranking-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, ${selectedStyle?.color || '#ec4899'} 0%, ${selectedStyle?.color || '#ec4899'}dd 100%);
          border: 4px solid #1e1b26;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 16px ${selectedStyle?.color || '#ec4899'}70;
          transition: all 0.2s ease;
        }

        .ranking-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 6px 24px ${selectedStyle?.color || '#ec4899'}90;
        }

        .ranking-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, ${selectedStyle?.color || '#ec4899'} 0%, ${selectedStyle?.color || '#ec4899'}dd 100%);
          border: 4px solid #1e1b26;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 16px ${selectedStyle?.color || '#ec4899'}70;
          transition: all 0.2s ease;
        }

        .ranking-slider::-moz-range-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 6px 24px ${selectedStyle?.color || '#ec4899'}90;
        }

        .ranking-position-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        @media (min-width: 375px) {
          .ranking-position-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
        }

        .ranking-position-btn {
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
        }

        @media (min-width: 375px) {
          .ranking-position-btn {
            padding: 14px 10px;
            border-radius: 13px;
            font-size: 12px;
          }
        }

        @media (min-width: 640px) {
          .ranking-position-btn {
            padding: 16px 12px;
            border-radius: 14px;
          }
        }

        .ranking-position-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .ranking-position-btn.selected {
          background: linear-gradient(135deg, ${selectedStyle?.color || '#ec4899'}20 0%, ${selectedStyle?.color || '#ec4899'}10 100%);
          border-color: ${selectedStyle?.color || '#ec4899'};
          color: #ffffff;
          box-shadow: 0 0 0 2px ${selectedStyle?.color || '#ec4899'}20;
        }

        .ranking-animation-toggle {
          padding: 18px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ranking-animation-toggle:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .ranking-animation-toggle.active {
          background: linear-gradient(135deg, ${selectedStyle?.color || '#ec4899'}18 0%, ${selectedStyle?.color || '#ec4899'}0A 100%);
          border-color: ${selectedStyle?.color || '#ec4899'};
        }

        .ranking-animation-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ranking-animation-label {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
        }

        .ranking-animation-desc {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .ranking-animation-indicator {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.25s ease;
        }

        .ranking-animation-toggle.active .ranking-animation-indicator {
          background: ${selectedStyle?.color || '#ec4899'};
          box-shadow: 0 0 16px ${selectedStyle?.color || '#ec4899'}90;
        }
      `}</style>

      <div className="ranking-header">
        <div className="ranking-header-left">
          <div className="ranking-icon-display">
            <div className="ranking-icon-shimmer" />
            {selectedStyle && (
              <selectedStyle.icon
                size={24}
                color="#ffffff"
                strokeWidth={2.5}
                style={{ position: 'relative', zIndex: 1 }}
                className="ranking-icon-inner"
              />
            )}
          </div>
          <div className="ranking-header-info">
            <div className="ranking-title-main">Ranking Graphics</div>
            <div className="ranking-subtitle">
              {enabled ? selectedStyle?.description || 'Customize ranking display' : 'Add numbers or badges to videos'}
            </div>
          </div>
        </div>
        <div className="ranking-enable-toggle" onClick={(e) => e.stopPropagation()}>
          <span className="ranking-toggle-label">{enabled ? 'ON' : 'OFF'}</span>
          <div className={`ranking-toggle-switch ${enabled ? 'active' : ''}`} onClick={toggleEnabled}>
            <div className="ranking-toggle-knob" />
          </div>
        </div>
      </div>

      <div className={`ranking-content ${enabled ? 'visible' : ''}`}>
        <div className="ranking-inner">
          <div className="ranking-section">
            <div className="ranking-section-title">
              <Crown size={12} />
              Ranking Style
            </div>
            <div className="ranking-styles-grid">
              {RANKING_STYLES.map((style) => (
                <div
                  key={style.type}
                  className={`ranking-style-card ${currentGraphic.style === style.type ? 'selected' : ''}`}
                  style={{
                    '--style-color': style.color,
                    '--style-color-alpha': `${style.color}60`,
                  } as React.CSSProperties}
                  onClick={() => updateGraphic({ style: style.type })}
                >
                  <div className="ranking-style-icon">
                    <style.icon
                      size={24}
                      color={currentGraphic.style === style.type ? '#ffffff' : style.color}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="ranking-style-label">{style.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="ranking-controls">
            <div className="ranking-control-row">
              <div className="ranking-control-header">
                <div className="ranking-control-name">Size</div>
                <div className="ranking-control-val">{currentGraphic.size}%</div>
              </div>
              <input
                type="range"
                min="40"
                max="150"
                value={currentGraphic.size}
                onChange={(e) => updateGraphic({ size: Number(e.target.value) })}
                className="ranking-slider"
              />
            </div>

            <div className="ranking-control-row">
              <div className="ranking-control-name">Position</div>
              <div className="ranking-position-grid">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    className={`ranking-position-btn ${currentGraphic.position === pos.value ? 'selected' : ''}`}
                    onClick={() => updateGraphic({ position: pos.value })}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`ranking-animation-toggle ${currentGraphic.animation ? 'active' : ''}`}
              onClick={() => updateGraphic({ animation: !currentGraphic.animation })}
            >
              <div className="ranking-animation-text">
                <div className="ranking-animation-label">Enable Animation</div>
                <div className="ranking-animation-desc">
                  {currentGraphic.animation ? 'Animated entrance effects' : 'Static display'}
                </div>
              </div>
              <div className="ranking-animation-indicator" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
