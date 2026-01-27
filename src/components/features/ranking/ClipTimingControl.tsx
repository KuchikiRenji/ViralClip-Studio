import { useState } from 'react';
import { Clock, Scissors, FastForward, Rewind, Timer } from 'lucide-react';

interface ClipTimingControlProps {
  clipDuration?: number;
  trimStart?: number;
  trimEnd?: number;
  videoDuration?: number;
  onDurationChange: (duration: number) => void;
  onTrimChange: (start: number, end: number) => void;
  allowTrim?: boolean;
}

export const ClipTimingControl = ({
  clipDuration = 5,
  trimStart = 0,
  trimEnd,
  videoDuration = 30,
  onDurationChange,
  onTrimChange,
  allowTrim = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const effectiveTrimEnd = trimEnd ?? videoDuration;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  const TIMING_PRESETS = [
    { label: '3s', value: 3, icon: FastForward },
    { label: '5s', value: 5, icon: Timer },
    { label: '7s', value: 7, icon: Clock },
    { label: '10s', value: 10, icon: Clock },
  ];

  return (
    <div className="clip-timing-control">
      <style>{`
        .clip-timing-control {
          background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        .timing-header {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          position: relative;
          z-index: 1;
          width: 100%;
          border: none;
          background: transparent;
          text-align: left;
        }

        .timing-header:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .timing-header:active {
          background: rgba(255, 255, 255, 0.04);
        }

        .timing-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .timing-icon-wrapper {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .timing-label {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .timing-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .timing-value {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        .timing-expand-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .timing-expand-btn.expanded {
          transform: rotate(180deg);
        }

        .timing-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .timing-content.expanded {
          max-height: 500px;
        }

        .timing-inner {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .timing-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timing-section-title {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1.2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .timing-presets {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .timing-preset-btn {
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .timing-preset-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(102, 126, 234, 0.4);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .timing-preset-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .timing-slider-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .timing-slider-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timing-slider-name {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .timing-slider-value {
          font-size: 13px;
          font-weight: 700;
          color: #667eea;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        .timing-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          outline: none;
          position: relative;
          cursor: pointer;
        }

        .timing-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid #0d0d0d;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .timing-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
        }

        .timing-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid #0d0d0d;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .timing-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
        }

        .timing-trim-visual {
          height: 60px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .timing-trim-track {
          position: absolute;
          top: 0;
          bottom: 0;
          background: linear-gradient(90deg,
            rgba(102, 126, 234, 0.1) 0%,
            rgba(118, 75, 162, 0.1) 100%
          );
          border-left: 2px solid #667eea;
          border-right: 2px solid #764ba2;
        }

        .timing-trim-markers {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          pointer-events: none;
        }

        .timing-trim-marker {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        .timing-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .timing-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .timing-stat-label {
          font-size: 9px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .timing-stat-value {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .timing-icon-wrapper svg {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      <button
        type="button"
        className="timing-header"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        aria-expanded={isExpanded}
        aria-label="Toggle clip duration settings"
      >
        <div className="timing-header-left">
          <div className="timing-icon-wrapper">
            <Clock size={16} color="#ffffff" />
          </div>
          <div className="timing-label">
            <div className="timing-title">Clip Duration</div>
            <div className="timing-value">{clipDuration.toFixed(1)}s</div>
          </div>
        </div>
        <div className={`timing-expand-btn ${isExpanded ? 'expanded' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>

      <div className={`timing-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="timing-inner">
          <div className="timing-section">
            <div className="timing-section-title">
              <FastForward size={12} />
              Quick Durations
            </div>
            <div className="timing-presets">
              {TIMING_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`timing-preset-btn ${clipDuration === preset.value ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDurationChange(preset.value);
                  }}
                >
                  <preset.icon size={16} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="timing-section">
            <div className="timing-section-title">
              <Timer size={12} />
              Custom Duration
            </div>
            <div className="timing-slider-group">
              <div className="timing-slider-label">
                <span className="timing-slider-name">Clip Length</span>
                <span className="timing-slider-value">{clipDuration.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={clipDuration}
                onChange={(e) => onDurationChange(Number(e.target.value))}
                className="timing-slider"
              />
            </div>
          </div>

          {allowTrim && (
            <>
              <div className="timing-section">
                <div className="timing-section-title">
                  <Scissors size={12} />
                  Trim Video
                </div>
                <div className="timing-trim-visual">
                  <div
                    className="timing-trim-track"
                    style={{
                      left: `${(trimStart / videoDuration) * 100}%`,
                      right: `${((videoDuration - effectiveTrimEnd) / videoDuration) * 100}%`,
                    }}
                  />
                  <div className="timing-trim-markers">
                    <div className="timing-trim-marker">
                      <Rewind size={10} />
                      {formatTime(trimStart)}
                    </div>
                    <div className="timing-trim-marker">
                      {formatTime(effectiveTrimEnd)}
                      <FastForward size={10} />
                    </div>
                  </div>
                </div>
                <div className="timing-slider-group">
                  <div className="timing-slider-label">
                    <span className="timing-slider-name">Trim Start</span>
                    <span className="timing-slider-value">{formatTime(trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    value={trimStart}
                    onChange={(e) => onTrimChange(Number(e.target.value), effectiveTrimEnd)}
                    className="timing-slider"
                  />
                </div>
                <div className="timing-slider-group">
                  <div className="timing-slider-label">
                    <span className="timing-slider-name">Trim End</span>
                    <span className="timing-slider-value">{formatTime(effectiveTrimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    min={trimStart}
                    max={videoDuration}
                    step="0.1"
                    value={effectiveTrimEnd}
                    onChange={(e) => onTrimChange(trimStart, Number(e.target.value))}
                    className="timing-slider"
                  />
                </div>
              </div>

              <div className="timing-stats">
                <div className="timing-stat">
                  <div className="timing-stat-label">Actual Duration</div>
                  <div className="timing-stat-value">{formatTime(effectiveTrimEnd - trimStart)}</div>
                </div>
                <div className="timing-stat">
                  <div className="timing-stat-label">Total Video</div>
                  <div className="timing-stat-value">{formatTime(videoDuration)}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
