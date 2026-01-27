import { RefObject, useEffect, useState } from 'react';
import { CheckCircle, Play, Pause, Download, Plus, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';

interface GeneratedViewProps {
  activeTab: 'upload' | 'record' | 'text-to-speech';
  recordingTime: number;
  isPlaying: boolean;
  generatedAudioUrl: string | null;
  audioRef: RefObject<HTMLAudioElement>;
  formatRecordingTime: (seconds: number) => string;
  onPlayPause: () => void;
  onDownload: () => void;
  onReset: () => void;
  onAudioEnded: () => void;
  onBack: () => void;
}

const DEFAULT_PREVIEW_DURATION_SECONDS = 15;

export const GeneratedView = ({
  activeTab,
  recordingTime,
  isPlaying,
  generatedAudioUrl,
  audioRef,
  formatRecordingTime,
  onPlayPause,
  onDownload,
  onReset,
  onAudioEnded,
  onBack,
}) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudioError, setHasAudioError] = useState(false);

  // Update audio time and duration
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleError = () => {
      console.error('Audio playback error:', audio.error);
      setHasAudioError(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('error', handleError);
    };
  }, [audioRef, generatedAudioUrl]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      {/* Back button in top-left */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors z-10"
        type="button"
        aria-label="Go back"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="text-center max-w-md w-full px-4">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {activeTab === 'text-to-speech' ? t('voiceClone.voiceGenerated') : t('voiceClone.voiceGenerated')}
        </h2>
        <p className="text-zinc-400 mb-6">{t('voiceClone.ready')}</p>
        
        {activeTab === 'text-to-speech' && generatedAudioUrl ? (
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            {hasAudioError && (
              <p className="text-red-400 text-sm mb-4">
                Failed to load audio. Please try again.
              </p>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={onPlayPause}
                disabled={hasAudioError}
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                type="button"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </button>
              <div className="flex-1">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration) || formatRecordingTime(DEFAULT_PREVIEW_DURATION_SECONDS)}</span>
                </div>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={generatedAudioUrl}
              onEnded={onAudioEnded}
              onLoadedMetadata={() => {
                if (audioRef.current) {
                  setDuration(audioRef.current.duration);
                }
              }}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                }
              }}
              onError={(e) => {
                console.error('Audio element error:', e);
                setHasAudioError(true);
              }}
              className="hidden"
              preload="metadata"
            />
          </div>
        ) : activeTab !== 'text-to-speech' ? (
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <p className="text-zinc-400 text-sm mb-4">
              Voice cloned successfully! Go to the Text-to-Speech tab to generate audio with your cloned voice.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl p-6 mb-6">
            <p className="text-red-400 text-sm">
              No audio generated. Please try again.
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {activeTab === 'text-to-speech' && generatedAudioUrl && (
            <button
              onClick={onDownload}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
              type="button"
            >
              <Download size={18} />
              {t('common.download')}
            </button>
          )}
          <button
            onClick={onReset}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
            type="button"
          >
            <Plus size={18} />
            {t('action.createNew')}
          </button>
        </div>
      </div>
    </div>
  );
};