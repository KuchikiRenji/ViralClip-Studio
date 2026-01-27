import { useMemo, RefObject, MouseEvent, useState, useCallback, useEffect, SyntheticEvent } from 'react';
import { ChevronRight, Video, Play, Pause, Volume2, VolumeX, Maximize2, CheckCheck } from 'lucide-react';
import { TextStoryState, CardAnimationType, TextAnimationType } from './types';
import { BACKGROUND_VIDEOS, TEMPLATE_CONFIG } from './constants';
export interface TextStoryPreviewProps {
  state: TextStoryState;
  videoRef: RefObject<HTMLVideoElement | null>;
  onTimeUpdate: () => void;
  onLoadedMetadata: () => void;
  onVideoEnded: () => void;
  onVideoError?: () => void;
  onSeek: (e: MouseEvent<HTMLDivElement>) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  formatTime: (seconds: number) => string;
}
export const TextStoryPreview = ({
  state,
  videoRef,
  onTimeUpdate,
  onLoadedMetadata,
  onVideoEnded,
  onVideoError,
  onSeek,
  onTogglePlay,
  onToggleMute,
  onToggleFullscreen,
  formatTime,
}) => {
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);

  const config = TEMPLATE_CONFIG[state.selectedTemplate];
  const bgColor = state.darkMode ? 'bg-zinc-900' : 'bg-white';
  const borderColor = state.darkMode ? 'border-zinc-700' : 'border-zinc-200';
  const textColor = state.darkMode ? 'text-white' : 'text-zinc-900';
  const subTextColor = state.darkMode ? 'text-zinc-400' : 'text-zinc-500';
  const bubbleBg = state.darkMode ? 'bg-zinc-800' : 'bg-zinc-100';
  const bubbleText = state.darkMode ? 'text-zinc-300' : 'text-zinc-700';

  const handleLoadedData = useCallback(() => {
    setIsVideoLoading(false);
    setHasVideoError(false);
  }, []);

  const handleError = useCallback((_e: SyntheticEvent<HTMLVideoElement, Event>) => {
    setHasVideoError(true);
    setIsVideoLoading(false);
    if (onVideoError) {
      onVideoError();
    }
  }, [onVideoError]);

  const handleLoadStart = useCallback(() => {
    setIsVideoLoading(true);
    setHasVideoError(false);
  }, []);

  const getVideoSrc = (): string | null => {
    if (state.backgroundSource === 'upload' && state.uploadedBackgroundUrl) {
      return state.uploadedBackgroundUrl;
    }
    const selectedVideo = BACKGROUND_VIDEOS.find(v => v.id === state.selectedBackground);
    if (selectedVideo?.src) {
      return selectedVideo.src;
    }
    if (BACKGROUND_VIDEOS.length > 0) {
      return BACKGROUND_VIDEOS[0].src;
    }
    return null;
  };

  useEffect(() => {
    setIsVideoLoading(true);
    setHasVideoError(false);
  }, [state.selectedBackground, state.uploadedBackgroundUrl]);
  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const visibleMessages = useMemo(() => {
    const messagesWithContent = state.messages.filter(m => m.content.trim());
    if (!state.isPlaying && state.visibleMessageIndex === -1) {
      return messagesWithContent.slice(0, 5);
    }

    const endIndex = state.isTyping ? state.visibleMessageIndex : state.visibleMessageIndex + 1;
    return messagesWithContent.slice(0, endIndex);
  }, [state.messages, state.isPlaying, state.visibleMessageIndex, state.isTyping]);

  const typingMessageInfo = useMemo(() => {
    if (!state.isTyping) return null;

    const messagesWithContent = state.messages.filter(m => m.content.trim());

    if (state.visibleMessageIndex >= messagesWithContent.length) return null;

    return {
      message: messagesWithContent[state.visibleMessageIndex],
      index: state.visibleMessageIndex,
      typingText: state.currentTypingText || ''
    };
  }, [state.isTyping, state.visibleMessageIndex, state.messages, state.currentTypingText]);
  const getCardAnimationClass = (animation: CardAnimationType): string => {
    switch (animation) {
      case 'fade': return 'animate-fade-in';
      case 'slide': return 'animate-slide-in-up';
      case 'bounce': return 'animate-bounce-in';
      default: return '';
    }
  };
  const getTextAnimationClass = (animation: TextAnimationType): string => {
    switch (animation) {
      case 'fade': return 'animate-fade-in';
      case 'slide-up': return 'animate-slide-in-up';
      case 'typewriter': return 'animate-typewriter';
      default: return '';
    }
  };
  return (
    <div className="w-full lg:w-[300px] shrink-0">
      <div className="lg:sticky lg:top-8 flex justify-center lg:block">
        <div className="bg-zinc-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 max-w-[280px] xs:max-w-[320px] sm:max-w-none mx-auto lg:mx-0">
          <div className="aspect-[9/16] relative bg-black touch-manipulation">
            {isVideoLoading && !hasVideoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900" style={{ zIndex: 5 }}>
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-white text-sm">Loading video...</p>
                </div>
              </div>
            )}

            {hasVideoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900" style={{ zIndex: 5 }}>
                <div className="text-center px-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-red-500 text-2xl">⚠️</span>
                  </div>
                  <p className="text-white text-sm mb-2">Video failed to load</p>
                  <p className="text-zinc-400 text-xs">Check video source or try another</p>
                </div>
              </div>
            )}

            {getVideoSrc() ? (
              <video
                ref={videoRef}
                src={getVideoSrc() || undefined}
                className="w-full h-full object-cover absolute inset-0"
                loop
                muted
                autoPlay
                playsInline
                preload="auto"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onLoadedData={handleLoadedData}
                onLoadStart={handleLoadStart}
                onEnded={onVideoEnded}
                onError={(e) => {
                  handleError(e);
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  const selectedVideo = BACKGROUND_VIDEOS.find(v => v.src === getVideoSrc());
                  const fallbackPoster = selectedVideo?.thumbnail;
                  if (parent && fallbackPoster) {
                    const img = document.createElement('img');
                    img.src = fallbackPoster;
                    img.className = "w-full h-full object-cover opacity-90 absolute inset-0";
                    parent.appendChild(img);
                  }
                }}
                style={{ zIndex: 0 }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center" style={{ zIndex: 0 }}>
                <div className="text-center text-zinc-500">
                  <Video size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No background video</p>
                </div>
              </div>
            )}

            <div className="absolute inset-x-4 top-1/4 pointer-events-none" style={{ zIndex: 10 }}>
              <div className={`rounded-xl overflow-hidden shadow-xl ${bgColor} border ${borderColor} ${getCardAnimationClass(state.cardAnimation)}`}>
                <div className={`flex items-center gap-2 px-3 py-2 border-b ${borderColor}`}>
                  <ChevronRight size={16} className="rotate-180 text-blue-500" />
                  {state.profilePhoto ? (
                    <img
                      src={state.profilePhoto}
                      alt={state.contactName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                      {state.contactName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`text-sm font-medium flex-1 truncate ${textColor}`}>{state.contactName}</span>
                  {state.selectedTemplate === 'tinder' && <Video size={14} className="text-blue-400" />}
                  {state.selectedTemplate === 'instagram' && <Video size={14} className={subTextColor} />}
                  {state.selectedTemplate === 'messenger' && <Video size={14} className="text-blue-500" />}
                </div>
                <div className="p-3 space-y-2 max-h-[200px] overflow-y-auto">
                  {visibleMessages.map((msg, index) => {
                    const isLastMessage = index === visibleMessages.length - 1;
                    const showReadReceipt = msg.sender === 'right' && isLastMessage;
                    const isCurrentlyTyping = state.isTyping && msg.animation === 'typewriter' && isLastMessage;

                    return (
                      <div
                        key={msg.id}
                        className={`text-xs px-3 py-2 rounded-2xl max-w-[85%] ${msg.sender === 'left'
                          ? `${bubbleBg} ${bubbleText}`
                          : `${config.replyColor} text-white ml-auto`
                          }`}
                      >
                        <div>{isCurrentlyTyping ? state.currentTypingText : msg.content}</div>
                        {showReadReceipt && (
                          <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                            <span className="text-[9px]">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <CheckCheck size={10} className="text-blue-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {state.isTyping && typingMessageInfo && (
                    <div className={`text-xs px-3 py-2 rounded-2xl max-w-[85%] transition-all ${typingMessageInfo.message.sender === 'left'
                      ? `${bubbleBg} ${bubbleText}`
                      : `${config.replyColor} text-white ml-auto`
                      }`}>
                      {typingMessageInfo.typingText ? (
                        <div>
                          {typingMessageInfo.typingText}
                          <span className="inline-block w-0.5 h-3 bg-current animate-pulse ml-0.5" />
                        </div>
                      ) : (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                    </div>
                  )}

                  {state.isTyping && !typingMessageInfo && (
                    <div className={`text-xs px-3 py-2 rounded-2xl max-w-[85%] ${bubbleBg} ${bubbleText} animate-pulse`}>
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  )}

                  {visibleMessages.length === 0 && !state.isTyping && (
                    <>
                      <div className={`text-xs px-3 py-2 rounded-2xl max-w-[85%] ${bubbleBg} ${bubbleText}`}>
                        Message preview...
                      </div>
                      <div className={`text-xs px-3 py-2 rounded-2xl max-w-[70%] ml-auto text-white ${config.replyColor}`}>
                        Reply preview...
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-zinc-800 px-3 py-2 sm:py-3">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={onTogglePlay}
                  className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white hover:bg-zinc-600 active:scale-95 transition-all touch-target"
                  type="button"
                >
                  {state.isPlaying ? <Pause size={16} className="sm:hidden" /> : <Play size={16} className="sm:hidden" fill="white" />}
                  {state.isPlaying ? <Pause size={14} className="hidden sm:block" /> : <Play size={14} className="hidden sm:block" fill="white" />}
                </button>
                <button
                  onClick={onToggleMute}
                  className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all touch-target"
                  type="button"
                >
                  {state.isMuted ? <VolumeX size={18} className="sm:hidden" /> : <Volume2 size={18} className="sm:hidden" />}
                  {state.isMuted ? <VolumeX size={16} className="hidden sm:block" /> : <Volume2 size={16} className="hidden sm:block" />}
                </button>
              </div>
              <span className="text-[10px] sm:text-xs text-zinc-400 font-mono">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </span>
              <button
                onClick={onToggleFullscreen}
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-400 hover:text-white active:scale-95 transition-all touch-target"
                type="button"
              >
                <Maximize2 size={18} className="sm:hidden" />
                <Maximize2 size={16} className="hidden sm:block" />
              </button>
            </div>
            <div
              className="h-2 sm:h-1.5 bg-zinc-700 rounded-full cursor-pointer touch-manipulation"
              onClick={onSeek}
              role="slider"
              aria-valuenow={state.currentTime}
              aria-valuemin={0}
              aria-valuemax={state.duration}
              tabIndex={0}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};