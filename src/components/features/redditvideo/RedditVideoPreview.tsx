import { RefObject, SyntheticEvent, MouseEvent } from 'react';
import { Play, Pause, Volume2, VolumeX, CheckCircle2, MessageCircle, Share2, Heart } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { RedditVideoState } from './types';
import { BACKGROUND_VIDEOS } from './constants';
import sharedStyles from './RedditVideo.module.css';

interface RedditVideoPreviewProps {
  state: RedditVideoState;
  videoRef: RefObject<HTMLVideoElement>;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onTimeUpdate: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onLoadedMetadata: (e: SyntheticEvent<HTMLVideoElement>) => void;
  onSeek: (e: MouseEvent<HTMLDivElement>) => void;
  formatTime: (seconds: number) => string;
}

export const RedditVideoPreview = ({
  state,
  videoRef,
  onTogglePlay,
  onToggleMute,
  onTimeUpdate,
  onLoadedMetadata,
  onSeek,
  formatTime,
}: RedditVideoPreviewProps) => {
  const { t } = useTranslation();

  const progressPercent = state.duration > 0
    ? (state.currentTime / state.duration) * 100
    : 0;

  const selectedBackground = BACKGROUND_VIDEOS.find(b => b.id === state.selectedBackground);
  const backgroundPoster = selectedBackground?.thumbnail || '';
  const hasVideoBackground = Boolean(state.uploadedBackgroundUrl);

  const renderIntroCard = () => {
    if (!state.showIntroCard) return null;

    const cardBg = state.isDarkMode ? 'bg-zinc-900' : 'bg-white';
    const textColor = state.isDarkMode ? 'text-white' : 'text-zinc-900';
    const subTextColor = state.isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
    const borderColor = state.isDarkMode ? 'border-zinc-800' : 'border-zinc-200';

    return (
      <div className={`absolute top-4 left-4 right-4 ${cardBg} rounded-xl p-4 shadow-xl border ${borderColor} z-20`}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center overflow-hidden flex-shrink-0">
            {state.intro.avatarUrl ? (
              <img
                src={state.intro.avatarUrl}
                alt={state.intro.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {state.intro.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-semibold text-sm ${textColor}`}>
                {state.intro.username}
              </span>
              {state.intro.isVerified && (
                <CheckCircle2 size={14} className="text-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {state.intro.reactions.slice(0, 6).map((emoji) => (
                <span key={emoji} className="text-xs">{emoji}</span>
              ))}
            </div>
            <p className={`text-xs ${subTextColor} mt-2 line-clamp-3`}>
              {state.intro.description}
            </p>
          </div>
        </div>

        <div className={`flex items-center justify-between mt-3 pt-3 border-t ${borderColor}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart size={14} className={subTextColor} />
              <span className={`text-xs ${subTextColor}`}>{state.intro.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle size={14} className={subTextColor} />
              <span className={`text-xs ${subTextColor}`}>{state.intro.comments}</span>
            </div>
          </div>
          <button className={`text-xs ${subTextColor} flex items-center gap-1`} type="button">
            <Share2 size={12} />
            {t('redditVideo.preview.share')}
          </button>
        </div>
      </div>
    );
  };

  const getScriptWords = (content: string) =>
    content
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);

  const getLinesForTime = () => {
    const content = state.scriptContent.trim();
    if (!content) return '';

    if (state.subtitleDisplayMode === 'oneWord') {
      const words = getScriptWords(content);
      if (words.length === 0) return '';
      const duration = Math.max(state.duration || state.lengthSeconds, 1);
      const wordsPerSecond = words.length / duration;
      const index = Math.min(Math.floor(state.currentTime * wordsPerSecond), words.length - 1);
      return words[index] ?? '';
    }

    const rawLines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const lines = rawLines.length > 0 ? rawLines : [content];
    const duration = Math.max(state.duration || state.lengthSeconds, 1);
    const segmentCount = Math.max(Math.ceil(duration / 3), 1);
    const segmentIndex = Math.min(Math.floor((state.currentTime / duration) * segmentCount), segmentCount - 1);
    const itemsPerSegment = Math.max(Math.ceil(lines.length / segmentCount), 1);
    const start = segmentIndex * itemsPerSegment;
    const segmentLines = lines.slice(start, start + itemsPerSegment).slice(0, 2);
    return segmentLines.join('\n');
  };

  const renderScriptPreview = () => {
    const text = getLinesForTime();
    if (!text) return null;

    const displayLines = text.split('\n').slice(0, 3);
    const animationClass = state.subtitleStyle.animation === 'fade'
      ? sharedStyles.subtitleFade
      : state.subtitleStyle.animation === 'pop'
        ? sharedStyles.subtitlePop
        : '';
    const highlightClass = state.subtitleStyle.animation === 'word-highlight' ? sharedStyles.subtitleHighlight : '';
    const hasBackground = state.subtitleStyle.backgroundColor !== 'transparent' && state.subtitleStyle.backgroundColor !== 'rgba(0,0,0,0)';

    return (
      <div
        className="absolute left-4 right-4 z-20 pointer-events-none"
        style={{
          [state.subtitleStyle.position === 'top' ? 'top' : state.subtitleStyle.position === 'center' ? 'top' : 'bottom']:
            state.subtitleStyle.position === 'center' ? '50%' : state.showIntroCard ? '160px' : '40px',
          transform: state.subtitleStyle.position === 'center' ? 'translateY(-50%)' : 'none',
        }}
      >
        <div
          className={`p-3 rounded-xl text-center ${animationClass} ${highlightClass}`}
          style={{
            backgroundColor: state.subtitleStyle.backgroundColor,
            fontFamily: state.subtitleStyle.fontFamily,
            fontSize: `${state.subtitleStyle.fontSize * 0.65}px`,
            color: state.subtitleStyle.color,
            textShadow: !hasBackground ? '0 0 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)' : 'none',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          {state.subtitleDisplayMode === 'oneWord' ? (
            <p className="leading-none tracking-tight font-black uppercase">{displayLines[0]}</p>
          ) : (
            displayLines.map((line) => (
              <p key={line} className="leading-tight font-black uppercase">
                {line}
              </p>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[280px] mx-auto">
      <div className="bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
        <div className="aspect-[9/16] relative bg-black">
          {hasVideoBackground ? (
            <video
              ref={videoRef}
              src={state.uploadedBackgroundUrl ?? undefined}
              className="w-full h-full object-cover"
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              muted
              playsInline
              loop
              autoPlay
              preload="auto"
              poster={backgroundPoster || undefined}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && backgroundPoster) {
                  const img = document.createElement('img');
                  img.src = backgroundPoster;
                  img.className = "w-full h-full object-cover opacity-90";
                  parent.appendChild(img);
                }
              }}
            />
          ) : (
            <img
              src={backgroundPoster}
              alt={selectedBackground?.title ?? 'Background'}
              className="w-full h-full object-cover opacity-90"
              loading="lazy"
              width={280}
              height={498}
              decoding="async"
            />
          )}

          {renderIntroCard()}
          {renderScriptPreview()}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={onTogglePlay}
              className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center touch-target-lg"
              type="button"
            >
              {state.isPlaying ? (
                <Pause size={28} className="text-white" />
              ) : (
                <Play size={28} className="text-white ml-1" />
              )}
            </button>
          </div>
        </div>

        <div className="p-3 bg-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white hover:bg-zinc-600 transition-colors touch-target"
              type="button"
            >
              {state.isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <div
              className="flex-1 h-1.5 bg-zinc-700 rounded-full cursor-pointer touch-manipulation"
              onClick={onSeek}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <button
              onClick={onToggleMute}
              className="text-zinc-400 hover:text-white transition-colors touch-target"
              type="button"
            >
              {state.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono">{formatTime(state.currentTime)}</span>
            <span className="font-mono">{formatTime(state.duration)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="text-center">
          <h3 className="text-sm font-medium text-white">{t('redditVideo.preview.introTitle')}</h3>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {state.intro.avatarUrl ? (
                <img
                  src={state.intro.avatarUrl}
                  alt={state.intro.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xs">
                  {state.intro.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium text-xs text-white">
                  {state.intro.username}
                </span>
                {state.intro.isVerified && (
                  <CheckCircle2 size={12} className="text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {state.intro.reactions.slice(0, 4).map((emoji) => (
                  <span key={emoji} className="text-[10px]">{emoji}</span>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                {state.intro.description}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-zinc-500">❤️ {state.intro.likes}</span>
                <span className="text-[10px] text-zinc-500">💬 {state.intro.comments}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-sm font-medium text-white">{t('redditVideo.preview.scriptTitle')}</h3>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 min-h-[80px]">
          {state.scriptContent ? (
            <p className="text-xs text-zinc-400 line-clamp-4">
              {state.scriptContent}
            </p>
          ) : (
            <p className="text-xs text-zinc-600 italic">
              {t('redditVideo.preview.emptyScript')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
