import { useRef, ChangeEvent } from 'react';
import { Upload, Sparkles, Check } from 'lucide-react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { RedditVideoState } from '../types';
import sharedStyles from '../RedditVideo.module.css';

interface ScriptTabProps {
  state: RedditVideoState;
  updateState: <K extends keyof RedditVideoState>(key: K, value: RedditVideoState[K]) => void;
  updateIntro: <K extends keyof RedditVideoState['intro']>(key: K, value: RedditVideoState['intro'][K]) => void;
  onGenerateAI: () => void;
}

export const ScriptTab = ({
  state,
  updateState,
  updateIntro,
  onGenerateAI,
}: ScriptTabProps) => {
  const { t } = useTranslation();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isValidRedditUrl = (value: string) => {
    if (!value.trim()) return false;
    try {
      const url = new URL(value);
      return url.hostname.endsWith('reddit.com') || url.hostname.endsWith('redd.it');
    } catch {
      return false;
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateIntro('avatarUrl', url);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${sharedStyles.panel} p-4 sm:p-6`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">
            {t('redditVideo.generateStory')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onGenerateAI}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 touch-target"
              type="button"
            >
              <Sparkles size={16} />
              {t('redditVideo.aiScript')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors border border-white/10 touch-target"
                type="button"
              >
                <Upload size={16} />
                {t('redditVideo.swapPfp')}
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={state.intro.username}
                  onChange={(e) => updateIntro('username', e.target.value)}
                  placeholder={t('redditVideo.usernamePlaceholder')}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="number"
                value={state.intro.likes}
                onChange={(e) => updateIntro('likes', parseInt(e.target.value) || 0)}
                placeholder="99"
                className="w-20 px-3 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target"
              />
              <input
                type="number"
                value={state.intro.comments}
                onChange={(e) => updateIntro('comments', parseInt(e.target.value) || 0)}
                placeholder="99"
                className="w-20 px-3 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target"
              />
            </div>

            <textarea
              value={state.intro.description}
              onChange={(e) => updateIntro('description', e.target.value)}
              placeholder={t('redditVideo.introDescPlaceholder')}
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => updateState('isDarkMode', !state.isDarkMode)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border touch-target ${
                  state.isDarkMode
                    ? 'bg-zinc-800 border-white/20 text-white'
                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                }`}
                type="button"
              >
                {t('redditVideo.darkMode')}
              </button>
              <button
                onClick={() => updateState('showIntroCard', !state.showIntroCard)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors border flex items-center justify-center gap-2 touch-target ${
                  state.showIntroCard
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                }`}
                type="button"
              >
                {t('redditVideo.showIntroCard')}
                {state.showIntroCard && <Check size={16} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateState('scriptSource', 'reddit')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors touch-target ${
                  state.scriptSource === 'reddit'
                    ? 'bg-zinc-800 border-white/20 text-white'
                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                }`}
                type="button"
              >
                Reddit URL
              </button>
              <button
                onClick={() => updateState('scriptSource', 'prompt')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors touch-target ${
                  state.scriptSource === 'prompt'
                    ? 'bg-zinc-800 border-white/20 text-white'
                    : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                }`}
                type="button"
              >
                Prompt
              </button>
            </div>

            {state.scriptSource === 'reddit' ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={state.redditUrl}
                  onChange={(e) => updateState('redditUrl', e.target.value)}
                  placeholder="https://www.reddit.com/r/.../comments/..."
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target"
                />
                {state.redditUrl.trim().length > 0 && !isValidRedditUrl(state.redditUrl) && (
                  <p className="text-xs text-amber-300/80">
                    Paste a valid Reddit link (reddit.com or redd.it)
                  </p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={state.storyTopic}
                onChange={(e) => updateState('storyTopic', e.target.value)}
                placeholder="Story topic"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target"
              />
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3">
                <select
                  value={state.language}
                  onChange={(e) => updateState('language', e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="it">🇮🇹 Italian</option>
                  <option value="pt">🇵🇹 Portuguese</option>
                  <option value="pl">🇵🇱 Polish</option>
                  <option value="nl">🇳🇱 Dutch</option>
                  <option value="ru">🇷🇺 Russian</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="zh">🇨🇳 Chinese</option>
                  <option value="ko">🇰🇷 Korean</option>
                </select>
              </div>
              {(['funny', 'serious', 'informative'] as const).map((tone) => (
                <button
                  key={tone}
                  onClick={() => updateState('tone', tone)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors touch-target ${
                    state.tone === tone
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  type="button"
                >
                  {tone}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {([45, 60, 90] as const).map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => updateState('lengthSeconds', seconds)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors touch-target ${
                    state.lengthSeconds === seconds
                      ? 'bg-zinc-800 border-white/20 text-white'
                      : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                  type="button"
                >
                  {seconds === 45 ? '45s' : seconds === 60 ? '1m' : '1m30s'}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={state.hook}
              onChange={(e) => updateState('hook', e.target.value)}
              placeholder="Hook (opening line)"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target"
            />

            <input
              type="text"
              value={state.cta}
              onChange={(e) => updateState('cta', e.target.value)}
              placeholder="CTA (ending)"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 touch-target"
            />
          </div>
        </div>

        <div className="mt-6">
          <textarea
            value={state.scriptContent}
            onChange={(e) => updateState('scriptContent', e.target.value)}
            placeholder={t('redditVideo.scriptPlaceholder')}
            rows={10}
            className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[200px]"
          />
        </div>
      </div>
    </div>
  );
};
