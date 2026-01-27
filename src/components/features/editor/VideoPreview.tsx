import { useRef, useCallback, RefObject } from 'react';
import { Play, Pause, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { formatTime } from '../../../utils/timeUtils';
import { EditorPanelState } from './panels';
interface VideoPreviewProps {
  backgroundType: 'image' | 'video' | 'color' | 'gradient';
  backgroundUrl: string;
  gradientColors: string[] | null;
  panelState: EditorPanelState;
  currentTime: number;
  duration: number;
  currentSlide: number;
  isPlaying: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  handlePlayPause: () => void;
  videoRef: RefObject<HTMLVideoElement>;
}
const getBackgroundStyle = (
  backgroundType: VideoPreviewProps['backgroundType'],
  backgroundUrl: string,
  gradientColors: string[] | null
) => {
  if (backgroundType === 'color') {
    return { backgroundColor: backgroundUrl };
  }
  if (backgroundType === 'gradient' && gradientColors) {
    return { background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})` };
  }
  return {};
};
export const VideoPreview = ({
  backgroundType,
  backgroundUrl,
  gradientColors,
  panelState,
  currentTime,
  duration,
  currentSlide,
  isPlaying,
  isMuted,
  setIsMuted,
  setIsFullscreen,
  handlePlayPause,
  videoRef,
}: VideoPreviewProps) => {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const handleToggleFullscreen = useCallback(() => {
    if (!previewContainerRef.current) return;
    if (!document.fullscreenElement) {
      previewContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!document.fullscreenElement);
  }, [setIsFullscreen]);
  return (
    <div className="flex-1 bg-surface-dark flex flex-col items-center justify-center p-3 sm:p-6 min-h-[250px] sm:min-h-[320px] lg:min-h-0 order-1">
      <div
        ref={previewContainerRef}
        className="relative w-full max-w-[220px] xs:max-w-[260px] sm:max-w-[320px] lg:max-w-[380px] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-2xl"
        style={getBackgroundStyle(backgroundType, backgroundUrl, gradientColors)}
      >
        {(backgroundType === 'image' || backgroundType === 'video') && backgroundUrl && (
          backgroundType === 'video' ? (
            <video
              ref={videoRef}
              src={backgroundUrl}
              className="w-full h-full object-cover"
              autoPlay={isPlaying}
              loop
              muted={isMuted}
            />
          ) : (
            <img
              src={backgroundUrl}
              alt="Video preview"
              className="w-full h-full object-cover"
            />
          )
        )}
        {panelState.textLayers.map((layer) => (
          <div
            key={layer.id}
            className="absolute flex items-center justify-center px-2"
            style={{
              left: `${layer.positionX}%`,
              top: `${layer.positionY}%`,
              transform: 'translate(-50%, -50%)',
              fontFamily: layer.font,
              fontSize: `${layer.size * 0.25}px`,
              color: layer.color,
              textAlign: layer.alignment,
            }}
          >
            <span
              className="font-bold drop-shadow-[2px_2px_0_#000] [text-shadow:2px_2px_0_#000,-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000]"
              style={{ textAlign: layer.alignment }}
            >
              {layer.text}
            </span>
          </div>
        ))}
        {panelState.talkingHead.enabled && panelState.talkingHead.selectedAvatar && (
          <div
            className={`absolute ${
              panelState.talkingHead.position === 'bottom-left' ? 'bottom-2 left-2' :
              panelState.talkingHead.position === 'bottom-right' ? 'bottom-2 right-2' :
              panelState.talkingHead.position === 'top-left' ? 'top-2 left-2' :
              'top-2 right-2'
            }`}
            style={{ width: panelState.talkingHead.size * 0.25  , height: panelState.talkingHead.size * 0.25 }}
          >
            <div
              className={`w-full h-full bg-zinc-700 border-2 border-white/30 ${
                panelState.talkingHead.shape === 'circle' ? 'rounded-full' :
                panelState.talkingHead.shape === 'rounded' ? 'rounded-lg' : ''
              }`}
            />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 sm:p-2 bg-black/50 rounded text-white hover:bg-black/70 touch-target transition-colors"
            type="button"
          >
            {isMuted ? <VolumeX size={12} className="sm:hidden" /> : <Volume2 size={12} className="sm:hidden" />}
            {isMuted ? <VolumeX size={14} className="hidden sm:block" /> : <Volume2 size={14} className="hidden sm:block" />}
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 sm:p-2 bg-black/50 rounded text-white hover:bg-black/70 touch-target transition-colors"
            type="button"
          >
            <Maximize2 size={12} className="sm:hidden" />
            <Maximize2 size={14} className="hidden sm:block" />
          </button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handlePlayPause}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white pointer-events-auto touch-target transition-all active:scale-95"
            type="button"
          >
            {isPlaying ? <Pause size={20} className="sm:hidden" /> : <Play size={20} className="sm:hidden ml-1" />}
            {isPlaying ? <Pause size={24} className="hidden sm:block" /> : <Play size={24} className="hidden sm:block ml-1" />}
          </button>
        </div>
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-[9px] sm:text-xs text-white/80 text-center bg-black/40 rounded px-2 py-1">
            Slide {currentSlide} | {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
};