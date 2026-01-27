import { Mic, CheckCircle, FileAudio, Sparkles } from 'lucide-react';
import { useTranslation } from '../../../hooks/useTranslation';
import { SAMPLE_TEXTS } from './constants';
interface VoiceRecorderProps {
  selectedTextId: string;
  isRecording: boolean;
  recordingTime: number;
  hasRecording: boolean;
  recordedUrl: string | null;
  canGenerate: boolean;
  formatRecordingTime: (seconds: number) => string;
  onSelectText: (id: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDeleteRecording: () => void;
  onGenerate: () => void;
}
export const VoiceRecorder = ({
  selectedTextId,
  isRecording,
  recordingTime,
  hasRecording,
  recordedUrl,
  canGenerate,
  formatRecordingTime,
  onSelectText,
  onStartRecording,
  onStopRecording,
  onDeleteRecording,
  onGenerate,
}) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-sm text-zinc-400 mb-4 sm:mb-6">{t('voiceClone.readText')}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8 max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
        {SAMPLE_TEXTS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectText(item.id)}
            className={`p-4 rounded-lg text-left text-sm transition-all border ${
              selectedTextId === item.id
                ? 'border-blue-500 bg-blue-500/10'
                : item.isHighlighted
                ? 'border-orange-500/50 bg-zinc-900/50 hover:border-orange-500'
                : 'border-white/5 bg-zinc-900/50 hover:border-white/10'
            }`}
            type="button"
          >
            <div className="flex items-start gap-3">
              <FileAudio size={16} className={`mt-0.5 flex-shrink-0 ${
                selectedTextId === item.id ? 'text-blue-400' : 'text-zinc-500'
              }`} />
              <p className={`${
                item.isHighlighted ? 'text-orange-300' : 'text-zinc-300'
              }`}>
                {item.text}
              </p>
            </div>
          </button>
        ))}
      </div>
      {isRecording && (
        <div className="bg-zinc-900/50 rounded-xl p-8 mb-6 text-center border border-red-500/30">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Mic size={32} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-white mb-2">{formatRecordingTime(recordingTime)}</p>
          <p className="text-sm text-zinc-400 mb-4">{t('voiceClone.recording')}</p>
          <button
            onClick={onStopRecording}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium transition-colors"
            type="button"
          >
            {t('voiceClone.stopRecording')}
          </button>
        </div>
      )}
      {hasRecording && !isRecording && (
        <div className="bg-zinc-900/50 rounded-xl p-6 mb-6 border border-green-500/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{t('voiceClone.recordingSaved')}</p>
              <p className="text-sm text-zinc-500">{t('voiceClone.duration')}: {formatRecordingTime(recordingTime)}</p>
              {recordedUrl && (
                <audio src={recordedUrl} controls className="mt-3 w-full h-8" />
              )}
            </div>
            <button
              onClick={onDeleteRecording}
              className="text-sm text-red-400 hover:text-red-300"
              type="button"
            >
              {t('action.delete')}
            </button>
          </div>
        </div>
      )}
      <div className="flex justify-center gap-4">
        {!isRecording && !hasRecording && (
          <button
            onClick={onStartRecording}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors flex items-center gap-2"
            type="button"
          >
            <Mic size={18} />
            {t('common.record')}
          </button>
        )}
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`px-8 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            canGenerate
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
          type="button"
        >
          <Sparkles size={18} />
          {t('voiceClone.cloneVoice')}
        </button>
      </div>
    </div>
  );
};







