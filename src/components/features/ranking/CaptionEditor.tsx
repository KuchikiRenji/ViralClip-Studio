import { useState } from 'react';
import { Type, Palette, AlignLeft, AlignCenter, AlignRight, Sparkles, Clock, Move } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ClipCaption, CaptionFormat, CaptionPosition, CaptionAnimation } from './types';

interface CaptionEditorProps {
  caption?: ClipCaption;
  clipDuration: number;
  onChange: (caption: ClipCaption) => void;
}

const DEFAULT_CAPTION_FORMAT: CaptionFormat = {
  fontFamily: 'Inter',
  fontSize: 18,
  color: '#ffffff',
  bold: true,
  italic: false,
  backgroundColor: '#000000',
  backgroundOpacity: 70,
  borderColor: '#667eea',
  borderWidth: 0,
};

export const CaptionEditor = ({
  caption,
  clipDuration,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentCaption: ClipCaption = caption || {
    text: '',
    enabled: false,
    format: DEFAULT_CAPTION_FORMAT,
    position: 'bottom',
    animation: 'fade',
    timing: {
      showTime: 0,
      hideTime: clipDuration,
    },
  };

  const updateCaption = (updates: Partial<ClipCaption>) => {
    onChange({ ...currentCaption, ...updates });
  };

  const updateFormat = (updates: Partial<CaptionFormat>) => {
    onChange({
      ...currentCaption,
      format: { ...currentCaption.format, ...updates },
    });
  };

  const FONT_FAMILIES = [
    'Inter',
    'Roboto',
    'Montserrat',
    'Playfair Display',
    'Bebas Neue',
    'Anton',
    'Righteous',
  ];

  const POSITIONS: Array<{ value: CaptionPosition; label: string; icon: LucideIcon }> = [
    { value: 'top', label: 'Top', icon: AlignCenter },
    { value: 'middle', label: 'Middle', icon: AlignCenter },
    { value: 'bottom', label: 'Bottom', icon: AlignCenter },
  ];

  const ANIMATIONS: Array<{ value: CaptionAnimation; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'fade', label: 'Fade' },
    { value: 'slide-up', label: 'Slide Up' },
    { value: 'slide-down', label: 'Slide Down' },
    { value: 'typewriter', label: 'Typewriter' },
    { value: 'pop', label: 'Pop' },
  ];

  return (
    <div className="caption-editor">
      <style>{`
        .caption-editor {
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .caption-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%);
        }

        .caption-header:hover {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
        }

        .caption-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .caption-icon-badge {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
          position: relative;
          overflow: hidden;
        }

        .caption-icon-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .caption-header-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .caption-title {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .caption-subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .caption-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .caption-toggle-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
        }

        .caption-toggle-switch {
          width: 48px;
          height: 26px;
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .caption-toggle-switch.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .caption-toggle-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          background: #ffffff;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .caption-toggle-switch.active .caption-toggle-thumb {
          transform: translateX(22px);
        }

        .caption-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .caption-content.expanded {
          max-height: 800px;
        }

        .caption-inner {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .caption-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .caption-section-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 1.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .caption-textarea {
          width: 100%;
          min-height: 80px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 500;
          resize: vertical;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .caption-textarea:focus {
          outline: none;
          border-color: #667eea;
          background: rgba(0, 0, 0, 0.5);
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .caption-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .caption-format-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .caption-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .caption-input-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .caption-select {
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .caption-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .caption-select option {
          background: #1a1a1a;
          color: #ffffff;
        }

        .caption-color-input {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .caption-color-input:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .caption-color-picker {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
        }

        .caption-color-value {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          font-family: 'SF Mono', monospace;
        }

        .caption-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }

        .caption-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid #0f0f0f;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
          transition: transform 0.2s ease;
        }

        .caption-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .caption-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid #0f0f0f;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
          transition: transform 0.2s ease;
        }

        .caption-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
        }

        .caption-button-group {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .caption-button {
          padding: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .caption-button:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.4);
          color: #ffffff;
          transform: translateY(-1px);
        }

        .caption-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
        }

        .caption-preview {
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          border: 2px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          text-align: center;
          min-height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .caption-preview-text {
          padding: 12px 24px;
          border-radius: 8px;
          display: inline-block;
        }

        .caption-style-toggles {
          display: flex;
          gap: 8px;
        }

        .caption-style-toggle {
          flex: 1;
          padding: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .caption-style-toggle.active {
          background: rgba(102, 126, 234, 0.2);
          border-color: #667eea;
          color: #667eea;
        }
      `}</style>

      <div className="caption-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="caption-header-left">
          <div className="caption-icon-badge">
            <Type size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div className="caption-header-text">
            <div className="caption-title">Captions</div>
            <div className="caption-subtitle">
              {currentCaption.enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
        <div className="caption-toggle" onClick={(e) => e.stopPropagation()}>
          <span className="caption-toggle-label">
            {currentCaption.enabled ? 'ON' : 'OFF'}
          </span>
          <div
            className={`caption-toggle-switch ${currentCaption.enabled ? 'active' : ''}`}
            onClick={() => updateCaption({ enabled: !currentCaption.enabled })}
          >
            <div className="caption-toggle-thumb" />
          </div>
        </div>
      </div>

      <div className={`caption-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="caption-inner">
          <div className="caption-section">
            <div className="caption-section-title">
              <Type size={12} />
              Caption Text
            </div>
            <textarea
              className="caption-textarea"
              placeholder="Enter your caption text here..."
              value={currentCaption.text}
              onChange={(e) => updateCaption({ text: e.target.value })}
            />
          </div>

          <div className="caption-section">
            <div className="caption-section-title">
              <Palette size={12} />
              Text Style
            </div>
            <div className="caption-format-grid">
              <div className="caption-input-group">
                <label className="caption-input-label">Font Family</label>
                <select
                  className="caption-select"
                  value={currentCaption.format.fontFamily}
                  onChange={(e) => updateFormat({ fontFamily: e.target.value })}
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
              <div className="caption-input-group">
                <label className="caption-input-label">Font Size: {currentCaption.format.fontSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={currentCaption.format.fontSize}
                  onChange={(e) => updateFormat({ fontSize: Number(e.target.value) })}
                  className="caption-slider"
                />
              </div>
              <div className="caption-input-group">
                <label className="caption-input-label">Text Color</label>
                <div className="caption-color-input">
                  <input
                    type="color"
                    value={currentCaption.format.color}
                    onChange={(e) => updateFormat({ color: e.target.value })}
                    className="caption-color-picker"
                  />
                  <span className="caption-color-value">{currentCaption.format.color}</span>
                </div>
              </div>
              <div className="caption-input-group">
                <label className="caption-input-label">Background Color</label>
                <div className="caption-color-input">
                  <input
                    type="color"
                    value={currentCaption.format.backgroundColor}
                    onChange={(e) => updateFormat({ backgroundColor: e.target.value })}
                    className="caption-color-picker"
                  />
                  <span className="caption-color-value">{currentCaption.format.backgroundColor}</span>
                </div>
              </div>
            </div>
            <div className="caption-style-toggles">
              <button
                className={`caption-style-toggle ${currentCaption.format.bold ? 'active' : ''}`}
                onClick={() => updateFormat({ bold: !currentCaption.format.bold })}
              >
                <strong>Bold</strong>
              </button>
              <button
                className={`caption-style-toggle ${currentCaption.format.italic ? 'active' : ''}`}
                onClick={() => updateFormat({ italic: !currentCaption.format.italic })}
              >
                <em>Italic</em>
              </button>
            </div>
            <div className="caption-input-group">
              <label className="caption-input-label">Background Opacity: {currentCaption.format.backgroundOpacity}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={currentCaption.format.backgroundOpacity}
                onChange={(e) => updateFormat({ backgroundOpacity: Number(e.target.value) })}
                className="caption-slider"
              />
            </div>
          </div>

          <div className="caption-section">
            <div className="caption-section-title">
              <Move size={12} />
              Position
            </div>
            <div className="caption-button-group">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  className={`caption-button ${currentCaption.position === pos.value ? 'active' : ''}`}
                  onClick={() => updateCaption({ position: pos.value })}
                >
                  <pos.icon size={14} />
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="caption-section">
            <div className="caption-section-title">
              <Sparkles size={12} />
              Animation
            </div>
            <div className="caption-button-group">
              {ANIMATIONS.slice(0, 3).map((anim) => (
                <button
                  key={anim.value}
                  className={`caption-button ${currentCaption.animation === anim.value ? 'active' : ''}`}
                  onClick={() => updateCaption({ animation: anim.value })}
                >
                  {anim.label}
                </button>
              ))}
            </div>
            <div className="caption-button-group">
              {ANIMATIONS.slice(3).map((anim) => (
                <button
                  key={anim.value}
                  className={`caption-button ${currentCaption.animation === anim.value ? 'active' : ''}`}
                  onClick={() => updateCaption({ animation: anim.value })}
                >
                  {anim.label}
                </button>
              ))}
            </div>
          </div>

          {currentCaption.text && (
            <div className="caption-section">
              <div className="caption-section-title">
                <Sparkles size={12} />
                Preview
              </div>
              <div className="caption-preview">
                <div
                  className="caption-preview-text"
                  style={{
                    fontFamily: currentCaption.format.fontFamily,
                    fontSize: `${currentCaption.format.fontSize}px`,
                    color: currentCaption.format.color,
                    fontWeight: currentCaption.format.bold ? 'bold' : 'normal',
                    fontStyle: currentCaption.format.italic ? 'italic' : 'normal',
                    backgroundColor: `${currentCaption.format.backgroundColor}${Math.round((currentCaption.format.backgroundOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
                  }}
                >
                  {currentCaption.text}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
