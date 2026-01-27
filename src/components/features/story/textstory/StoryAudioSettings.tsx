import { useState } from 'react';
import { Play, Square } from 'lucide-react';
import { TextStoryState } from './types';
import { VOICE_OPTIONS } from './constants';
import { TTSVoicePanel } from './TTSVoicePanel';
import { useTranslation } from '../../../../hooks/useTranslation';
interface StoryAudioSettingsProps {
  state: TextStoryState;
  updateState: <K extends keyof TextStoryState>(key: K, value: TextStoryState[K]) => void;
  onPreviewVoice?: (side: 'left' | 'right') => void;
}
export const StoryAudioSettings = ({
  state,
  updateState,
  onPreviewVoice,
}) => {
  const { t } = useTranslation();
  const [useAdvancedTTS, setUseAdvancedTTS] = useState(false);
  const sampleText = state.messages.find(m => m.content.trim())?.content || t('textStory.voicePreviewSample');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
        <div>
          <div className="text-sm font-semibold text-white">{t('textStory.advancedTTS')}</div>
          <div className="text-xs text-zinc-500 mt-1">{t('textStory.advancedTTSHint')}</div>
        </div>
        <button
          onClick={() => setUseAdvancedTTS(!useAdvancedTTS)}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            useAdvancedTTS ? 'bg-blue-600' : 'bg-zinc-700'
          }`}
          type="button"
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              useAdvancedTTS ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {useAdvancedTTS ? (
        <TTSVoicePanel
          leftVoice={state.leftVoice}
          rightVoice={state.rightVoice}
          onLeftVoiceChange={(voiceId) => updateState('leftVoice', voiceId)}
          onRightVoiceChange={(voiceId) => updateState('rightVoice', voiceId)}
          sampleText={sampleText}
        />
      ) : (
        <>
          <div>
        <label className="block text-sm text-zinc-400 mb-3">{t('textStory.leftBubblesVoice')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VOICE_OPTIONS.map(voice => (
            <button
              key={voice.id}
              onClick={() => updateState('leftVoice', voice.id)}
              className={`p-3 sm:p-4 rounded-xl border transition-all text-left ${
                state.leftVoice === voice.id
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
              }`}
              type="button"
            >
              <div className="font-medium text-white text-sm sm:text-base">{voice.name}</div>
              <div className="text-xs text-zinc-400 mt-1">{voice.gender} · {voice.accent}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-zinc-400 mb-3">{t('textStory.rightBubblesVoice')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {VOICE_OPTIONS.map(voice => (
            <button
              key={voice.id}
              onClick={() => updateState('rightVoice', voice.id)}
              className={`p-3 sm:p-4 rounded-xl border transition-all text-left ${
                state.rightVoice === voice.id
                  ? 'bg-emerald-600/20 border-emerald-500'
                  : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
              }`}
              type="button"
            >
              <div className="font-medium text-white text-sm sm:text-base">{voice.name}</div>
              <div className="text-xs text-zinc-400 mt-1">{voice.gender} · {voice.accent}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="text-sm font-medium mb-2">{t('textStory.voicePreviewTitle')}</div>
        <div className="flex gap-4">
          <button 
            onClick={() => onPreviewVoice?.('left')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              state.isPreviewingVoice ? 'bg-red-600 hover:bg-red-500' : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
            type="button"
          >
            {state.isPreviewingVoice ? <Square size={14} fill="white" /> : <Play size={14} fill="white" />}
            {state.isPreviewingVoice ? t('textStory.stop') : t('textStory.previewLeftVoice')}
          </button>
          <button 
            onClick={() => onPreviewVoice?.('right')}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              state.isPreviewingVoice ? 'bg-red-600 hover:bg-red-500' : 'bg-zinc-800 hover:bg-zinc-700'
            }`}
            type="button"
          >
            {state.isPreviewingVoice ? <Square size={14} fill="white" /> : <Play size={14} fill="white" />}
            {state.isPreviewingVoice ? t('textStory.stop') : t('textStory.previewRightVoice')}
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};







