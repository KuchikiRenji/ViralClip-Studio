import { useCallback, useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, Square, Trash2, Volume2, Loader2, Sparkles } from 'lucide-react';
import { VOICE_PRESETS } from '../../../../constants/voice';
import { EditorPanelState, AudioTrackState } from './types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { usePaywall } from '../../../../hooks/usePaywall';
import { ttsService } from '../../../../services/api/ttsService';

interface VoiceOverPanelProps {
  state: EditorPanelState;
  onStateChange: (updates: Partial<EditorPanelState>) => void;
  onAddAudioTrack?: (track: AudioTrackState) => void;
}

export const VoiceOverPanel = ({
  state,
  onStateChange,
  onAddAudioTrack,
}: VoiceOverPanelProps) => {
  const { t } = useTranslation();
  const { requireSubscription } = usePaywall();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(VOICE_PRESETS[0]?.id || null);
  const [textToSpeech, setTextToSpeech] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [volume, setVolume] = useState(100);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordedAudio && recordedAudio.startsWith('blob:')) {
        URL.revokeObjectURL(recordedAudio);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [recordedAudio]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const playRecording = useCallback(() => {
    if (!recordedAudio) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(recordedAudio);
      audioRef.current.volume = volume / 100;
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [recordedAudio, isPlaying, volume]);

  const deleteRecording = useCallback(() => {
    if (recordedAudio && recordedAudio.startsWith('blob:')) {
      URL.revokeObjectURL(recordedAudio);
      setRecordedAudio(null);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setRecordingTime(0);
  }, [recordedAudio]);

  const handleAddToTimeline = useCallback(() => {
    if (!recordedAudio || !onAddAudioTrack) return;
    const trackTitle = t('voicePanel.recordingReady');
    const track: AudioTrackState = {
      id: `voiceover-${Date.now()}`,
      title: trackTitle,
      name: trackTitle,
      url: recordedAudio,
      duration: recordingTime,
      volume: volume / 100,
      type: 'voiceover',
    };
    onAddAudioTrack(track);
    setRecordedAudio(null); // Clear from panel after adding
  }, [recordedAudio, recordingTime, volume, onAddAudioTrack, t]);

  const handleGenerateTTS = useCallback(async () => {
    if (!textToSpeech.trim() || !selectedVoice) return;
    if (!requireSubscription('Voiceover')) return;
    setIsGenerating(true);
    try {
      const response = await ttsService.generateSpeech({
        text: textToSpeech,
        voice: selectedVoice,
      });
      
      if (response.audio_url) {
        setRecordedAudio(response.audio_url);
        // Estimate duration roughly (150 words per minute avg)
        const wordCount = textToSpeech.split(' ').length;
        setRecordingTime(Math.max(2, Math.ceil((wordCount / 150) * 60)));
        setTextToSpeech('');
      }
    } catch (err) {
      console.error('TTS Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [textToSpeech, selectedVoice, requireSubscription]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
          <Mic size={14} className="text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">{t('voicePanel.title')}</h3>
          <p className="text-[10px] text-zinc-500">{t('voicePanel.subtitle')}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          <div className="p-4 bg-zinc-800/30 rounded-xl border border-white/5">
            <div className="text-center">
              {isRecording ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <Mic size={20} className="text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-mono text-white mb-1">{formatTime(recordingTime)}</div>
                  <p className="text-xs text-red-400 mb-4">{t('voicePanel.recording')}</p>
                  <button
                    onClick={stopRecording}
                    className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mx-auto transition-colors shadow-lg shadow-red-500/20"
                    type="button"
                  >
                    <Square size={14} fill="currentColor" /> {t('voicePanel.stopRecording')}
                  </button>
                </>
              ) : recordedAudio ? (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                    <Volume2 size={24} className="text-green-400" />
                  </div>
                  <div className="text-sm font-semibold text-white mb-0.5">{t('voicePanel.recordingReady')}</div>
                  <div className="text-xs text-zinc-400 mb-4">{formatTime(recordingTime)} {t('voicePanel.duration')}</div>
                  <div className="flex justify-center gap-2 mb-4">
                    <button
                      onClick={playRecording}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      type="button"
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      {isPlaying ? t('voicePanel.pause') : t('voicePanel.play')}
                    </button>
                    <button
                      onClick={deleteRecording}
                      className="px-4 py-2 bg-zinc-700 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      type="button"
                    >
                      <Trash2 size={14} /> {t('voicePanel.delete')}
                    </button>
                  </div>
                  <div className="mb-4 px-2">
                    <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5">
                      <span>{t('voicePanel.volume')}</span>
                      <span>{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-zinc-700 rounded-lg accent-blue-500 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={handleAddToTimeline}
                    className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-green-900/20"
                    type="button"
                  >
                    {t('voicePanel.addToTimeline')}
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center mb-3 border-2 border-dashed border-zinc-700">
                    <Mic size={24} className="text-zinc-500" />
                  </div>
                  <p className="text-xs text-zinc-400 mb-4">{t('voicePanel.tapToStart')}</p>
                  <button
                    onClick={startRecording}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-blue-900/20"
                    type="button"
                  >
                    <Mic size={16} /> {t('voicePanel.startRecording')}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="border-t border-white/5 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-xs font-semibold text-white">{t('voicePanel.aiTTS')}</span>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('voicePanel.selectVoice')}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {VOICE_PRESETS.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedVoice === voice.id
                        ? 'bg-purple-600/20 border-purple-500/50 text-white'
                        : 'bg-zinc-800/30 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                    type="button"
                  >
                    <div className="text-xs font-medium truncate">{voice.name}</div>
                    <div className="text-[9px] text-zinc-500">{voice.gender} • {voice.accent}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{t('voicePanel.script')}</span>
              <textarea
                value={textToSpeech}
                onChange={(e) => setTextToSpeech(e.target.value)}
                placeholder={t('voicePanel.scriptPlaceholder')}
                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 resize-none outline-none focus:border-purple-500/50 transition-colors"
                rows={3}
              />
            </div>
            <button
              onClick={handleGenerateTTS}
              disabled={!textToSpeech.trim() || !selectedVoice || isGenerating}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 disabled:shadow-none"
              type="button"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {t('voicePanel.generating')}
                </>
              ) : (
                <>
                  <Sparkles size={16} /> {t('voicePanel.generateVoice')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};