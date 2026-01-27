import { Ban, ChevronDown } from 'lucide-react';
import type { StoryVideoState } from '../StoryVideoTypes';
import { SUBTITLE_TEMPLATES, FONT_OPTIONS } from '../StoryVideoConstants';
import { useTranslation } from '../../../../hooks/useTranslation';
interface SubtitlesTabProps {
  state: StoryVideoState;
  updateState: <K extends keyof StoryVideoState>(key: K, value: StoryVideoState[K]) => void;
}
export const SubtitlesTab = ({ state, updateState }: SubtitlesTabProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('storyVideo.subtitles.title')}</h3>
        <button
          onClick={() => updateState('subtitlesEnabled', !state.subtitlesEnabled)}
          className={`w-12 h-6 rounded-full transition-colors relative ${state.subtitlesEnabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.subtitlesEnabled ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
      {state.subtitlesEnabled && (
        <>
          <div>
            <label className="block text-sm text-zinc-400 mb-3">{t('storyVideo.subtitles.templateLabel')}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {SUBTITLE_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => updateState('selectedSubtitleTemplate', template.id)}
                  className={`h-16 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all ${
                    state.selectedSubtitleTemplate === template.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                  }`}
                  style={{
                    fontFamily: template.fontFamily,
                    color: template.color === 'rainbow' ? '#ff0000' : template.color === 'split' ? '#ffffff' : template.color,
                    textTransform: template.transform,
                    fontStyle: template.style,
                    fontWeight: template.weight,
                    textShadow: template.strokeWidth > 0 ? `${template.strokeWidth}px ${template.strokeWidth}px 0 ${template.strokeColor}` : 'none',
                    backgroundColor: template.bgColor !== 'transparent' ? template.bgColor : undefined,
                  }}
                >
                  {template.id === 'none' ? <Ban size={20} /> : t(`storyVideo.subtitles.template.${template.id}`)}
                </button>
              ))}
            </div>
            <button className="text-blue-400 text-sm mt-3 hover:text-blue-300">{t('storyVideo.subtitles.loadMore')}</button>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">{t('storyVideo.subtitles.settingsTitle')}</h4>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.enableDrag')}</label>
              <button
                onClick={() => updateState('enableSubtitleDrag', !state.enableSubtitleDrag)}
                className={`w-12 h-6 rounded-full transition-colors relative ${state.enableSubtitleDrag ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${state.enableSubtitleDrag ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.position')}</label>
              <div className="relative w-64">
                <select
                  value={state.subtitlePosition}
                  onChange={(e) => updateState('subtitlePosition', e.target.value as 'top' | 'center' | 'bottom')}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="top">{t('storyVideo.subtitles.positionTop')}</option>
                  <option value="center">{t('storyVideo.subtitles.positionCenter')}</option>
                  <option value="bottom">{t('storyVideo.subtitles.positionBottom')}</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.font')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={state.subtitleFont}
                    onChange={(e) => updateState('subtitleFont', e.target.value)}
                    className="w-48 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
                <button className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg font-bold">{t('storyVideo.subtitles.fontBold')}</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.fontColor')}</label>
              <div className="flex items-center gap-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={state.subtitleColor}
                  onChange={(e) => updateState('subtitleColor', e.target.value)}
                  className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={state.subtitleColor}
                  onChange={(e) => updateState('subtitleColor', e.target.value)}
                  className="flex-1 bg-transparent text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.fontSize')}</label>
              <div className="flex items-center gap-3 w-64">
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={state.subtitleSize}
                  onChange={(e) => updateState('subtitleSize', Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm text-zinc-400 w-12">{state.subtitleSize} px</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.strokeSize')}</label>
              <div className="flex items-center gap-3 w-64">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={state.strokeSize}
                  onChange={(e) => updateState('strokeSize', Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-sm text-zinc-400 w-12">{state.strokeSize} px</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.strokeColor')}</label>
              <div className="flex items-center gap-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={state.strokeColor}
                  onChange={(e) => updateState('strokeColor', e.target.value)}
                  className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={state.strokeColor}
                  onChange={(e) => updateState('strokeColor', e.target.value)}
                  className="flex-1 bg-transparent text-white focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400">{t('storyVideo.subtitles.bgColor')}</label>
              <div className="flex items-center gap-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
                <input
                  type="color"
                  value={state.subtitleBgColor}
                  onChange={(e) => updateState('subtitleBgColor', e.target.value)}
                  className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={state.subtitleBgColor}
                  onChange={(e) => updateState('subtitleBgColor', e.target.value)}
                  className="flex-1 bg-transparent text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};







