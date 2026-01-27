import { useState, useEffect, useMemo, RefObject } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { TemplateBuilderState, Message, MessageSender } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';

interface RealTimePreviewProps {
  state: TemplateBuilderState;
  videoRef?: RefObject<HTMLVideoElement>;
  onUpdateState?: (updates: Partial<TemplateBuilderState>) => void;
}

type PreviewMode = 'mobile' | 'desktop' | 'notification';

export const RealTimePreview = ({
  state,
}) => {
  const { t } = useTranslation();
  const [previewMode, setPreviewMode] = useState<PreviewMode>('mobile');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);

  const totalDuration = useMemo(() => {
    let total = 0;
    state.messages.forEach((message) => {
      const delay = message.delay || state.timingConfig.messageDelay;
      const typingDuration = (message.content.length / (message.typingSpeed || state.timingConfig.typingSpeed)) * 1000;
      const readDelay = state.timingConfig.readDelay;
      total += delay + typingDuration + readDelay;
    });
    return total;
  }, [state.messages, state.timingConfig]);

  const getParticipantBySender = (sender: MessageSender) => {
    return state.participants.find(p => p.position === sender);
  };

  const startPlayback = () => {
    if (state.messages.length === 0) {
      alert('Please add messages to your conversation first');
      return;
    }

    setIsPlaying(true);
    setCurrentMessageIndex(-1);
    setCurrentTime(0);
    setVisibleMessages([]);
    setIsTyping(false);
    setCurrentTypingText('');
  };

  const pausePlayback = () => {
    setIsPlaying(false);
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentMessageIndex(-1);
    setCurrentTime(0);
    setVisibleMessages([]);
    setIsTyping(false);
    setCurrentTypingText('');
  };

  const handlePlaybackComplete = () => {
    setIsPlaying(false);
    setVisibleMessages(state.messages);
    setIsTyping(false);
    setCurrentTypingText('');
    setCurrentMessageIndex(-1);
  };

  const skipToNext = () => {
    if (currentMessageIndex < state.messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1);
      setIsTyping(false);
      setCurrentTypingText('');
    }
  };

  const skipToPrevious = () => {
    if (currentMessageIndex > 0) {
      setCurrentMessageIndex(currentMessageIndex - 1);
      setVisibleMessages(state.messages.slice(0, currentMessageIndex));
      setIsTyping(false);
      setCurrentTypingText('');
    } else if (currentMessageIndex === 0) {
      setCurrentMessageIndex(-1);
      setVisibleMessages([]);
      setIsTyping(false);
      setCurrentTypingText('');
    }
  };

  useEffect(() => {
    if (!isPlaying || state.messages.length === 0) return;

    const updateMessagesForTime = (elapsedTime: number) => {
      let accumulatedTime = 0;
      let currentTypingIndex = -1;
      let visibleMessagesList: Message[] = [];
      let typingText = '';
      let isCurrentlyTyping = false;

      for (let i = 0; i < state.messages.length; i++) {
        const message = state.messages[i];
        const delay = message.delay || state.timingConfig.messageDelay;
        const typingSpeed = message.typingSpeed || state.timingConfig.typingSpeed;
        const typingDuration = (message.content.length / typingSpeed) * 1000;
        const readDelay = state.timingConfig.readDelay;

        const messageStartTime = accumulatedTime;
        const typingStartTime = messageStartTime + delay;
        const messageVisibleTime = typingStartTime + typingDuration;
        const nextMessageTime = messageVisibleTime + readDelay;

        if (elapsedTime >= messageVisibleTime) {
          visibleMessagesList.push(message);
        } else if (elapsedTime >= typingStartTime) {
          currentTypingIndex = i;
          isCurrentlyTyping = true;
          const timeSinceTypingStart = elapsedTime - typingStartTime;
          const charsToShow = Math.floor((timeSinceTypingStart / 1000) * typingSpeed);
          typingText = message.content.slice(0, Math.max(0, charsToShow));
          break;
        } else if (elapsedTime >= messageStartTime) {
          currentTypingIndex = i;
          isCurrentlyTyping = false;
          typingText = '';
          break;
        }

        accumulatedTime = nextMessageTime;
      }

      setVisibleMessages(visibleMessagesList);
      setCurrentMessageIndex(currentTypingIndex);
      setIsTyping(isCurrentlyTyping);
      setCurrentTypingText(typingText);

      if (visibleMessagesList.length === state.messages.length && !isCurrentlyTyping) {
        handlePlaybackComplete();
      }
    };

    const PLAYBACK_UPDATE_INTERVAL_MS = 50;
    const startTime = Date.now() - currentTime;
    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      updateMessagesForTime(elapsedTime);
      setCurrentTime(elapsedTime);

      if (elapsedTime >= totalDuration + 1000) {
        handlePlaybackComplete();
      }
    }, PLAYBACK_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, state.messages, state.timingConfig, totalDuration]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const renderMessageBubble = (message: Message, index: number) => {
    const participant = getParticipantBySender(message.sender);
    const isCurrentTyping = isTyping && currentMessageIndex === index;
    const showTypingIndicator = isCurrentTyping && !message.content && message.type === 'text';

    const getTemplateStyles = () => {
      if (!state.selectedTemplate) return {
        bubbleClass: message.sender === 'right' ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-100',
        bubbleShape: 'rounded-2xl'
      };

      const template = state.selectedTemplate;
      switch (template.platform) {
        case 'ios':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-blue-500 text-white'
              : 'bg-zinc-200 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        case 'whatsapp':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-emerald-500 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-lg'
          };
        case 'instagram':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-purple-500 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        case 'messenger':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        case 'telegram':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-blue-400 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-xl'
          };
        case 'discord':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-indigo-500 text-white'
              : 'bg-zinc-200 text-zinc-900',
            bubbleShape: 'rounded-lg'
          };
        case 'slack':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-purple-600 text-white'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-lg'
          };
        case 'snapchat':
          return {
            bubbleClass: message.sender === 'right'
              ? 'bg-yellow-500 text-black'
              : 'bg-zinc-100 text-zinc-900',
            bubbleShape: 'rounded-2xl'
          };
        default:
          return {
            bubbleClass: message.sender === 'right' ? 'bg-blue-500 text-white' : 'bg-zinc-700 text-zinc-100',
            bubbleShape: 'rounded-2xl'
          };
      }
    };

    const { bubbleClass, bubbleShape } = getTemplateStyles();

    return (
      <div
        key={message.id}
        className={`flex items-end gap-2 mb-4 transition-all duration-300 ${
          message.sender === 'right' ? 'justify-end' : 'justify-start'
        }`}
        style={{
          animation: index === visibleMessages.length - 1 ? 'slideInUp 0.3s ease-out' : undefined
        }}
      >
        {message.sender === 'left' && participant && (
          <div className="flex-shrink-0">
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: participant.color }}
              >
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}

        <div className={`max-w-[80%] ${message.sender === 'right' ? 'order-first' : 'order-last'}`}>
          {message.type === 'video' && message.videoUrl ? (
            <div className={`relative p-2 ${bubbleClass} ${bubbleShape}`}>
              <video
                src={message.videoUrl}
                className="w-full max-w-[200px] rounded-lg"
                controls
                muted={isMuted}
                preload="metadata"
                autoPlay={false}
              />
              <div className="mt-2 text-xs opacity-75">
                {isCurrentTyping ? t('templateBuilder.preview.typing') : t('templateBuilder.conversation.videoMessage')}
              </div>
            </div>
          ) : message.type === 'image' && message.content ? (
            <div className={`relative p-2 ${bubbleClass} ${bubbleShape}`}>
              <img
                src={message.content}
                alt="Attachment"
                className="w-full max-w-[200px] rounded-lg"
              />
              <div className="mt-2 text-xs opacity-75">
                {isCurrentTyping ? t('templateBuilder.preview.typing') : t('templateBuilder.conversation.photo')}
              </div>
            </div>
          ) : (
            <div className={`px-4 py-3 ${bubbleShape} ${bubbleClass} relative`}>
              <p className="text-sm leading-relaxed">
                {isCurrentTyping ? currentTypingText : message.content}
                {showTypingIndicator && (
                  <span className="inline-flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </p>

              {message.sender === 'right' && !isCurrentTyping && (
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs opacity-75">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {state.selectedTemplate?.platform === 'ios' && (
                    <div className="flex">
                      <span className="text-xs opacity-75">✓✓</span>
                    </div>
                  )}
                  {state.selectedTemplate?.platform === 'whatsapp' && (
                    <div className="flex">
                      <span className="text-xs opacity-75">✓✓</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {message.sender === 'right' && participant && (
          <div className="flex-shrink-0">
            {participant.avatar ? (
              <img
                src={participant.avatar}
                alt={participant.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: participant.color }}
              >
                {participant.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMobilePreview = () => {
    const getAppInfo = () => {
      if (!state.selectedTemplate) return { icon: '💬', name: 'Messages', color: 'bg-blue-500' };

      switch (state.selectedTemplate.platform) {
        case 'ios': return { icon: '💬', name: 'Messages', color: 'bg-blue-500' };
        case 'whatsapp': return { icon: '🟢', name: 'WhatsApp', color: 'bg-green-500' };
        case 'instagram': return { icon: '📸', name: 'Instagram', color: 'bg-pink-500' };
        case 'messenger': return { icon: '💬', name: 'Messenger', color: 'bg-blue-600' };
        case 'telegram': return { icon: '✈️', name: 'Telegram', color: 'bg-blue-400' };
        case 'discord': return { icon: '#️⃣', name: 'Discord', color: 'bg-indigo-500' };
        case 'slack': return { icon: '#️⃣', name: 'Slack', color: 'bg-purple-600' };
        case 'snapchat': return { icon: '👻', name: 'Snapchat', color: 'bg-yellow-500' };
        default: return { icon: '💬', name: 'Messages', color: 'bg-blue-500' };
      }
    };

    const appInfo = getAppInfo();

    return (
      <div className="flex justify-center">
        <div className="relative bg-black rounded-[2.5rem] p-2 shadow-2xl">
          <div className="bg-zinc-900 rounded-[2rem] overflow-hidden" style={{ width: '320px', height: '640px' }}>
            <div className="bg-zinc-900 px-4 py-1 flex items-center justify-between text-white text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2 bg-zinc-600 rounded-sm" />
                <div className="w-3 h-1.5 bg-zinc-600 rounded-sm" />
                <span>100%</span>
              </div>
            </div>

            <div className="bg-zinc-800 px-4 py-3 flex items-center gap-3 border-b border-zinc-700">
              <div className={`w-6 h-6 rounded-full ${appInfo.color} flex items-center justify-center text-white text-xs`}>
                {appInfo.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {getParticipantBySender('right')?.name || 'Chat'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {isTyping ? t('templateBuilder.preview.typing') : visibleMessages.length > 0 ? t('templateBuilder.preview.online') : t('templateBuilder.preview.tapToStart')}
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-zinc-900" style={{ height: '480px' }}>
              {visibleMessages.length === 0 && !isTyping && (
                <div className="text-center py-8 text-zinc-500">
                  <div className="text-2xl mb-2">💬</div>
                  <p className="text-sm">{t('templateBuilder.preview.startConversation')}</p>
                </div>
              )}

              {visibleMessages.map((message, index) => renderMessageBubble(message, index))}

              {isTyping && currentMessageIndex >= 0 && (
                <div className={`flex items-end gap-2 mb-4 ${
                  state.messages[currentMessageIndex]?.sender === 'right' ? 'justify-end' : 'justify-start'
                }`}>
                  {state.messages[currentMessageIndex]?.sender === 'left' && (
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-zinc-400 text-xs">
                        {getParticipantBySender('left')?.name?.charAt(0) || '?'}
                      </div>
                    </div>
                  )}

                  <div className={`px-3 py-2 rounded-2xl max-w-[80%] ${
                    state.messages[currentMessageIndex]?.sender === 'right'
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-700 text-zinc-100'
                  }`}>
                    {currentTypingText ? (
                      <div className="text-sm">
                        {currentTypingText}
                        <span className="inline-block w-0.5 h-3 bg-current animate-pulse ml-0.5" />
                      </div>
                    ) : (
                      <span className="inline-flex gap-1">
                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-zinc-800 px-4 py-3 border-t border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-700 rounded-full px-4 py-2 text-sm text-zinc-400">
                  {isTyping ? t('templateBuilder.preview.typing') : t('templateBuilder.preview.typeMessage')}
                </div>
                <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📎</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopPreview = () => {
    const getAppInfo = () => {
      if (!state.selectedTemplate) return {
        icon: '💬',
        name: 'Messages',
        color: 'bg-blue-500',
        features: ['📞', '📹']
      };

      switch (state.selectedTemplate.platform) {
        case 'ios': return {
          icon: '💬',
          name: 'Messages',
          color: 'bg-blue-500',
          features: ['📞', '📹']
        };
        case 'whatsapp': return {
          icon: '🟢',
          name: 'WhatsApp',
          color: 'bg-green-500',
          features: ['📞', '📹', '📎']
        };
        case 'instagram': return {
          icon: '📸',
          name: 'Instagram',
          color: 'bg-pink-500',
          features: ['📞', '📹', '❤️']
        };
        case 'messenger': return {
          icon: '💬',
          name: 'Messenger',
          color: 'bg-blue-600',
          features: ['📞', '📹', '❤️']
        };
        case 'telegram': return {
          icon: '✈️',
          name: 'Telegram',
          color: 'bg-blue-400',
          features: ['🤖', '📎', '🔒']
        };
        case 'discord': return {
          icon: '#️⃣',
          name: 'Discord',
          color: 'bg-indigo-500',
          features: ['🎤', '🎧', '📎']
        };
        case 'slack': return {
          icon: '#️⃣',
          name: 'Slack',
          color: 'bg-purple-600',
          features: ['📎', '🔗', '@']
        };
        case 'snapchat': return {
          icon: '👻',
          name: 'Snapchat',
          color: 'bg-yellow-500',
          features: ['👻', '📷', '🎨']
        };
        default: return {
          icon: '💬',
          name: 'Messages',
          color: 'bg-blue-500',
          features: ['📞', '📹']
        };
      }
    };

    const appInfo = getAppInfo();

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-zinc-800 px-6 py-4 flex items-center gap-4 border-b border-zinc-700">
            <div className={`w-10 h-10 rounded-full ${appInfo.color} flex items-center justify-center text-white`}>
              {appInfo.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {getParticipantBySender('right')?.name || 'Chat'}
              </h3>
              <p className="text-sm text-zinc-400">
                {isTyping ? t('templateBuilder.preview.typing') : t('templateBuilder.preview.online')}
              </p>
            </div>
            <div className="flex gap-2">
              {appInfo.features.map((feature, index) => (
                <button key={index} className="w-8 h-8 text-zinc-400 hover:text-white text-sm">
                  {feature}
                </button>
              ))}
            </div>
          </div>

          <div className="h-96 p-6 overflow-y-auto bg-zinc-900">
            {visibleMessages.length === 0 && !isTyping ? (
              <div className="text-center py-12 text-zinc-500">
                <div className="text-4xl mb-4">💬</div>
                <p>{t('templateBuilder.preview.startConversation')}</p>
              </div>
            ) : (
              <>
                {visibleMessages.map((message, index) => renderMessageBubble(message, index))}
                {isTyping && currentMessageIndex >= 0 && (
                  <div className={`flex items-end gap-3 mb-4 ${
                    state.messages[currentMessageIndex]?.sender === 'right' ? 'justify-end' : 'justify-start'
                  }`}>
                    {state.messages[currentMessageIndex]?.sender === 'left' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-zinc-600 flex items-center justify-center text-zinc-400">
                          {getParticipantBySender('left')?.name?.charAt(0) || '?'}
                        </div>
                      </div>
                    )}

                    <div className={`px-4 py-3 rounded-2xl max-w-[70%] ${
                      state.messages[currentMessageIndex]?.sender === 'right'
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-700 text-zinc-100'
                    }`}>
                      {currentTypingText ? (
                        <div className="text-sm">
                          {currentTypingText}
                          <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5" />
                        </div>
                      ) : (
                        <span className="inline-flex gap-1">
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-zinc-800 px-6 py-4 border-t border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-zinc-700 rounded-lg px-4 py-3 text-zinc-400">
                {isTyping ? t('templateBuilder.preview.typing') : t('templateBuilder.preview.typeMessage')}
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!state.selectedTemplate) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📱</div>
        <h3 className="text-xl font-semibold mb-2">{t('templateBuilder.preview.noTemplate')}</h3>
        <p className="text-zinc-400">{t('templateBuilder.preview.selectFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('templateBuilder.preview.title')}</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          {t('templateBuilder.preview.subtitle')}
        </p>
      </div>

      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              <Smartphone size={16} className="inline mr-2" />
              {t('templateBuilder.preview.mobile')}
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewMode === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              <Monitor size={16} className="inline mr-2" />
              {t('templateBuilder.preview.desktop')}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={resetPlayback}
            className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-600 transition-colors"
            type="button"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={skipToPrevious}
            disabled={currentMessageIndex < 0}
            className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
            type="button"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={isPlaying ? pausePlayback : startPlayback}
            disabled={state.messages.length === 0}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
            type="button"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} fill="white" />}
          </button>

          <button
            onClick={skipToNext}
            disabled={currentMessageIndex >= state.messages.length - 1}
            className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
            type="button"
          >
            <SkipForward size={16} />
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 hover:bg-zinc-600 transition-colors"
            type="button"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        <div className="relative">
          <div className="h-2 bg-zinc-700 rounded-full cursor-pointer">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-zinc-400">
            {isPlaying ? t('templateBuilder.preview.playing') : t('templateBuilder.preview.paused')}
            {currentMessageIndex >= 0 && ` • ${t('templateBuilder.preview.messageOf', { current: currentMessageIndex + 1, total: state.messages.length })}`}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        {previewMode === 'mobile' ? renderMobilePreview() : renderDesktopPreview()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{state.messages.length}</div>
          <div className="text-sm text-zinc-400">{t('templateBuilder.timeline.messages')}</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{formatTime(totalDuration)}</div>
          <div className="text-sm text-zinc-400">{t('templateBuilder.preview.totalDuration')}</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {state.messages.filter(m => m.type !== 'text').length}
          </div>
          <div className="text-sm text-zinc-400">{t('templateBuilder.preview.mediaFiles')}</div>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {state.timingConfig.typingSpeed}
          </div>
          <div className="text-sm text-zinc-400">{t('templateBuilder.preview.avgTypingSpeed')}</div>
        </div>
      </div>
    </div>
  );
};