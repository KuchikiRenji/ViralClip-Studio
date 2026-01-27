import { Sparkles } from 'lucide-react';
import { RichTextToolbar } from './RichTextToolbar';
import { VideoItem } from './VideoItem';
import { BackgroundMusicPanel } from './BackgroundMusicPanel';
import { TransitionSelector } from './TransitionSelector';
import { RankingGraphics } from './RankingGraphics';
import { OverlayManager } from './OverlayManager';
import { TemplateManager } from './TemplateManager';
import { ProjectManager } from './ProjectManager';
import { RankingConfig, VideoSource, RichTextFormat } from './types';
import { useTranslation } from '../../../hooks/useTranslation';

interface RankingConfigProps {
  config: RankingConfig;
  textFormat: RichTextFormat;
  onConfigChange: (config: Partial<RankingConfig>) => void;
  onTextFormatChange: (format: Partial<RichTextFormat>) => void;
  onTitleChange: (title: string) => void;
  onVideoUpdate: (id: string, updates: Partial<VideoSource>) => void;
  onVideoMoveUp: (id: string) => void;
  onVideoMoveDown: (id: string) => void;
  onVideoDelete: (id: string) => void;
  onAddVideo: () => void;
  onGenerate: () => void;
}
export const RankingConfigPanel = ({
  config,
  textFormat,
  onConfigChange,
  onTextFormatChange,
  onTitleChange,
  onVideoUpdate,
  onVideoMoveUp,
  onVideoMoveDown,
  onVideoDelete,
  onAddVideo,
  onGenerate,
}: RankingConfigProps) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 min-[375px]:space-y-6 sm:space-y-8 pb-safe relative max-w-full overflow-hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(var(--color-brand-primary-rgb))]/2 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 min-[375px]:gap-4 mb-4 min-[375px]:mb-6">
          <div className="w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 rounded-xl bg-gradient-to-br from-[rgb(var(--color-brand-primary-rgb))] to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-xs min-[375px]:text-sm leading-none">📝</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base min-[375px]:text-lg font-bold text-white mb-0.5 min-[375px]:mb-1 break-words">{t('videoRanking.config.title')}</h2>
            <p className="text-[10px] min-[375px]:text-xs text-blue-300/80 break-words">{t('videoRanking.config.titleHint')}</p>
          </div>
        </div>
        <RichTextToolbar format={textFormat} onFormatChange={onTextFormatChange} />
        <div className="relative group">
        <textarea
          value={config.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('videoRanking.config.titlePlaceholder')}
            className="w-full h-24 px-5 py-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-[rgb(var(--color-brand-primary-rgb))]/20 rounded-2xl text-white placeholder-blue-300/50 focus:outline-none focus:border-[rgb(var(--color-brand-primary-rgb))]/60 focus:ring-2 focus:ring-[rgb(var(--color-brand-primary-rgb))]/20 transition-all duration-300 resize-none shadow-lg group-hover:shadow-[rgb(var(--color-brand-primary-rgb))]/10"
          style={{
            fontFamily: textFormat.fontFamily,
            fontWeight: textFormat.bold ? 'bold' : 'normal',
            fontStyle: textFormat.italic ? 'italic' : 'normal',
            color: textFormat.color,
            textAlign: textFormat.alignment,
          }}
        />
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--color-brand-primary-rgb))]/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white">{t('videoRanking.config.enableTitleDrag')}</label>
        <button
          onClick={() => onConfigChange({ enableTitleDrag: !config.enableTitleDrag })}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            config.enableTitleDrag ? 'bg-blue-600' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              config.enableTitleDrag ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">{t('videoRanking.config.titleStroke')}</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="10"
            value={config.titleStroke}
            onChange={(e) => onConfigChange({ titleStroke: Number(e.target.value) })}
            className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs text-white bg-zinc-800 px-2 py-1 rounded min-w-[40px] text-center">
            {config.titleStroke}px
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.titleStrokeColor}
              onChange={(e) => onConfigChange({ titleStrokeColor: e.target.value })}
              className="w-8 h-8 bg-transparent border border-white/10 rounded cursor-pointer"
            />
            <span className="text-xs text-white bg-zinc-800 px-2 py-1 rounded font-mono">
              {config.titleStrokeColor}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-white">{t('videoRanking.config.videoHeight')}</label>
          <span className="text-xs text-gray-500">{t('videoRanking.config.videoHeightHint')}</span>
        </div>
        <input
          type="number"
          value={config.videoHeight}
          onChange={(e) => onConfigChange({ videoHeight: Number(e.target.value) })}
          className="w-full px-3 py-2 bg-zinc-900 border border-white/5 rounded-lg text-blue-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">{t('videoRanking.config.background')}</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={config.background}
            onChange={(e) => onConfigChange({ background: e.target.value })}
            className="w-8 h-8 bg-transparent border border-white/10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={config.background}
            onChange={(e) => onConfigChange({ background: e.target.value })}
            className="flex-1 px-3 py-2 bg-zinc-900 border border-white/5 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-white">{t('videoRanking.config.captions')}</label>
        <button
          onClick={() => onConfigChange({ captionsEnabled: !config.captionsEnabled })}
          className={`w-12 h-6 rounded-full transition-colors relative ${
            config.captionsEnabled ? 'bg-blue-600' : 'bg-zinc-700'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              config.captionsEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-white">{t('videoRanking.config.videos')}</label>
        <div className="space-y-3">
          {config.videos.map((video, index) => (
            <VideoItem
              key={video.id}
              video={video}
              index={index}
              onUpdate={onVideoUpdate}
              onMoveUp={onVideoMoveUp}
              onMoveDown={onVideoMoveDown}
              onDelete={onVideoDelete}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (config.videos.length < 5) {
              onAddVideo();
            }
          }}
          disabled={config.videos.length >= 5}
          style={{
            pointerEvents: config.videos.length >= 5 ? 'none' : 'auto',
            position: 'relative',
            zIndex: 10,
          }}
          className={`w-full py-3 px-4 border rounded-lg text-sm font-medium transition-all duration-200 ${
            config.videos.length >= 5
              ? 'bg-zinc-800/30 border-white/5 text-zinc-500 cursor-not-allowed opacity-50'
              : 'bg-zinc-800/50 hover:bg-zinc-700/50 active:bg-zinc-600/50 border-white/5 text-white cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md'
          }`}
          aria-label={config.videos.length >= 5 ? 'Maximum 5 videos reached' : `Add another video (${config.videos.length}/5)`}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg">+</span>
            <span>{t('videoRanking.config.addMore')}</span>
            {config.videos.length > 0 && (
              <span className="text-xs opacity-70">({config.videos.length}/5)</span>
            )}
            {config.videos.length >= 5 && (
              <span className="text-xs ml-1">- Max reached</span>
            )}
          </span>
        </button>
      </div>
      <div className="space-y-2">
        <TransitionSelector
          settings={config.transitionSettings}
          onChange={(settings) => onConfigChange({ transitionSettings: settings })}
        />
      </div>

      <div className="space-y-2">
        <BackgroundMusicPanel
          music={config.backgroundMusic}
          onChange={(music) => onConfigChange({ backgroundMusic: music })}
        />
      </div>

      <div className="space-y-2">
        <RankingGraphics
          graphic={config.rankingGraphic}
          onChange={(graphic) => onConfigChange({ rankingGraphic: graphic })}
        />
      </div>

      <div className="space-y-2">
        <OverlayManager
          overlays={config.overlays || []}
          onChange={(overlays) => onConfigChange({ overlays })}
        />
      </div>

      <div className="space-y-2">
        <TemplateManager
          currentConfig={config}
          onLoadTemplate={(templateConfig) => onConfigChange(templateConfig)}
        />
      </div>

      <div className="space-y-2">
        <ProjectManager
          currentConfig={config}
          onLoadProject={(projectConfig) => onConfigChange(projectConfig)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-white">{t('videoRanking.config.exportQuality')}</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: '720p' as const, labelKey: 'videoRanking.config.quality720' },
            { id: '1080p' as const, labelKey: 'videoRanking.config.quality1080' },
            { id: '4k' as const, labelKey: 'videoRanking.config.quality4k' },
          ].map(({ id, labelKey }) => (
            <button
              key={id}
              onClick={() =>
                onConfigChange({
                  exportSettings: { ...config.exportSettings, quality: id },
                })
              }
              className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                config.exportSettings.quality === id
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:border-white/10'
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onGenerate}
        className="w-full py-4 min-h-[56px] bg-gradient-to-r from-[rgb(var(--color-brand-primary-rgb))] via-blue-500 to-blue-600 hover:from-blue-400 hover:via-blue-500 hover:to-blue-400 active:from-blue-600 active:via-blue-700 active:to-blue-600 rounded-2xl text-white text-sm sm:text-base font-bold transition-all duration-300 flex items-center justify-center gap-3 touch-target touch-manipulation active:scale-[0.95] shadow-lg shadow-[rgb(var(--color-brand-primary-rgb))]/25 hover:shadow-xl hover:shadow-[rgb(var(--color-brand-primary-rgb))]/30 border border-[rgb(var(--color-brand-primary-rgb))]/20 relative overflow-hidden group"
        type="button"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        <Sparkles size={20} className="animate-pulse" />
        <span className="relative z-10 tracking-wide">{t('videoRanking.config.generate')}</span>
      </button>
    </div>
  );
};