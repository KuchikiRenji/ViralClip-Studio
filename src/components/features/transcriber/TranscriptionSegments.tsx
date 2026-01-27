import { FileText, Copy, Check, Download } from 'lucide-react';
import { TIMING } from '../../../constants/timing';
import { useTranslation } from '../../../hooks/useTranslation';
interface TranscriptionSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}
interface TranscriptionSegmentsProps {
  segments: TranscriptionSegment[];
  activeSegmentId: string | null;
  copied: boolean;
  onSeekToSegment: (segment: TranscriptionSegment) => void;
  onCopyTranscript: () => void;
  onDownloadTranscript: () => void;
  formatTime: (seconds: number) => string;
}
export const TranscriptionSegments = ({
  segments,
  activeSegmentId,
  copied,
  onSeekToSegment,
  onCopyTranscript,
  onDownloadTranscript,
  formatTime,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-white">{t('videoTranscriber.transcriptTitle')}</span>
          {segments.length > 0 && (
            <span className="text-xs text-zinc-500">{t('videoTranscriber.segmentCount', { count: segments.length })}</span>
          )}
        </div>
        {segments.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onCopyTranscript}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title={t('videoTranscriber.copyTranscript')}
              type="button"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <button
              onClick={onDownloadTranscript}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title={t('videoTranscriber.downloadTranscript')}
              type="button"
            >
              <Download size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {segments.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <FileText size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('videoTranscriber.emptyTranscriptTitle')}</p>
            <p className="text-xs mt-1">{t('videoTranscriber.emptyTranscriptSubtitle')}</p>
          </div>
        ) : (
          segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => onSeekToSegment(segment)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                activeSegmentId === segment.id
                  ? 'bg-blue-600/20 border border-blue-500/30'
                  : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
              }`}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-1.5 py-0.5 rounded shrink-0">
                  {formatTime(segment.startTime)}
                </span>
                <p className={`text-sm ${activeSegmentId === segment.id ? 'text-white' : 'text-zinc-300'}`}>
                  {segment.text}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};







