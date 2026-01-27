import {
  Download,
  Settings,
  Play,
  Smartphone,
  Monitor,
  Share2,
  CheckCircle,
  AlertCircle,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Music,
  X,
  RefreshCw,
} from 'lucide-react';
import { TemplateBuilderState, ExportFormat } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useTemplateBuilderExport } from './useTemplateBuilderExport';

interface ExportConfigurationProps {
  state: TemplateBuilderState;
  onUpdateState: (updates: Partial<TemplateBuilderState>) => void;
}

const EXPORT_FORMATS: {
  id: ExportFormat;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  recommended: boolean;
}[] = [
  {
    id: 'screen-recording',
    nameKey: 'templateBuilder.export.screenRecording',
    descriptionKey: 'templateBuilder.export.screenRecordingDesc',
    icon: <Smartphone size={20} />,
    recommended: true,
  },
  {
    id: 'first-person-pov',
    nameKey: 'templateBuilder.export.firstPersonPov',
    descriptionKey: 'templateBuilder.export.firstPersonPovDesc',
    icon: <Monitor size={20} />,
    recommended: false,
  },
  {
    id: 'clean-chat',
    nameKey: 'templateBuilder.export.cleanChat',
    descriptionKey: 'templateBuilder.export.cleanChatDesc',
    icon: <Share2 size={20} />,
    recommended: false,
  },
  {
    id: 'social-media',
    nameKey: 'templateBuilder.export.socialMedia',
    descriptionKey: 'templateBuilder.export.socialMediaDesc',
    icon: <Instagram size={20} />,
    recommended: false,
  },
];

const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: <Instagram size={16} />, color: 'bg-pink-500' },
  { id: 'tiktok', name: 'TikTok', icon: <span className="text-sm">🎵</span>, color: 'bg-black' },
  { id: 'youtube', name: 'YouTube', icon: <Youtube size={16} />, color: 'bg-red-500' },
  { id: 'twitter', name: 'Twitter/X', icon: <Twitter size={16} />, color: 'bg-blue-400' },
  { id: 'facebook', name: 'Facebook', icon: <Facebook size={16} />, color: 'bg-blue-600' },
];

