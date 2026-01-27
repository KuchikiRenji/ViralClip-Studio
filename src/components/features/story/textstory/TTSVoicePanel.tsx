import { useState, useEffect } from 'react';
import { Volume2, Play, Square, Mic, Sparkles, AlertCircle } from 'lucide-react';
import {
  TTSProvider,
  TTSVoice,
  getVoicesForProvider,
  validateTTSConfig,
  generateSpeech,
  estimateTTSCost,
} from './ttsUtils';

interface TTSVoicePanelProps {
  leftVoice: string;
  rightVoice: string;
  onLeftVoiceChange: (voiceId: string) => void;
  onRightVoiceChange: (voiceId: string) => void;
  sampleText?: string;
}

export const TTSVoicePanel = ({
  leftVoice,
  rightVoice,
  onLeftVoiceChange,
  onRightVoiceChange,
  sampleText = 'Hello! This is a voice preview for your text story.',
}) => {
  const [provider, setProvider] = useState<TTSProvider>('openai');
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  const apiValidation = validateTTSConfig(provider);
  const estimatedCost = estimateTTSCost(provider, sampleText);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = getVoicesForProvider(provider);
      setVoices(availableVoices);
    };

    loadVoices();

    if (provider === 'browser' && 'speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [provider]);

  const handlePreviewVoice = async (voiceId: string) => {
    if (previewingVoice) {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = '';
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
      setPreviewingVoice(null);
      setPreviewAudio(null);
      return;
    }

    setPreviewingVoice(voiceId);

    try {
      const result = await generateSpeech({
        text: sampleText,
        voiceId,
        provider,
      });

      if (result.error) {
        setPreviewingVoice(null);
        return;
      }

      if (result.audioUrl) {
        const audio = new Audio(result.audioUrl);
        audio.onended = () => {
          setPreviewingVoice(null);
          setPreviewAudio(null);
        };
        audio.onerror = () => {
          setPreviewingVoice(null);
          setPreviewAudio(null);
        };
        audio.play();
        setPreviewAudio(audio);
      } else {
        setTimeout(() => {
          setPreviewingVoice(null);
        }, sampleText.split(' ').length * 600);
      }
    } catch {
      setPreviewingVoice(null);
    }
  };


  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = '';
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, [previewAudio]);

  return (
    <div className="tts-voice-panel">
      <style>{`
        .tts-voice-panel {
          background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .tts-panel-header {
          padding: 24px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, transparent 100%);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .tts-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .tts-title {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .tts-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .tts-panel-body {
          padding: 24px;
        }

        .tts-section {
          margin-bottom: 24px;
        }

        .tts-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 12px;
        }

        .tts-provider-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .tts-provider-btn {
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

        .tts-provider-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .tts-provider-btn.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .tts-alert {
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

        .tts-voice-section {
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 2px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .tts-voice-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .tts-voice-section-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tts-voice-badge {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }

        .tts-voice-badge.left {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .tts-voice-badge.right {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        .tts-voice-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
        }

        .tts-voice-card {
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .tts-voice-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .tts-voice-card.selected {
          background: rgba(59, 130, 246, 0.15);
          border-color: #3b82f6;
        }

        .tts-voice-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
        }

        .tts-voice-meta {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .tts-voice-preview-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          background: rgba(59, 130, 246, 0.2);
          border: none;
          border-radius: 8px;
          color: #3b82f6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .tts-voice-preview-btn:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .tts-voice-preview-btn.playing {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .tts-stats {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }

        .tts-stat {
          flex: 1;
          text-align: center;
        }

        .tts-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .tts-stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .animate-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="tts-panel-header">
        <div className="tts-icon">
          <Volume2 size={28} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="tts-title">Voice Selection</div>
          <div className="tts-subtitle">Choose AI voices for your conversation</div>
        </div>
      </div>

      <div className="tts-panel-body">
        {!apiValidation.valid && (
          <div className="tts-alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>API Not Configured</div>
              {apiValidation.error}. Will use browser voices.
            </div>
          </div>
        )}

        <div className="tts-section">
          <label className="tts-label">TTS Provider</label>
          <div className="tts-provider-grid">
            <button
              className={`tts-provider-btn ${provider === 'elevenlabs' ? 'active' : ''}`}
              onClick={() => setProvider('elevenlabs')}
              type="button"
            >
              <Sparkles size={20} />
              <span>ElevenLabs</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>Premium</span>
            </button>
            <button
              className={`tts-provider-btn ${provider === 'openai' ? 'active' : ''}`}
              onClick={() => setProvider('openai')}
              type="button"
            >
              <Mic size={20} />
              <span>OpenAI</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>Fast</span>
            </button>
            <button
              className={`tts-provider-btn ${provider === 'browser' ? 'active' : ''}`}
              onClick={() => setProvider('browser')}
              type="button"
            >
              <span style={{ fontSize: 20 }}>🌐</span>
              <span>Browser</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>Free</span>
            </button>
          </div>
        </div>

        <div className="tts-voice-section">
          <div className="tts-voice-section-header">
            <div className="tts-voice-section-title">
              <Mic size={18} />
              Left Bubbles (Contact)
            </div>
            <div className="tts-voice-badge left">Contact Voice</div>
          </div>
          <div className="tts-voice-grid">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={`tts-voice-card ${leftVoice === voice.id ? 'selected' : ''}`}
                onClick={() => onLeftVoiceChange(voice.id)}
              >
                <button
                  className={`tts-voice-preview-btn ${previewingVoice === voice.id ? 'playing animate-pulse' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice.id);
                  }}
                  type="button"
                >
                  {previewingVoice === voice.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
                <div className="tts-voice-name">{voice.name}</div>
                <div className="tts-voice-meta">
                  {voice.gender && <span>{voice.gender}</span>}
                  {voice.gender && voice.accent && <span> · </span>}
                  {voice.accent && <span>{voice.accent}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="tts-voice-section">
          <div className="tts-voice-section-header">
            <div className="tts-voice-section-title">
              <Mic size={18} />
              Right Bubbles (You)
            </div>
            <div className="tts-voice-badge right">Your Voice</div>
          </div>
          <div className="tts-voice-grid">
            {voices.map((voice) => (
              <div
                key={voice.id}
                className={`tts-voice-card ${rightVoice === voice.id ? 'selected' : ''}`}
                onClick={() => onRightVoiceChange(voice.id)}
              >
                <button
                  className={`tts-voice-preview-btn ${previewingVoice === voice.id ? 'playing animate-pulse' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice.id);
                  }}
                  type="button"
                >
                  {previewingVoice === voice.id ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                </button>
                <div className="tts-voice-name">{voice.name}</div>
                <div className="tts-voice-meta">
                  {voice.gender && <span>{voice.gender}</span>}
                  {voice.gender && voice.accent && <span> · </span>}
                  {voice.accent && <span>{voice.accent}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {provider !== 'browser' && (
          <div className="tts-stats">
            <div className="tts-stat">
              <div className="tts-stat-value">${estimatedCost.toFixed(4)}</div>
              <div className="tts-stat-label">Est. Cost/Msg</div>
            </div>
            <div className="tts-stat">
              <div className="tts-stat-value">{voices.length}</div>
              <div className="tts-stat-label">Available Voices</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
