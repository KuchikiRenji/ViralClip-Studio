import { useState } from 'react';
import { Zap, Gauge, TrendingUp, Heart } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { VOICE_OPTIONS } from './constants';
interface TextToSpeechTabProps {
  textToSpeak: string;
  selectedVoice: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
  canGenerate: boolean;
  onTextChange: (text: string) => void;
  onVoiceChange: (voiceId: string) => void;
  onEmotionChange?: (emotion: string) => void;
  onSpeedChange?: (speed: number) => void;
  onPitchChange?: (pitch: number) => void;
  onGenerate: () => void;
}
export const TextToSpeechTab = ({
  textToSpeak,
  selectedVoice,
  emotion = 'neutral',
  speed = 1,
  pitch = 1,
  canGenerate,
  onTextChange,
  onVoiceChange,
  onEmotionChange,
  onSpeedChange,
  onPitchChange,
  onGenerate,
}) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto">
      <textarea
        value={textToSpeak}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={t('voiceClone.writeThoughts')}
        className="w-full h-40 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none transition-colors"
      />
      <div className="mt-6 space-y-4">
        {}
        <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Heart size={16} />
            {t('voiceClone.voiceSelection')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{t('voiceClone.selectVoice')}</span>
              <select
                value={selectedVoice}
                onChange={(e) => onVoiceChange(e.target.value)}
                className="px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 min-w-[200px]"
              >
                <option value="">{t('voiceClone.selectVoice')}</option>
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {}
        <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Gauge size={16} />
            {t('voiceClone.voiceControls')}
          </h3>
          <div className="space-y-4">
            {}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t('voiceClone.emotion')}</span>
                <span className="text-xs text-zinc-500 capitalize">{emotion}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'neutral', label: 'Neutral' },
                  { id: 'excited', label: 'Excited' },
                  { id: 'calm', label: 'Calm' },
                  { id: 'confident', label: 'Confident' },
                  { id: 'friendly', label: 'Friendly' },
                  { id: 'serious', label: 'Serious' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => onEmotionChange?.(id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      emotion === id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t('voiceClone.speed')}</span>
                <span className="text-xs text-zinc-500">{speed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={speed}
                onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-zinc-600">
                <span>0.5x</span>
                <span>1x</span>
                <span>2x</span>
              </div>
            </div>
            {}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{t('voiceClone.pitch')}</span>
                <span className="text-xs text-zinc-500">{pitch}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => onPitchChange?.(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
        {}
        <div className="p-3 bg-zinc-900/30 rounded-lg border border-white/5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">{t('voiceClone.characters')}:</span>
            <span className="text-white">{textToSpeak.length}/10,000</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-zinc-400">{t('voiceClone.words')}:</span>
            <span className="text-white">{textToSpeak.split(/\s+/).filter(word => word.length > 0).length}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            canGenerate
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
          type="button"
        >
          <Zap size={16} />
          {t('voiceClone.generateVoice')}
        </button>
      </div>
    </div>
  );
};