export const ExportConfiguration = ({
  state,
  onUpdateState,
}) => {
  const { t } = useTranslation();
  const {
    isExporting,
    exportProgress,
    exportedBlob,
    exportError,
    handleExport,
    handleDownload,
    cancelExport,
    resetExport,
  } = useTemplateBuilderExport({ state });

  const calculateEstimatedDuration = (): number => {
    let total = 0;
    state.messages.forEach((message) => {
      const delay = message.delay || state.timingConfig.messageDelay;
      const typingDuration = (message.content.length / (message.typingSpeed || state.timingConfig.typingSpeed)) * 1000;
      const readDelay = state.timingConfig.readDelay;
      total += delay + typingDuration + readDelay;
    });
    return total;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];

    if (!state.selectedTemplate) {
      errors.push(t('templateBuilder.export.validation.selectTemplate'));
    }

    if (state.messages.length === 0) {
      errors.push(t('templateBuilder.export.validation.addMessage'));
    }

    if (state.messages.some(m => !m.content.trim() && m.type === 'text')) {
      errors.push(t('templateBuilder.export.validation.messageContent'));
    }

    return errors;
  };

  const validationErrors = getValidationErrors();
  const isReadyToExport = validationErrors.length === 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('templateBuilder.export.title')}</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          {t('templateBuilder.export.subtitle')}
        </p>
      </div>

      {exportError && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-red-400">{exportError}</span>
            </div>
            <button
              onClick={resetExport}
              className="text-red-400 hover:text-red-300"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {exportedBlob && !isExporting && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-green-400 font-medium">{t('templateBuilder.export.exportCompleted')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                type="button"
              >
                <Download size={16} />
                {t('templateBuilder.export.downloadButton')}
              </button>
              <button
                onClick={resetExport}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                type="button"
              >
                <RefreshCw size={16} />
                {t('templateBuilder.export.exportAgain')}
              </button>
            </div>
          </div>
        </div>
      )}

      {validationErrors.length > 0 && !exportedBlob && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-red-400" />
            <h3 className="text-red-400 font-medium">{t('templateBuilder.export.readyToExport')}</h3>
          </div>
          <ul className="text-sm text-red-300 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {isReadyToExport && !exportedBlob && !isExporting && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-green-400 font-medium">{t('templateBuilder.export.ready')}</span>
          </div>
        </div>
      )}

      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings size={20} />
          {t('templateBuilder.export.format')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EXPORT_FORMATS.map((format) => (
            <div
              key={format.id}
              onClick={() => onUpdateState({
                exportConfig: { ...state.exportConfig, format: format.id }
              })}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${
                state.exportConfig.format === format.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
              }`}
            >
              {format.recommended && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {t('templateBuilder.export.recommended')}
                </div>
              )}

              <div className="flex items-center gap-3 mb-2">
                {format.icon}
                <h4 className="font-medium">{t(format.nameKey)}</h4>
              </div>

              <p className="text-sm text-zinc-400">{t(format.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Music size={20} />
            {t('templateBuilder.export.audioSettings')}
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t('templateBuilder.export.typingSounds')}</label>
                <p className="text-xs text-zinc-400">{t('templateBuilder.export.typingSoundsDesc')}</p>
              </div>
              <button
                onClick={() => onUpdateState({
                  exportConfig: {
                    ...state.exportConfig,
                    includeTypingSounds: !state.exportConfig.includeTypingSounds
                  }
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  state.exportConfig.includeTypingSounds ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
                type="button"
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  state.exportConfig.includeTypingSounds ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t('templateBuilder.export.notificationSounds')}</label>
                <p className="text-xs text-zinc-400">{t('templateBuilder.export.notificationSoundsDesc')}</p>
              </div>
              <button
                onClick={() => onUpdateState({
                  exportConfig: {
                    ...state.exportConfig,
                    includeNotificationSounds: !state.exportConfig.includeNotificationSounds
                  }
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  state.exportConfig.includeNotificationSounds ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
                type="button"
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  state.exportConfig.includeNotificationSounds ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">{t('templateBuilder.export.loopConversation')}</label>
                <p className="text-xs text-zinc-400">{t('templateBuilder.export.loopConversationDesc')}</p>
              </div>
              <button
                onClick={() => onUpdateState({
                  exportConfig: {
                    ...state.exportConfig,
                    loopConversation: !state.exportConfig.loopConversation
                  }
                })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  state.exportConfig.loopConversation ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
                type="button"
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  state.exportConfig.loopConversation ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Play size={20} />
            {t('templateBuilder.export.videoSettings')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('templateBuilder.export.resolution')}</label>
              <select
                value={state.exportConfig.resolution}
                onChange={(e) => onUpdateState({
                  exportConfig: {
                    ...state.exportConfig,
                    resolution: e.target.value as '720p' | '1080p' | '4k'
                  }
                })}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
              >
                <option value="720p">{t('templateBuilder.export.resolution720')}</option>
                <option value="1080p">{t('templateBuilder.export.resolution1080')}</option>
                <option value="4k">{t('templateBuilder.export.resolution4k')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('templateBuilder.export.frameRate')}</label>
              <select
                value={state.exportConfig.frameRate}
                onChange={(e) => onUpdateState({
                  exportConfig: {
                    ...state.exportConfig,
                    frameRate: parseInt(e.target.value) as 24 | 30 | 60
                  }
                })}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
              >
                <option value={24}>{t('templateBuilder.export.fps24')}</option>
                <option value={30}>{t('templateBuilder.export.fps30')}</option>
                <option value={60}>{t('templateBuilder.export.fps60')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('templateBuilder.export.watermark')}</label>
              <input
                type="text"
                value={state.exportConfig.watermark || ''}
                onChange={(e) => onUpdateState({
                  exportConfig: {
                    ...state.exportConfig,
                    watermark: e.target.value
                  }
                })}
                placeholder={t('templateBuilder.export.watermarkPlaceholder')}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{t('templateBuilder.export.endingCta')}</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">{t('templateBuilder.export.addCta')}</label>
              <p className="text-xs text-zinc-400">{t('templateBuilder.export.addCtaDesc')}</p>
            </div>
            <button
              onClick={() => onUpdateState({
                exportConfig: {
                  ...state.exportConfig,
                  addEndingCTA: !state.exportConfig.addEndingCTA
                }
              })}
              className={`w-12 h-6 rounded-full transition-colors ${
                state.exportConfig.addEndingCTA ? 'bg-blue-600' : 'bg-zinc-600'
              }`}
              type="button"
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                state.exportConfig.addEndingCTA ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {state.exportConfig.addEndingCTA && (
            <div>
              <label className="block text-sm font-medium mb-2">{t('templateBuilder.export.ctaText')}</label>
              <input
                type="text"
                value={state.exportConfig.ctaText || ''}
                onChange={(e) => onUpdateState({
                  exportConfig: {
                    ...state.exportConfig,
                    ctaText: e.target.value
                  }
                })}
                placeholder={t('templateBuilder.export.ctaPlaceholder')}
                className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Share2 size={20} />
          {t('templateBuilder.export.socialOptimization')}
        </h3>

        <p className="text-sm text-zinc-400 mb-4">
          {t('templateBuilder.export.socialOptimizationDesc')}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="flex flex-col items-center gap-2 p-3 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors cursor-pointer"
            >
              <div className={`w-8 h-8 ${platform.color} rounded-full flex items-center justify-center text-white`}>
                {platform.icon}
              </div>
              <span className="text-xs text-center">{platform.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{t('templateBuilder.export.summary')}</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{state.messages.length}</div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.timeline.messages')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatDuration(calculateEstimatedDuration())}
            </div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.export.duration')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {t(EXPORT_FORMATS.find(f => f.id === state.exportConfig.format)?.nameKey || '')}
            </div>
            <div className="text-sm text-zinc-400">{t('templateBuilder.export.format')}</div>
          </div>
        </div>

        <div className="text-center">
          {exportedBlob ? (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                type="button"
              >
                <Download size={18} />
                {t('templateBuilder.export.downloadButton')}
              </button>
              <button
                onClick={resetExport}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                type="button"
              >
                <RefreshCw size={18} />
                {t('templateBuilder.export.exportAgain')}
              </button>
            </div>
          ) : isExporting ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  disabled
                  className="px-8 py-3 bg-zinc-700 text-white font-medium rounded-lg flex items-center gap-2 cursor-not-allowed"
                  type="button"
                >
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('templateBuilder.export.exporting', { progress: Math.round(exportProgress) })}
                </button>
                <button
                  onClick={cancelExport}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                  type="button"
                >
                  <X size={18} />
                  {t('templateBuilder.export.cancel')}
                </button>
              </div>
              <div className="w-full max-w-md mx-auto bg-zinc-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-sm text-zinc-400">
                {t('templateBuilder.export.exportingMessage')}
              </p>
            </div>
          ) : (
            <button
              onClick={handleExport}
              disabled={!isReadyToExport}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center gap-2 mx-auto transition-colors"
              type="button"
            >
              <Download size={18} />
              {t('templateBuilder.export.exportButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};