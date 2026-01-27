import { useState, Fragment } from 'react';
import { ChevronRight, ArrowLeft, Sparkles, Save } from 'lucide-react';
import { TemplateBuilderProps, TemplateBuilderState, TemplateBuilderTab } from './types';
import { TemplateGallery } from './TemplateGallery';
import { ConversationBuilder } from './ConversationBuilder';
import { MessageTimelineEditor } from './MessageTimelineEditor';
import { RealTimePreview } from './RealTimePreview';
import { ExportConfiguration } from './ExportConfiguration';
import { useTranslation } from '../../../../hooks/useTranslation';

const TABS: { id: TemplateBuilderTab; labelKey: string; emoji: string; descriptionKey: string }[] = [
  { id: 'gallery', labelKey: 'templateBuilder.tabs.gallery', emoji: '📋', descriptionKey: 'templateBuilder.tabs.galleryDesc' },
  { id: 'conversation', labelKey: 'templateBuilder.tabs.conversation', emoji: '💬', descriptionKey: 'templateBuilder.tabs.conversationDesc' },
  { id: 'timeline', labelKey: 'templateBuilder.tabs.timeline', emoji: '⏱️', descriptionKey: 'templateBuilder.tabs.timelineDesc' },
  { id: 'preview', labelKey: 'templateBuilder.tabs.preview', emoji: '👁️', descriptionKey: 'templateBuilder.tabs.previewDesc' },
  { id: 'export', labelKey: 'templateBuilder.tabs.export', emoji: '📤', descriptionKey: 'templateBuilder.tabs.exportDesc' },
];

export const TemplateBuilder = ({ onBack, onComplete }: TemplateBuilderProps) => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState<TemplateBuilderTab>('gallery');
  const [state, setState] = useState<TemplateBuilderState>({
    selectedTemplate: null,
    participants: [
      { id: 'user', name: 'You', avatar: null, color: '#007AFF', position: 'left' },
      { id: 'friend', name: 'Sarah', avatar: null, color: '#34C759', position: 'right' },
    ],
    messages: [],
    timingConfig: {
      messageDelay: 1000,
      typingSpeed: 50,
      readDelay: 500,
      videoSyncOffset: 0,
    },
    exportConfig: {
      format: 'screen-recording',
      includeTypingSounds: true,
      includeNotificationSounds: true,
      loopConversation: false,
      addEndingCTA: false,
      ctaText: '',
      watermark: '',
      resolution: '1080p',
      frameRate: 30,
    },
    notificationConfig: {
      style: 'banner',
      showBadge: true,
      badgeCount: 1,
      previewText: '',
      dismissAnimation: true,
    },
    isPlaying: false,
    currentTime: 0,
    isTyping: false,
    currentTypingMessage: null,
  });

  const updateState = (updates: Partial<TemplateBuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const renderTabButton = (tab: typeof TABS[number], index: number) => {
    const isActive = currentTab === tab.id;
    const currentIndex = TABS.findIndex(t => t.id === currentTab);
    const isPast = currentIndex > index;
    const isCompleted = currentIndex > index;

    return (
      <Fragment key={tab.id}>
        <div className="flex flex-col items-center gap-2 min-w-0">
          <button
            onClick={() => setCurrentTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all touch-target whitespace-nowrap snap-start min-w-[80px] ${
              isActive
                ? 'bg-blue-600 text-white shadow-lg'
                : isPast || isCompleted
                  ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
            }`}
            type="button"
          >
            <span className="text-lg">{tab.emoji}</span>
            <span className="text-center leading-tight">{t(tab.labelKey)}</span>
          </button>
          <span className={`text-xs text-center leading-tight px-1 ${
            isActive ? 'text-blue-400' : 'text-zinc-500'
          }`}>
            {t(tab.descriptionKey)}
          </span>
        </div>
        {index < TABS.length - 1 && (
          <ChevronRight size={14} className={`text-zinc-600 flex-shrink-0 mx-2 ${
            isCompleted ? 'text-green-500' : ''
          }`} />
        )}
      </Fragment>
    );
  };

  const handleNext = () => {
    const currentIndex = TABS.findIndex(t => t.id === currentTab);
    if (currentIndex < TABS.length - 1) {
      setCurrentTab(TABS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = TABS.findIndex(t => t.id === currentTab);
    if (currentIndex > 0) {
      setCurrentTab(TABS[currentIndex - 1].id);
    }
  };

  const handleComplete = () => {
    if (!state.selectedTemplate) {
      alert(t('templateBuilder.validation.selectTemplate'));
      return;
    }
    if (state.messages.length === 0) {
      alert(t('templateBuilder.validation.addMessage'));
      return;
    }

    onComplete?.(state);
  };

  const isLastTab = currentTab === 'export';
  const isFirstTab = currentTab === 'gallery';

  const renderTabContent = () => {
    switch (currentTab) {
      case 'gallery':
        return (
          <TemplateGallery
            selectedTemplate={state.selectedTemplate}
            onSelectTemplate={(template) => updateState({ selectedTemplate: template })}
          />
        );
      case 'conversation':
        return (
          <ConversationBuilder
            state={state}
            onUpdateState={updateState}
          />
        );
      case 'timeline':
        return (
          <MessageTimelineEditor
            state={state}
            onUpdateState={updateState}
          />
        );
      case 'preview':
        return (
          <RealTimePreview
            state={state}
          />
        );
      case 'export':
        return (
          <ExportConfiguration
            state={state}
            onUpdateState={updateState}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                type="button"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-lg font-semibold">{t('templateBuilder.title')}</h1>
                <p className="text-sm text-zinc-400">{t('templateBuilder.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                type="button"
              >
                <Save size={14} />
                {t('templateBuilder.saveDraft')}
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
            <div className="flex items-start justify-center gap-1 min-w-max">
              {TABS.map((tab, index) => renderTabButton(tab, index))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 sm:p-6">
              {renderTabContent()}
            </div>

            <div className="flex items-center justify-between p-6 border-t border-zinc-800 mt-8">
              <button
                onClick={handleBack}
                disabled={isFirstTab}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isFirstTab
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
                type="button"
              >
                <ArrowLeft size={16} />
                {t('templateBuilder.back')}
              </button>

              <button
                onClick={isLastTab ? handleComplete : handleNext}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                type="button"
              >
                {isLastTab ? (
                  <>
                    <Sparkles size={16} />
                    {t('templateBuilder.createStory')}
                  </>
                ) : (
                  <>
                    {t('templateBuilder.next')}
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};