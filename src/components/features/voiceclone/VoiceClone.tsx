import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { usePaywall } from '../../../hooks/usePaywall';
import {
  RECORDING_INTERVAL_MS,
  GENERATION,
} from '../../../constants/generation';
import { VoiceUploader } from './VoiceUploader';
import { VoiceRecorder } from './VoiceRecorder';
import { TextToSpeechTab } from './TextToSpeechTab';
import { GeneratingOverlay } from './GeneratingOverlay';
import { GeneratedView } from './GeneratedView';
import { VOICE_OPTIONS } from './constants';
import { voiceCloneService } from '../../../services/api/voiceCloneService';
import { ttsService } from '../../../services/api/ttsService';

interface VoiceCloneProps {
  onBack: () => void;
}

type TabType = 'upload' | 'record' | 'text-to-speech';

export const VoiceClone = ({ onBack }: VoiceCloneProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState<string>('1');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [textToSpeak, setTextToSpeak] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null); // Store cloned ID
  
  const [emotion, setEmotion] = useState('neutral');
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (generatedAudioUrl) {
        URL.revokeObjectURL(generatedAudioUrl);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [recordedUrl, generatedAudioUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.name.endsWith('.mp3'))) {
      setUploadedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
        setRecordedBlob(audioBlob);
        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl);
        }
        const url = URL.createObjectURL(audioBlob);
        setRecordedUrl(url);
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, RECORDING_INTERVAL_MS);
    } catch (error) {
      setIsRecording(false);
    }
  }, [recordedUrl]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  const formatRecordingTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!requireSubscription('Voice Clone')) return;
    setIsGenerating(true);
    setGenerationProgress(10); // Start progress

    try {
      if (activeTab === 'upload' && uploadedFile) {
        // Voice Cloning from Upload
        const response = await voiceCloneService.addVoice(`Cloned Voice ${Date.now()}`, [uploadedFile]);
        setClonedVoiceId(response.voice_id);
        // Switch to TTS tab automatically or show success
        alert(`Voice cloned successfully! ID: ${response.voice_id}`);
        setActiveTab('text-to-speech');
        setSelectedVoice(response.voice_id); // Auto-select new voice (needs to be added to options list ideally, but ID works)
        setIsGenerated(true);

      } else if (activeTab === 'record' && recordedBlob) {
        // Voice Cloning from Recording
        const file = new File([recordedBlob], "recording.webm", { type: recordedBlob.type });
        const response = await voiceCloneService.addVoice(`Cloned Voice ${Date.now()}`, [file]);
        setClonedVoiceId(response.voice_id);
        alert(`Voice cloned successfully! ID: ${response.voice_id}`);
        setActiveTab('text-to-speech');
        setSelectedVoice(response.voice_id);
        setIsGenerated(true);

      } else if (activeTab === 'text-to-speech' && textToSpeak && selectedVoice) {
        // TTS Generation
        setGenerationProgress(50);
        const result = await ttsService.generateWithVoice(textToSpeak, selectedVoice);
        setGeneratedAudioUrl(result.audio_url);
        setIsGenerated(true);
      }
      
      setGenerationProgress(100);
    } catch (error) {
      console.error(error);
      alert('Operation failed. See console.');
    } finally {
          setIsGenerating(false);
    }
  }, [activeTab, textToSpeak, selectedVoice, recordedBlob, uploadedFile]);

  const resetState = useCallback(() => {
    setIsGenerated(false);
    setUploadedFile(null);
    setHasRecording(false);
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    if (generatedAudioUrl) {
      URL.revokeObjectURL(generatedAudioUrl);
    }
    setGeneratedAudioUrl(null);
    setTextToSpeak('');
    setSelectedVoice('');
    setEmotion('neutral');
    setSpeed(1);
    setPitch(1);
    setIsPlaying(false);
    setClonedVoiceId(null);
  }, [recordedUrl, generatedAudioUrl]);

  const playGeneratedAudio = useCallback(() => {
    if (generatedAudioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Failed to play audio:', error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    } else if (!generatedAudioUrl) {
      console.warn('No audio URL available to play');
    }
  }, [isPlaying, generatedAudioUrl]);

  const downloadAudio = useCallback(() => {
    if (generatedAudioUrl) {
        // Helper to download blob url
        const link = document.createElement('a');
        link.href = generatedAudioUrl;
        link.download = `generated_audio_${Date.now()}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cloned_voice_${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = uploadedFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [activeTab, recordedBlob, uploadedFile, generatedAudioUrl]);

  const canGenerate = useCallback((): boolean => {
    if (activeTab === 'upload') return !!uploadedFile;
    if (activeTab === 'record') return hasRecording;
    if (activeTab === 'text-to-speech') return !!textToSpeak && !!selectedVoice;
    return false;
  }, [activeTab, uploadedFile, hasRecording, textToSpeak, selectedVoice]);

  return (
    <div className="h-dvh min-h-screen bg-background text-white font-sans flex flex-col overflow-hidden safe-area-inset-top">
      <header className="min-h-14 sm:min-h-16 bg-background border-b border-white/5 flex items-center px-4 sm:px-6 py-3 shrink-0 z-50 gap-3 sm:gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 flex items-center justify-center transition-colors touch-target active:scale-95 shrink-0"
          type="button"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-white">{t('voiceClone.title')}</h1>
          <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
            {activeTab === 'upload' && t('voiceClone.uploadDesc')}
            {activeTab === 'record' && t('voiceClone.recordDesc')}
            {activeTab === 'text-to-speech' && t('voiceClone.ttsDesc')}
          </p>
        </div>
      </header>
      
      <div className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex rounded-xl overflow-hidden border border-white/10 bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 sm:py-3 text-xs sm:text-sm font-medium transition-all touch-target active:scale-[0.98] ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white active:bg-white/5'
            }`}
            type="button"
          >
            <span className="hidden sm:inline">{t('voiceClone.upload')}</span>
            <span className="sm:hidden">📤</span>
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`flex-1 py-3 sm:py-3 text-xs sm:text-sm font-medium transition-all touch-target active:scale-[0.98] ${
              activeTab === 'record'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white active:bg-white/5'
            }`}
            type="button"
          >
            <span className="hidden sm:inline">{t('voiceClone.record')}</span>
            <span className="sm:hidden">🎙️</span>
          </button>
          <button
            onClick={() => setActiveTab('text-to-speech')}
            className={`flex-1 py-3 sm:py-3 text-xs sm:text-sm font-medium transition-all touch-target active:scale-[0.98] ${
              activeTab === 'text-to-speech'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white active:bg-white/5'
            }`}
            type="button"
          >
            <span className="hidden sm:inline">{t('voiceClone.tts')}</span>
            <span className="sm:hidden">🔊</span>
          </button>
        </div>
      </div>

      {isGenerating && (
        <GeneratingOverlay generationProgress={generationProgress} />
      )}

      {isGenerated && (
        <GeneratedView
          activeTab={activeTab}
          recordingTime={recordingTime}
          isPlaying={isPlaying}
          generatedAudioUrl={generatedAudioUrl}
          audioRef={audioRef}
          formatRecordingTime={formatRecordingTime}
          onPlayPause={playGeneratedAudio}
          onDownload={downloadAudio}
          onReset={resetState}
          onAudioEnded={() => setIsPlaying(false)}
          onBack={onBack}
        />
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain px-3 sm:px-6 pb-6 safe-area-inset-bottom">
        {activeTab === 'upload' && (
          <VoiceUploader
            uploadedFile={uploadedFile}
            isDragging={isDragging}
            canGenerate={canGenerate()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onRemoveFile={() => setUploadedFile(null)}
            onGenerate={handleGenerate}
          />
        )}
        {activeTab === 'record' && (
          <VoiceRecorder
            selectedTextId={selectedTextId}
            isRecording={isRecording}
            recordingTime={recordingTime}
            hasRecording={hasRecording}
            recordedUrl={recordedUrl}
            canGenerate={canGenerate()}
            formatRecordingTime={formatRecordingTime}
            onSelectText={setSelectedTextId}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onDeleteRecording={() => {
              setHasRecording(false);
              setRecordingTime(0);
              setRecordedBlob(null);
              if (recordedUrl) {
                URL.revokeObjectURL(recordedUrl);
              }
              setRecordedUrl(null);
            }}
            onGenerate={handleGenerate}
          />
        )}
        {activeTab === 'text-to-speech' && (
          <TextToSpeechTab
            textToSpeak={textToSpeak}
            selectedVoice={selectedVoice}
            emotion={emotion}
            speed={speed}
            pitch={pitch}
            canGenerate={canGenerate()}
            onTextChange={setTextToSpeak}
            onVoiceChange={setSelectedVoice}
            onEmotionChange={setEmotion}
            onSpeedChange={setSpeed}
            onPitchChange={setPitch}
            onGenerate={handleGenerate}
          />
        )}
      </div>
    </div>
  );
};
