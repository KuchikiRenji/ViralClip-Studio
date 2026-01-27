import { useState } from 'react';
import { Sparkles, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { AIProvider, AIGenerationOptions, validateAPIConfig, estimateTokens, estimateCost } from './aiGenerationUtils';

interface AIGenerationPanelProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: (options: AIGenerationOptions) => void;
  isGenerating: boolean;
}

export const AIGenerationPanel = ({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
}) => {
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [temperature, setTemperature] = useState(0.8);
  const [maxMessages, setMaxMessages] = useState(8);
  const [conversationStyle, setConversationStyle] = useState<'casual' | 'formal' | 'funny' | 'dramatic' | 'romantic'>('casual');
  const [messageLength, setMessageLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const apiValidation = validateAPIConfig(provider);
  const estimatedTokens = estimateTokens(prompt);
  const estimatedCost = estimateCost(provider, estimatedTokens);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    onGenerate({
      prompt,
      provider,
      temperature,
      maxMessages,
      conversationStyle,
      messageLength,
    });
  };

  return (
    <div className="ai-generation-panel">
      <style>{`
        .ai-generation-panel {
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 1px solid rgba(168, 85, 247, 0.2);
          border-radius: 20px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .ai-panel-header {
          padding: 24px;
          background: linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, transparent 100%);
          border-bottom: 1px solid rgba(168, 85, 247, 0.2);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ai-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.4);
        }

        .ai-title {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .ai-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .ai-panel-body {
          padding: 24px;
        }

        .ai-section {
          margin-bottom: 24px;
        }

        .ai-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 12px;
        }

        .ai-textarea {
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

        .ai-textarea:focus {
          outline: none;
          border-color: rgba(168, 85, 247, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }

        .ai-textarea::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .ai-provider-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .ai-provider-btn {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .ai-provider-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(168, 85, 247, 0.3);
        }

        .ai-provider-btn.active {
          background: rgba(168, 85, 247, 0.15);
          border-color: #a855f7;
          color: #a855f7;
        }

        .ai-style-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .ai-style-btn {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ai-style-btn:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .ai-style-btn.active {
          background: rgba(168, 85, 247, 0.15);
          border-color: #a855f7;
          color: #a855f7;
        }

        .ai-slider-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ai-slider-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }

        .ai-slider {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
        }

        .ai-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(168, 85, 247, 0.4);
        }

        .ai-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(168, 85, 247, 0.4);
        }

        .ai-alert {
          padding: 12px 16px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 12px;
          color: #fbbf24;
          font-size: 12px;
          display: flex;
          align-items: start;
          gap: 10px;
          margin-bottom: 16px;
        }

        .ai-stats {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          margin-top: 16px;
        }

        .ai-stat {
          flex: 1;
          text-align: center;
        }

        .ai-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #a855f7;
          margin-bottom: 4px;
        }

        .ai-stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-generate-btn {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
          border: none;
          border-radius: 14px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(168, 85, 247, 0.3);
        }

        .ai-generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(168, 85, 247, 0.4);
        }

        .ai-generate-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .ai-generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ai-advanced-toggle {
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #a855f7;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 auto;
        }

        .ai-advanced-toggle:hover {
          color: #c084fc;
        }

        .ai-advanced-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .ai-advanced-content.open {
          max-height: 600px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div className="ai-panel-header">
        <div className="ai-icon">
          <Sparkles size={28} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="ai-title">AI Script Generator</div>
          <div className="ai-subtitle">Generate realistic conversations with AI</div>
        </div>
      </div>

      <div className="ai-panel-body">
        {!apiValidation.valid && (
          <div className="ai-alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>API Not Configured</div>
              {apiValidation.error}. Will use fallback generation.
            </div>
          </div>
        )}

        <div className="ai-section">
          <label className="ai-label">Describe your conversation</label>
          <textarea
            className="ai-textarea"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Example: A funny conversation about someone finding out they won the lottery..."
            disabled={isGenerating}
          />
        </div>

        <div className="ai-section">
          <label className="ai-label">AI Provider</label>
          <div className="ai-provider-grid">
            <button
              className={`ai-provider-btn ${provider === 'openai' ? 'active' : ''}`}
              onClick={() => setProvider('openai')}
              disabled={isGenerating}
              type="button"
            >
              <Zap size={20} />
              <span>OpenAI</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>GPT-4o Mini</span>
            </button>
            <button
              className={`ai-provider-btn ${provider === 'anthropic' ? 'active' : ''}`}
              onClick={() => setProvider('anthropic')}
              disabled={isGenerating}
              type="button"
            >
              <Sparkles size={20} />
              <span>Claude</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>Sonnet 3.5</span>
            </button>
            <button
              className={`ai-provider-btn ${provider === 'local' ? 'active' : ''}`}
              onClick={() => setProvider('local')}
              disabled={isGenerating}
              type="button"
            >
              <span style={{ fontSize: 20 }}>💾</span>
              <span>Local</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>Templates</span>
            </button>
          </div>
        </div>

        <div className="ai-section">
          <label className="ai-label">Conversation Style</label>
          <div className="ai-style-grid">
            {(['casual', 'formal', 'funny', 'dramatic', 'romantic'] as const).map((style) => (
              <button
                key={style}
                className={`ai-style-btn ${conversationStyle === style ? 'active' : ''}`}
                onClick={() => setConversationStyle(style)}
                disabled={isGenerating}
                type="button"
              >
                {style === 'casual' && '💬'} {style === 'formal' && '👔'}
                {style === 'funny' && '😂'} {style === 'dramatic' && '🎭'}
                {style === 'romantic' && '💕'} {style.charAt(0).toUpperCase() + style.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          className="ai-advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          type="button"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Settings
        </button>

        <div className={`ai-advanced-content ${showAdvanced ? 'open' : ''}`}>
          <div className="ai-section">
            <div className="ai-slider-container">
              <div className="ai-slider-label">
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Temperature</span>
                <span style={{ color: '#a855f7', fontWeight: 700 }}>{temperature.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="ai-slider"
                disabled={isGenerating}
              />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                Lower = more focused, Higher = more creative
              </span>
            </div>
          </div>

          <div className="ai-section">
            <div className="ai-slider-container">
              <div className="ai-slider-label">
                <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Max Messages</span>
                <span style={{ color: '#a855f7', fontWeight: 700 }}>{maxMessages}</span>
              </div>
              <input
                type="range"
                min="4"
                max="20"
                step="1"
                value={maxMessages}
                onChange={(e) => setMaxMessages(Number(e.target.value))}
                className="ai-slider"
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="ai-section">
            <label className="ai-label">Message Length</label>
            <div className="ai-style-grid">
              {(['short', 'medium', 'long'] as const).map((length) => (
                <button
                  key={length}
                  className={`ai-style-btn ${messageLength === length ? 'active' : ''}`}
                  onClick={() => setMessageLength(length)}
                  disabled={isGenerating}
                  type="button"
                >
                  {length.charAt(0).toUpperCase() + length.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {provider !== 'local' && (
          <div className="ai-stats">
            <div className="ai-stat">
              <div className="ai-stat-value">{estimatedTokens}</div>
              <div className="ai-stat-label">Est. Tokens</div>
            </div>
            <div className="ai-stat">
              <div className="ai-stat-value">${estimatedCost.toFixed(4)}</div>
              <div className="ai-stat-label">Est. Cost</div>
            </div>
          </div>
        )}

        <div className="ai-section" style={{ marginTop: 24, marginBottom: 0 }}>
          <button
            className="ai-generate-btn"
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            type="button"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Conversation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
