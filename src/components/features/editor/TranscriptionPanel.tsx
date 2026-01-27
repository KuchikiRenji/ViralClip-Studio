import { useState, useCallback, useRef } from 'react';
import { 
  Mic, 
  Upload, 
  Wand2, 
  Loader2, 
  Check, 
  AlertCircle, 
  Play, 
  Pause,
  Download,
  Edit3,
  Trash2,
  Clock,
  Languages
} from 'lucide-react';
import { Caption, CaptionStyle } from '../../../types';
import { CAPTION_STYLE_PRESETS, generateSRT, generateVTT } from '../../../utils/captionUtils';
import { useTranslation } from '../../../hooks/useTranslation';

interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker?: string;
}

interface TranscriptionPanelProps {
  audioUrl?: string;
  videoDuration: number;
  onCaptionsGenerated: (captions: Caption[]) => void;
  currentTime: number;
  onSeek: (time: number) => void;
}

type TranscriptionStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
type TranscriptionLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'auto';

const LANGUAGE_OPTIONS: { value: TranscriptionLanguage; label: string; flag: string }[] = [
  { value: 'auto', label: 'Auto Detect', flag: '🌐' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Spanish', flag: '🇪🇸' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'de', label: 'German', flag: '🇩🇪' },
  { value: 'it', label: 'Italian', flag: '🇮🇹' },
  { value: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { value: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { value: 'ko', label: 'Korean', flag: '🇰🇷' },
  { value: 'zh', label: 'Chinese', flag: '🇨🇳' },
];

const SAMPLE_TRANSCRIPTION: TranscriptionSegment[] = [
  { id: 't1', startTime: 0, endTime: 3, text: "Hey everyone, welcome back to the channel!", confidence: 0.95, speaker: 'Speaker 1' },
  { id: 't2', startTime: 3.2, endTime: 6.5, text: "Today we're going to talk about something really exciting.", confidence: 0.92, speaker: 'Speaker 1' },
  { id: 't3', startTime: 6.8, endTime: 9.5, text: "This is going to be a game changer for your content.", confidence: 0.88, speaker: 'Speaker 1' },
  { id: 't4', startTime: 10, endTime: 12.5, text: "Let me show you exactly how it works.", confidence: 0.94, speaker: 'Speaker 1' },
  { id: 't5', startTime: 13, endTime: 15.5, text: "First, you need to understand the basics.", confidence: 0.91, speaker: 'Speaker 1' },
  { id: 't6', startTime: 16, endTime: 19, text: "Once you get this down, everything becomes easier.", confidence: 0.89, speaker: 'Speaker 1' },
  { id: 't7', startTime: 19.5, endTime: 22, text: "The key is consistency and practice.", confidence: 0.93, speaker: 'Speaker 1' },
  { id: 't8', startTime: 22.5, endTime: 24.5, text: "Don't forget to like and subscribe!", confidence: 0.96, speaker: 'Speaker 1' },
  { id: 't9', startTime: 25, endTime: 27, text: "See you in the next video!", confidence: 0.97, speaker: 'Speaker 1' },
];

export const TranscriptionPanel = ({
  audioUrl,
  videoDuration,
  onCaptionsGenerated,
  currentTime,
  onSeek,
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TranscriptionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<TranscriptionLanguage>('auto');
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const simulateTranscription = useCallback(async () => {
    setStatus('processing');
    setProgress(0);
    setError(null);
    
    const totalSteps = 100;
    for (let i = 0; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      setProgress(i);
    }
    
    const scaledSegments = SAMPLE_TRANSCRIPTION.map(segment => ({
      ...segment,
      startTime: (segment.startTime / 27) * videoDuration,
      endTime: (segment.endTime / 27) * videoDuration,
    }));
    
    setSegments(scaledSegments);
    setStatus('complete');
  }, [videoDuration]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setStatus('uploading');
    setProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(i);
    }
    
    await simulateTranscription();
    e.target.value = '';
  }, [simulateTranscription]);

  const handleTranscribeFromVideo = useCallback(async () => {
    if (!audioUrl) {
      setError('No audio source available');
      return;
    }
    
    await simulateTranscription();
  }, [audioUrl, simulateTranscription]);

  const handleSegmentEdit = useCallback((segment: TranscriptionSegment) => {
    setEditingSegmentId(segment.id);
    setEditText(segment.text);
  }, []);

  const handleSegmentSave = useCallback(() => {
    if (!editingSegmentId) return;
    
    setSegments(prev => prev.map(s => 
      s.id === editingSegmentId ? { ...s, text: editText } : s
    ));
    setEditingSegmentId(null);
    setEditText('');
  }, [editingSegmentId, editText]);

  const handleSegmentDelete = useCallback((segmentId: string) => {
    setSegments(prev => prev.filter(s => s.id !== segmentId));
  }, []);

  const handleMergeSegments = useCallback((segmentId: string) => {
    const index = segments.findIndex(s => s.id === segmentId);
    if (index < 0 || index >= segments.length - 1) return;
    
    const current = segments[index];
    const next = segments[index + 1];
    
    const merged: TranscriptionSegment = {
      ...current,
      endTime: next.endTime,
      text: `${current.text} ${next.text}`,
      confidence: (current.confidence + next.confidence) / 2,
    };
    
    setSegments(prev => [
      ...prev.slice(0, index),
      merged,
      ...prev.slice(index + 2),
    ]);
  }, [segments]);

  const handleSplitSegment = useCallback((segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    const midTime = (segment.startTime + segment.endTime) / 2;
    const words = segment.text.split(' ');
    const midIndex = Math.ceil(words.length / 2);
    
    const first: TranscriptionSegment = {
      ...segment,
      endTime: midTime,
      text: words.slice(0, midIndex).join(' '),
    };
    
    const second: TranscriptionSegment = {
      id: `${segment.id}-split`,
      startTime: midTime,
      endTime: segment.endTime,
      text: words.slice(midIndex).join(' '),
      confidence: segment.confidence,
      speaker: segment.speaker,
    };
    
    const index = segments.findIndex(s => s.id === segmentId);
    setSegments(prev => [
      ...prev.slice(0, index),
      first,
      second,
      ...prev.slice(index + 1),
    ]);
  }, [segments]);

  const handleGenerateCaptions = useCallback(() => {
    const captions: Caption[] = segments.map(segment => ({
      id: `caption-${segment.id}`,
      startTime: segment.startTime,
      endTime: segment.endTime,
      text: segment.text,
      style: CAPTION_STYLE_PRESETS.default,
    }));
    
    onCaptionsGenerated(captions);
  }, [segments, onCaptionsGenerated]);

  const handleExport = useCallback((format: 'srt' | 'vtt') => {
    const captions: Caption[] = segments.map(segment => ({
      id: segment.id,
      startTime: segment.startTime,
      endTime: segment.endTime,
      text: segment.text,
      style: CAPTION_STYLE_PRESETS.default,
    }));
    
    const content = format === 'srt' ? generateSRT(captions) : generateVTT(captions);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [segments]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const currentSegment = segments.find(
    s => currentTime >= s.startTime && currentTime <= s.endTime
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 shrink-0 bg-zinc-900/50">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Mic size={14} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white leading-tight">Transcription</h3>
          <p className="text-[10px] text-zinc-500">Speech to text with timestamps</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-3 space-y-4">
          {status === 'idle' && (
            <>
              <div className="space-y-2">
                <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Languages size={10} />
                  Language
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as TranscriptionLanguage)}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTranscribeFromVideo}
                  disabled={!audioUrl}
                  className="py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-white rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition-all"
                  type="button"
                >
                  <Wand2 size={18} />
                  <span>{t('transcriptionPanel.autoTranscribe')}</span>
                </button>
                
                <label className="py-3 bg-zinc-800 active:bg-zinc-700 text-white rounded-xl text-xs font-medium flex flex-col items-center gap-1.5 cursor-pointer transition-colors touch-target">
                  <Upload size={18} />
                  <span>{t('transcriptionPanel.uploadAudio')}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-3 bg-zinc-800/30 rounded-xl border border-white/5">
                <div className="flex items-start gap-2">
                  <Mic size={14} className="text-zinc-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-medium text-zinc-300">{t('transcriptionPanel.howItWorks')}</div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                      {t('transcriptionPanel.howItWorksDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-4">
              <div className="p-6 bg-zinc-800/30 rounded-xl border border-white/5 text-center">
                <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-3" />
                <div className="text-sm font-medium text-white mb-1">
                  {status === 'uploading' ? 'Uploading audio...' : 'Transcribing...'}
                </div>
                <div className="text-xs text-zinc-500 mb-3">
                  {status === 'processing' && 'Analyzing speech patterns and generating timestamps'}
                </div>
                <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-2">{progress}%</div>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle size={16} />
                <span className="text-sm font-medium">Transcription Failed</span>
              </div>
              <p className="text-xs text-red-400/80">{error}</p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                type="button"
              >
                Try Again
              </button>
            </div>
          )}

          {status === 'complete' && segments.length > 0 && (
            <>
              {currentSegment && (
                <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                  <div className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider mb-1">Now Playing</div>
                  <p className="text-sm text-white">{currentSegment.text}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateCaptions}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  type="button"
                >
                  <Check size={14} />
                  Add to Timeline
                </button>
                <button
                  onClick={() => handleExport('srt')}
                  className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  type="button"
                >
                  <Download size={12} />
                  SRT
                </button>
                <button
                  onClick={() => handleExport('vtt')}
                  className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  type="button"
                >
                  <Download size={12} />
                  VTT
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                    Segments ({segments.length})
                  </span>
                  <button
                    onClick={() => {
                      setSegments([]);
                      setStatus('idle');
                    }}
                    className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                    type="button"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {segments.map((segment, index) => {
                    const isActive = currentTime >= segment.startTime && currentTime <= segment.endTime;
                    const isEditing = editingSegmentId === segment.id;
                    
                    return (
                      <div
                        key={segment.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isActive
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-zinc-800/30 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                onBlur={handleSegmentSave}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSegmentSave();
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-cyan-500/50 rounded-lg p-2 text-xs text-white resize-none outline-none"
                                rows={2}
                                autoFocus
                              />
                            ) : (
                              <p className="text-xs text-white">{segment.text}</p>
                            )}
                            
                            <div className="flex items-center gap-3 mt-1.5">
                              <button
                                onClick={() => onSeek(segment.startTime)}
                                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-cyan-400 transition-colors"
                                type="button"
                              >
                                <Clock size={10} />
                                {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                              </button>
                              <span className={`text-[10px] ${getConfidenceColor(segment.confidence)}`}>
                                {Math.round(segment.confidence * 100)}%
                              </span>
                              {segment.speaker && (
                                <span className="text-[10px] text-zinc-600">{segment.speaker}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => onSeek(segment.startTime)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                              type="button"
                            >
                              <Play size={12} />
                            </button>
                            <button
                              onClick={() => handleSegmentEdit(segment)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                              type="button"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleSegmentDelete(segment.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              type="button"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 mt-2 pt-2 border-t border-white/5">
                          {index < segments.length - 1 && (
                            <button
                              onClick={() => handleMergeSegments(segment.id)}
                              className="px-2 py-1 bg-zinc-700/50 hover:bg-zinc-700 text-[9px] text-zinc-400 hover:text-white rounded transition-colors"
                              type="button"
                            >
                              Merge with next
                            </button>
                          )}
                          <button
                            onClick={() => handleSplitSegment(segment.id)}
                            className="px-2 py-1 bg-zinc-700/50 hover:bg-zinc-700 text-[9px] text-zinc-400 hover:text-white rounded transition-colors"
                            type="button"
                          >
                            Split
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


