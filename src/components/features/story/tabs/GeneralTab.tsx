import { Sparkles, RefreshCw } from 'lucide-react';
import type { StoryVideoState } from '../StoryVideoTypes';
import { SOCIAL_TYPES } from '../StoryVideoConstants';
import { useTranslation } from '../../../../hooks/useTranslation';
interface GeneralTabProps {
  state: StoryVideoState;
  updateState: <K extends keyof StoryVideoState>(key: K, value: StoryVideoState[K]) => void;
  generateAIScript: () => void;
}
export const GeneralTab = ({ state, updateState, generateAIScript }: GeneralTabProps) => {
  const { t } = useTranslation();
  const selectedSocial = SOCIAL_TYPES.find(s => s.id === state.socialType);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('storyVideo.general.socialWidgetTitle')}</h3>
        <div className="mb-4">
          <label className="block text-sm text-zinc-400 mb-2">{t('storyVideo.general.socialTypeLabel')}</label>
          <div className="flex gap-3">
            {SOCIAL_TYPES.map(social => {
              const IconComponent = social.icon;
              return (
                <button
                  key={social.id}
                  onClick={() => updateState('socialType', social.id)}
                  title={t(social.nameKey)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${social.color} ${
                    state.socialType === social.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-900 scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </button>
              );
            })}
          </div>
          {selectedSocial && (
            <p className="text-xs text-zinc-500 mt-2">{t('storyVideo.general.socialSelected', { name: t(selectedSocial.nameKey) })}</p>
          )}
        </div>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Sparkles size={14} className="text-purple-400" />
            {t('storyVideo.general.aiGenerator')}
          </label>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={state.aiPrompt}
            onChange={(e) => updateState('aiPrompt', e.target.value)}
            placeholder={t('storyVideo.general.promptPlaceholder')}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
          />
          <button 
            onClick={generateAIScript}
            disabled={state.isGeneratingScript || !state.aiPrompt.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {state.isGeneratingScript ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                {t('storyVideo.general.generating')}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {t('storyVideo.general.generateScript', { target: selectedSocial ? t(selectedSocial.nameKey) : '' })}
              </>
            )}
          </button>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">{t('storyVideo.general.scriptLabel')}</label>
          <span className="text-xs text-zinc-500">{t('storyVideo.general.characterCount', { count: state.script.length })}</span>
        </div>
        <textarea
          value={state.script}
          onChange={(e) => updateState('script', e.target.value)}
          placeholder={t('storyVideo.general.scriptPlaceholder')}
          className="w-full h-48 bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 resize-none custom-scrollbar"
        />
        <div className="mt-2 flex items-center justify-between text-sm">
          <div>
            <span className="text-zinc-500">{t('storyVideo.general.statusLabel')} </span>
            <span className={state.script.trim() ? 'text-emerald-400' : 'text-amber-400'}>
              {state.script.trim() ? t('storyVideo.general.statusReady') : t('storyVideo.general.statusWaiting')}
            </span>
          </div>
          {state.script.trim() && (
            <button 
              onClick={() => updateState('script', '')}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              {t('storyVideo.general.clear')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};