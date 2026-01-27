import { Plus, Video, Music } from 'lucide-react';
import { TimelineTrack } from './types';
import { TrackHeader } from './TrackHeader';
import { RULER_HEIGHT_PX, TRACK_HEADER_WIDTH_PX } from './constants';
import { useTranslation } from '../../../../hooks/useTranslation';

interface TrackHeaderListProps {
  tracks: TimelineTrack[];
  onTrackChange: (trackId: string, updates: Partial<TimelineTrack>) => void;
  onDeleteTrack: (trackId: string) => void;
  onAddVideoTrack: () => void;
  onAddAudioTrack: () => void;
}

export const TrackHeaderList = ({
  tracks,
  onTrackChange,
  onDeleteTrack,
  onAddVideoTrack,
  onAddAudioTrack,
}: TrackHeaderListProps) => {
  const { t } = useTranslation();

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex-shrink-0 border-r border-white/5 bg-zinc-900/30"
      style={{ width: TRACK_HEADER_WIDTH_PX }}
    >
      <div
        className="flex items-center justify-between px-2 border-b border-white/5 bg-zinc-900/50"
        style={{ height: RULER_HEIGHT_PX }}
      >
        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">
          {t('timeline.tracks')}
        </span>

        <div className="relative group">
          <button
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            type="button"
            title={t('timeline.addTrack')}
          >
            <Plus size={14} />
          </button>

          <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 min-w-[140px]">
            <button
              onClick={onAddVideoTrack}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left text-white hover:bg-white/10 transition-colors rounded-t-lg"
              type="button"
            >
              <Video size={12} className="text-amber-400" />
              {t('timeline.addVideoTrack')}
            </button>
            <button
              onClick={onAddAudioTrack}
              className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left text-white hover:bg-white/10 transition-colors rounded-b-lg"
              type="button"
            >
              <Music size={12} className="text-green-400" />
              {t('timeline.addAudioTrack')}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto">
        {sortedTracks.map((track) => (
          <TrackHeader
            key={track.id}
            track={track}
            onToggleLock={() =>
              onTrackChange(track.id, { isLocked: !track.isLocked })
            }
            onToggleMute={() =>
              onTrackChange(track.id, { isMuted: !track.isMuted })
            }
            onToggleVisibility={() =>
              onTrackChange(track.id, { isVisible: !track.isVisible })
            }
            onToggleCollapse={() =>
              onTrackChange(track.id, { isCollapsed: !track.isCollapsed })
            }
            onDelete={() => onDeleteTrack(track.id)}
          />
        ))}
      </div>
    </div>
  );
};
