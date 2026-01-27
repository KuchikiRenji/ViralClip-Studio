import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Play,
  Pause,
  Check,
  Loader2,
  FileText,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { MAX_UPLOAD_SIZE_MB } from '../../../constants/upload';
import { TIMING } from '../../../constants/timing';
import { formatTime } from '../../../utils/timeUtils';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useTranscriberUpload } from './useTranscriberUpload';
import { TranscriptionSegments } from './TranscriptionSegments';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
interface VideoTranscriberProps {
  onBack: () => void;
}
interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}
type TabType = 'upload' | 'link';
type TranscriptionStatus = 'idle' | 'uploading' | 'transcribing' | 'complete' | 'error';
export const VideoTranscriber = ({ onBack }: VideoTranscriberProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [videoLink, setVideoLink] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
    };
  }, [uploadedVideoUrl]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const active = segments.find(
        (s) => video.currentTime >= s.startTime && video.currentTime <= s.endTime
      );
      setActiveSegmentId(active?.id || null);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    const handleEnded = () => {
      setIsPlaying(false);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [segments]);
  const uploadHandlers = useTranscriberUpload({
    activeTab,
    videoLink,
    uploadedFile,
    uploadedVideoUrl,
    isDragging,
    onSetActiveTab: setActiveTab,
    onSetVideoLink: setVideoLink,
    onSetUploadedFile: setUploadedFile,
    onSetUploadedVideoUrl: setUploadedVideoUrl,
    onSetIsDragging: setIsDragging,
    onSetSegments: setSegments,
    onSetStatus: setStatus,
    onSetErrorMessage: setErrorMessage,
  });
  const { startTranscription: startSpeechRecognition } = useSpeechRecognition({
    setSegments,
    setStatus,
    setProgress,
    setErrorMessage,
    uploadedFile,
    videoLink,
  });
  const startTranscription = useCallback(() => {
    if (!uploadedVideoUrl && !videoLink) return;
    if (!requireSubscription('Transcriber')) return;
    startSpeechRecognition();
  }, [uploadedVideoUrl, videoLink, startSpeechRecognition, requireSubscription]);
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  const handleSeekToSegment = useCallback((segment: TranscriptionSegment) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = segment.startTime;
    setActiveSegmentId(segment.id);
  }, []);
  const handleCopyTranscript = useCallback(() => {
    const fullText = segments.map((s) => `[${formatTime(s.startTime)}] ${s.text}`).join('\n');
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), TIMING.COPY_FEEDBACK_MS);
    });
  }, [segments]);
  const handleDownloadTranscript = useCallback(() => {
    const fullText = segments.map((s) => `[${formatTime(s.startTime)}] ${s.text}`).join('\n');
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [segments]);
  return (
    <div className="h-dvh min-h-screen bg-background text-white font-sans flex flex-col overflow-hidden safe-area-inset-top">
      <header className="min-h-14 sm:min-h-16 bg-background border-b border-white/5 flex items-center justify-between px-4 sm:px-6 py-3 shrink-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95 shrink-0"
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-white">{t('videoTranscriber.title')}</h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">{t('videoTranscriber.subtitle')}</p>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 p-3 sm:p-6 overflow-y-auto custom-scrollbar overscroll-contain">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex gap-1 sm:gap-2 p-1 bg-zinc-900 rounded-xl">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all touch-target active:scale-[0.98] ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white active:bg-zinc-800'
                }`}
                type="button"
              >
                <Upload size={18} />
                <span className="hidden xs:inline">{t('videoTranscriber.tab.upload')}</span>
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all touch-target active:scale-[0.98] ${
                  activeTab === 'link'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white active:bg-zinc-800'
                }`}
                type="button"
              >
                <LinkIcon size={18} />
                <span className="hidden xs:inline">{t('videoTranscriber.tab.link')}</span>
              </button>
            </div>
            {activeTab === 'upload' && (
              <div
                onDragOver={uploadHandlers.handleDragOver}
                onDragLeave={uploadHandlers.handleDragLeave}
                onDrop={uploadHandlers.handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all touch-manipulation ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : uploadedFile
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-zinc-700 hover:border-zinc-600 active:border-blue-500 active:bg-blue-500/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={uploadHandlers.handleFileInputChange}
                  className="hidden"
                />
                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-green-500/20 rounded-2xl flex items-center justify-center">
                      <Check size={28} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold truncate max-w-[200px] sm:max-w-xs mx-auto text-sm sm:text-base">{uploadedFile.name}</p>
                      <p className="text-green-400 text-sm mt-1">{t('videoTranscriber.ready')}</p>
                    </div>
                    <button
                      onClick={uploadHandlers.handleRemoveFile}
                      className="text-zinc-400 hover:text-white active:text-red-400 text-sm underline py-2 px-4 touch-target"
                      type="button"
                    >
                      {t('videoTranscriber.removeFile')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl flex items-center justify-center transition-colors ${
                      isDragging ? 'bg-blue-500/30' : 'bg-zinc-800'
                    }`}>
                      <Upload size={26} className={isDragging ? 'text-blue-400' : 'text-zinc-400'} />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm sm:text-base">
                        {isDragging ? t('videoTranscriber.dropHere') : t('videoTranscriber.uploadCta')}
                      </p>
                      <p className="text-zinc-500 text-xs sm:text-sm mt-1">{t('videoTranscriber.dragOrClick')}</p>
                      <p className="text-zinc-600 text-[11px] sm:text-xs mt-2">{t('videoTranscriber.fileInfo', { max: MAX_UPLOAD_SIZE_MB })}</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all border border-white/10 touch-target active:scale-[0.98]"
                      type="button"
                    >
                      {t('videoTranscriber.browse')}
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'link' && (
              <div className="space-y-4">
                <div className="relative flex items-center">
                  <LinkIcon size={18} className="absolute left-4 w-4.5 h-4.5 text-zinc-500 flex-shrink-0" />
                  <input
                    type="url"
                    value={videoLink}
                    onChange={(e) => setVideoLink(e.target.value)}
                    placeholder={t('videoTranscriber.urlPlaceholder')}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <p className="text-zinc-500 text-xs">
                  {t('videoTranscriber.supportedSources')}
                </p>
              </div>
            )}
            {status === 'transcribing' && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 size={20} className="text-blue-400 animate-spin" />
                  <span className="text-white font-medium">{t('videoTranscriber.transcribing')}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-zinc-500 text-xs mt-2">{t('videoTranscriber.progress', { progress })}</p>
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {errorMessage}
              </div>
            )}
            <button
              onClick={startTranscription}
              disabled={!uploadHandlers.canTranscribe || status === 'transcribing'}
              className="w-full py-4 min-h-[56px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:from-blue-700 active:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 touch-target active:scale-[0.98] shadow-lg shadow-blue-500/20"
              type="button"
            >
              {status === 'transcribing' ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t('videoTranscriber.transcribingShort')}
                </>
              ) : (
                <>
                  <FileText size={20} />
                  {t('videoTranscriber.start')}
                </>
              )}
            </button>
          </div>
        </div>
        <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col bg-zinc-900/50 safe-area-inset-bottom">
          {uploadedVideoUrl && (
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                src={uploadedVideoUrl}
                className="w-full h-full object-contain"
                muted={isMuted}
                playsInline
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={handlePlayPause}
                    className="w-12 h-12 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-full flex items-center justify-center transition-all touch-target active:scale-95"
                    type="button"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-10 h-10 sm:w-8 sm:h-8 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full flex items-center justify-center transition-all touch-target active:scale-95"
                    type="button"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <div className="flex-1 text-xs sm:text-sm text-white font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <TranscriptionSegments
            segments={segments}
            activeSegmentId={activeSegmentId}
            copied={copied}
            onSeekToSegment={handleSeekToSegment}
            onCopyTranscript={handleCopyTranscript}
            onDownloadTranscript={handleDownloadTranscript}
            formatTime={formatTime}
          />
        </div>
      </div>
    </div>
  );
};
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}