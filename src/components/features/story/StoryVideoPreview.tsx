import { useRef, useCallback, useState, useEffect, RefObject, MouseEvent, CSSProperties } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import type { StoryVideoState } from './StoryVideoTypes';
import { BACKGROUND_VIDEOS, MUSIC_TRACKS, SUBTITLE_TEMPLATES, WORDS_PER_SECOND, MAX_VISIBLE_WORDS } from './StoryVideoConstants';
import { SOCIAL_TYPES } from './StoryVideoConstants';
import { useTranslation } from '../../../hooks/useTranslation';

interface StoryVideoPreviewProps {
  state: StoryVideoState;
  videoRef: RefObject<HTMLVideoElement | null>;
  audioRef: RefObject<HTMLAudioElement | null>;
  togglePlay: () => void;
  toggleMute: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  seekVideo: (e: MouseEvent<HTMLDivElement>) => void;
  formatTime: (seconds: number) => string;
}
const getCurrentWordIndex = (currentTime: number, script: string): number => {
  if (!script.trim()) return 0;
  const words = script.trim().split(/\s+/);
  return Math.floor(currentTime * WORDS_PER_SECOND) % words.length;
};
const getPreviewText = (script: string): string => {
  if (!script.trim()) return '';
  const lines = script.trim().split('\n');
  const firstLine = lines[0] || '';
  const words = firstLine.split(/\s+/).slice(0, 6);
  return words.join(' ');
};
const renderSubtitleText = (state: StoryVideoState) => {
  const selectedTemplate = SUBTITLE_TEMPLATES.find(t => t.id === state.selectedSubtitleTemplate) || SUBTITLE_TEMPLATES[5];
  const baseStyle = {
    fontFamily: selectedTemplate.fontFamily,
    textTransform: selectedTemplate.transform as CSSProperties['textTransform'],
    fontStyle: selectedTemplate.style as CSSProperties['fontStyle'],
    fontWeight: selectedTemplate.weight,
    textShadow: selectedTemplate.strokeWidth > 0
      ? `${selectedTemplate.strokeWidth}px ${selectedTemplate.strokeWidth}px 0 ${selectedTemplate.strokeColor}, -${selectedTemplate.strokeWidth}px -${selectedTemplate.strokeWidth}px 0 ${selectedTemplate.strokeColor}`
      : '2px 2px 4px rgba(0,0,0,0.8)',
    backgroundColor: selectedTemplate.bgColor !== 'transparent' ? selectedTemplate.bgColor : undefined,
  };
  if (!state.script.trim()) {
    return (
      <span
        className="px-2 py-1 text-base font-bold leading-tight"
        style={{
          ...baseStyle,
          color: selectedTemplate.color === 'rainbow' ? '#ff0000' : selectedTemplate.color === 'split' ? '#ffffff' : selectedTemplate.color,
        }}
      >
        THE QUICK
      </span>
    );
  }
  if (!state.isPlaying) {
    const previewText = getPreviewText(state.script);
    return (
      <span
        className="px-2 py-1 text-base font-bold leading-tight block"
        style={{
          ...baseStyle,
          color: selectedTemplate.color === 'rainbow' ? '#ff0000' : selectedTemplate.color === 'split' ? '#ffffff' : selectedTemplate.color,
        }}
      >
        {selectedTemplate.transform === 'uppercase' ? previewText.toUpperCase() : previewText}
        {state.script.split(/\s+/).length > 6 && '...'}
      </span>
    );
  }
  const words = state.script.trim().split(/\s+/);
  const currentWordIndex = getCurrentWordIndex(state.currentTime, state.script);
  const startIndex = Math.max(0, currentWordIndex - 1);
  const endIndex = Math.min(words.length, startIndex + MAX_VISIBLE_WORDS);
  const visibleWords = words.slice(startIndex, endIndex);
  const highlightIndex = currentWordIndex - startIndex;
  return (
    <span className="flex flex-wrap justify-center gap-x-1.5 gap-y-0.5">
      {visibleWords.map((word, index) => {
        const isHighlighted = index === highlightIndex;
        let wordColor = selectedTemplate.color;
        if (selectedTemplate.color === 'rainbow') {
          const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
          wordColor = colors[(startIndex + index) % colors.length];
        } else if (selectedTemplate.color === 'split') {
          wordColor = isHighlighted ? '#ffff00' : '#ffffff';
        } else if (isHighlighted) {
          wordColor = '#ffff00';
        }
        return (
          <span
            key={`${startIndex + index}-${word}`}
            className={`px-0.5 py-0.5 text-base font-bold transition-all duration-200 ${
              isHighlighted ? 'scale-110 drop-shadow-lg' : 'opacity-80'
            }`}
            style={{
              ...baseStyle,
              color: wordColor,
            }}
          >
            {selectedTemplate.transform === 'uppercase' ? word.toUpperCase() : word}
          </span>
        );
      })}
    </span>
  );
};
const renderSocialWidget = (state: StoryVideoState, t: (key: string) => string) => {
  const socialConfig = SOCIAL_TYPES.find(s => s.id === state.socialType);
  if (!socialConfig || !state.script.trim()) return null;
  const IconComponent = socialConfig.icon;
  const previewScript = state.script.split('\n').slice(0, 3).join('\n');
  const truncatedScript = previewScript.length > 100 ? previewScript.substring(0, 100) + '...' : previewScript;
  return (
    <div className="absolute top-4 left-2 right-2 z-10">
      <div className={`rounded-lg p-2 backdrop-blur-sm ${
        state.socialType === 'reddit' ? 'bg-orange-600/90' :
        state.socialType === 'instagram' ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90' :
        state.socialType === 'twitter' ? 'bg-black/90 border border-zinc-600' :
        'bg-zinc-800/90'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <IconComponent className="w-4 h-4 text-white" />
          <span className="text-xs font-medium text-white">{t(socialConfig.nameKey)}</span>
        </div>
        <p className="text-[10px] text-white/90 leading-tight line-clamp-3">
          {truncatedScript}
        </p>
      </div>
    </div>
  );
};
const getVideoSource = (state: StoryVideoState): string | null => {
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
export const StoryVideoPreview = ({
  state,
  videoRef,
  audioRef,
  togglePlay,
  toggleMute,
  handleTimeUpdate,
  handleLoadedMetadata,
  seekVideo,
  formatTime,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(false);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(true);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const videoSrc = getVideoSource(state);
  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'w-full max-w-[280px] lg:w-[280px] shrink-0'}`}>
      <div className={`${isFullscreen ? 'w-full h-full flex items-center justify-center' : 'lg:sticky lg:top-8'}`} ref={containerRef}>
        <div className={`bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 ${isFullscreen ? 'w-auto h-full max-h-screen aspect-[9/16]' : ''}`}>
          <div className="aspect-[9/16] relative">
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover"
                loop
                muted
                autoPlay
                playsInline
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  const selectedVideo = BACKGROUND_VIDEOS.find(v => v.src === videoSrc);
                  const fallbackPoster = selectedVideo?.thumbnail;
                  if (parent && fallbackPoster) {
                    const img = document.createElement('img');
                    img.src = fallbackPoster;
                    img.className = "w-full h-full object-cover opacity-90";
                    parent.appendChild(img);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <p className="text-sm">{t('storyVideo.background.noVideo')}</p>
                </div>
              </div>
            )}
            {state.backgroundMusicEnabled && (
              <audio
                ref={audioRef}
                crossOrigin="anonymous"
                src={state.musicSource === 'upload' && state.uploadedMusicUrl 
                  ? state.uploadedMusicUrl 
                  : MUSIC_TRACKS.find(t => t.id === state.selectedMusic)?.src}
                loop
                muted={state.isMuted}
              />
            )}
            {renderSocialWidget(state, t)}
            {state.subtitlesEnabled && (
              <div
                className={`absolute left-2 right-2 text-center ${
                  state.subtitlePosition === 'top' ? 'top-20' :
                  state.subtitlePosition === 'center' ? 'top-1/2 -translate-y-1/2' :
                  'bottom-16'
                }`}
              >
                {renderSubtitleText(state)}
              </div>
            )}
          </div>
          <div className="bg-zinc-800 px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white hover:bg-zinc-600 active:bg-zinc-500 transition-colors touch-target active:scale-95"
                >
                  {state.isPlaying ? <Pause size={14} /> : <Play size={14} fill="white" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="text-zinc-400 hover:text-white active:text-white transition-colors touch-target active:scale-95"
                >
                  {state.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </span>
              <button 
                onClick={toggleFullscreen}
                className="text-zinc-400 hover:text-white active:text-white transition-colors touch-target active:scale-95"
                title={isFullscreen ? t('storyVideo.exitFullscreen') : t('storyVideo.fullscreen')}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
            <div
              className="h-1.5 bg-zinc-700 rounded-full cursor-pointer"
              onClick={seekVideo}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(state.currentTime / state.duration) * 100}%` }}
              />
            </div>
          </div>
        </div>
        {state.backgroundMusicEnabled && state.musicSource === 'upload' && state.uploadedMusicFile && (
          <div className="mt-2 text-xs text-zinc-500 text-center">
            🎵 {state.uploadedMusicFile.name}
          </div>
        )}
      </div>
    </div>
  );
};