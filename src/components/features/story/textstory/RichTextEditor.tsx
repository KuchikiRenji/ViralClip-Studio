import { useState, useRef } from 'react';
import { Bold, Italic, Type, Palette, Smile, Sparkles } from 'lucide-react';
import { Message } from './types';

interface RichTextEditorProps {
  message: Message;
  onUpdate: (updates: Partial<Message>) => void;
}

interface TextStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
}

const FONT_FAMILIES = [
  { id: 'Inter', name: 'Inter' },
  { id: 'Arial', name: 'Arial' },
  { id: 'Helvetica', name: 'Helvetica' },
  { id: 'Times New Roman', name: 'Times' },
  { id: 'Courier New', name: 'Courier' },
  { id: 'Georgia', name: 'Georgia' },
  { id: 'Comic Sans MS', name: 'Comic Sans' },
  { id: 'Impact', name: 'Impact' },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48];

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
  'Objects': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌'],
};

const TEXT_COLORS = [
  '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#8800ff',
];

const BG_COLORS = [
  'transparent', '#000000', '#ffffff', '#ff0000', '#00ff00',
  '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#333333',
];

export const RichTextEditor = ({
  message,
  onUpdate,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Smileys');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [textStyle, setTextStyle] = useState<TextStyle>({
    bold: false,
    italic: false,
    underline: false,
    color: '#ffffff',
    backgroundColor: 'transparent',
    fontSize: 14,
    fontFamily: 'Inter',
  });

  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const text = message.content;
      const newText = text.substring(0, start) + emoji + text.substring(end);

      onUpdate({ content: newText });

      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + emoji.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const toggleStyle = (style: keyof Pick<TextStyle, 'bold' | 'italic' | 'underline'>) => {
    setTextStyle(prev => ({ ...prev, [style]: !prev[style] }));
  };

  const updateColor = (color: string) => {
    setTextStyle(prev => ({ ...prev, color }));
  };

  const updateBackgroundColor = (backgroundColor: string) => {
    setTextStyle(prev => ({ ...prev, backgroundColor }));
  };

  const updateFontSize = (fontSize: number) => {
    setTextStyle(prev => ({ ...prev, fontSize }));
  };

  const updateFontFamily = (fontFamily: string) => {
    setTextStyle(prev => ({ ...prev, fontFamily }));
  };

  return (
    <div className="rich-text-editor">
      <style>{`
        .rich-text-editor {
          background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
          border: 2px solid rgba(236, 72, 153, 0.2);
          border-radius: 20px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .rte-header {
          padding: 16px 20px;
          background: linear-gradient(90deg, rgba(236, 72, 153, 0.15) 0%, transparent 100%);
          border-bottom: 1px solid rgba(236, 72, 153, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rte-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .rte-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .rte-btn {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }

        .rte-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(236, 72, 153, 0.4);
          color: #ffffff;
        }

        .rte-btn.active {
          background: rgba(236, 72, 153, 0.2);
          border-color: #ec4899;
          color: #ec4899;
        }

        .rte-body {
          padding: 20px;
        }

        .rte-textarea {
          width: 100%;
          min-height: 120px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          color: #ffffff;
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
          transition: all 0.2s ease;
        }

        .rte-textarea:focus {
          outline: none;
          border-color: rgba(236, 72, 153, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }

        .rte-formatting-panel {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 14px;
          margin-bottom: 16px;
        }

        .rte-section {
          margin-bottom: 16px;
        }

        .rte-section:last-child {
          margin-bottom: 0;
        }

        .rte-section-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 10px;
          display: block;
        }

        .rte-color-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 6px;
        }

        .rte-color-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .rte-color-btn:hover {
          transform: scale(1.1);
          border-color: rgba(236, 72, 153, 0.5);
        }

        .rte-color-btn.selected {
          border-color: #ec4899;
          box-shadow: 0 0 0 2px rgba(236, 72, 153, 0.3);
        }

        .rte-color-btn.selected::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          font-weight: bold;
          text-shadow: 0 0 4px rgba(0,0,0,0.8);
        }

        .rte-select {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #ffffff;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 120px;
        }

        .rte-select:focus {
          outline: none;
          border-color: rgba(236, 72, 153, 0.4);
        }

        .rte-emoji-picker {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: #1a1a1a;
          border: 2px solid rgba(236, 72, 153, 0.3);
          border-radius: 16px;
          padding: 16px;
          z-index: 100;
          max-height: 400px;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        }

        .rte-emoji-categories {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 12px;
        }

        .rte-emoji-category-btn {
          padding: 6px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rte-emoji-category-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .rte-emoji-category-btn.active {
          background: rgba(236, 72, 153, 0.2);
          color: #ec4899;
        }

        .rte-emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
        }

        .rte-emoji-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .rte-emoji-btn:hover {
          background: rgba(236, 72, 153, 0.1);
          border-color: #ec4899;
          transform: scale(1.1);
        }

        .rte-preview {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 2px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          min-height: 80px;
        }

        .rte-preview-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>

      <div className="rte-header">
        <div className="rte-title">
          <Sparkles size={18} color="#ec4899" />
          Rich Text Formatting
        </div>
        <div className="rte-toolbar">
          <button
            className={`rte-btn ${textStyle.bold ? 'active' : ''}`}
            onClick={() => toggleStyle('bold')}
            type="button"
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            className={`rte-btn ${textStyle.italic ? 'active' : ''}`}
            onClick={() => toggleStyle('italic')}
            type="button"
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            className={`rte-btn ${textStyle.underline ? 'active' : ''}`}
            onClick={() => toggleStyle('underline')}
            type="button"
            title="Underline"
          >
            <Type size={16} />
          </button>
          <button
            className={`rte-btn ${showFormatting ? 'active' : ''}`}
            onClick={() => setShowFormatting(!showFormatting)}
            type="button"
            title="Text Color"
          >
            <Palette size={16} />
          </button>
          <button
            className={`rte-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            type="button"
            title="Insert Emoji"
          >
            <Smile size={16} />
          </button>
        </div>
      </div>

      <div className="rte-body">
        {showFormatting && (
          <div className="rte-formatting-panel">
            <div className="rte-section">
              <label className="rte-section-label">Text Color</label>
              <div className="rte-color-grid">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`rte-color-btn ${textStyle.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color, border: color === '#ffffff' ? '2px solid #333' : undefined }}
                    onClick={() => updateColor(color)}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div className="rte-section">
              <label className="rte-section-label">Background Color</label>
              <div className="rte-color-grid">
                {BG_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`rte-color-btn ${textStyle.backgroundColor === color ? 'selected' : ''}`}
                    style={{
                      backgroundColor: color === 'transparent' ? '#000' : color,
                      border: color === '#ffffff' || color === 'transparent' ? '2px solid #333' : undefined,
                      backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%)' : undefined,
                      backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
                      backgroundPosition: color === 'transparent' ? '0 0, 4px 4px' : undefined,
                    }}
                    onClick={() => updateBackgroundColor(color)}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div className="rte-section">
              <label className="rte-section-label">Font Family</label>
              <select
                className="rte-select"
                value={textStyle.fontFamily}
                onChange={(e) => updateFontFamily(e.target.value)}
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </select>
            </div>

            <div className="rte-section">
              <label className="rte-section-label">Font Size</label>
              <select
                className="rte-select"
                value={textStyle.fontSize}
                onChange={(e) => updateFontSize(Number(e.target.value))}
              >
                {FONT_SIZES.map(size => (
                  <option key={size} value={size}>{size}px</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            className="rte-textarea"
            value={message.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            placeholder="Type your message..."
            style={{
              fontWeight: textStyle.bold ? 'bold' : 'normal',
              fontStyle: textStyle.italic ? 'italic' : 'normal',
              textDecoration: textStyle.underline ? 'underline' : 'none',
              color: textStyle.color,
              backgroundColor: textStyle.backgroundColor,
              fontSize: textStyle.fontSize,
              fontFamily: textStyle.fontFamily,
            }}
          />

          {showEmojiPicker && (
            <div className="rte-emoji-picker">
              <div className="rte-emoji-categories">
                {Object.keys(EMOJI_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    className={`rte-emoji-category-btn ${activeEmojiCategory === category ? 'active' : ''}`}
                    onClick={() => setActiveEmojiCategory(category as keyof typeof EMOJI_CATEGORIES)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="rte-emoji-grid">
                {EMOJI_CATEGORIES[activeEmojiCategory].map((emoji) => (
                  <button
                    key={emoji}
                    className="rte-emoji-btn"
                    onClick={() => insertEmoji(emoji)}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rte-preview" style={{ marginTop: 16 }}>
          <div className="rte-preview-label">Preview</div>
          <div
            style={{
              fontWeight: textStyle.bold ? 'bold' : 'normal',
              fontStyle: textStyle.italic ? 'italic' : 'normal',
              textDecoration: textStyle.underline ? 'underline' : 'none',
              color: textStyle.color,
              backgroundColor: textStyle.backgroundColor,
              fontSize: textStyle.fontSize,
              fontFamily: textStyle.fontFamily,
              padding: '8px 12px',
              borderRadius: '8px',
              display: 'inline-block',
            }}
          >
            {message.content || 'Type something to see preview...'}
          </div>
        </div>
      </div>
    </div>
  );
};
