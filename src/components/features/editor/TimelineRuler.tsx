import { TIMELINE_MARKER_INTERVAL } from '../../../constants/editor';
interface TimelineRulerProps {
  duration: number;
  timeToPixels: (time: number) => number;
}
export const TimelineRuler = ({
  duration,
  timeToPixels,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 h-5 flex items-end border-b border-white/5">
      {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
        <div
          key={i}
          className="absolute border-l border-white/10"
          style={{ left: `${timeToPixels(i)}px`, height: i % TIMELINE_MARKER_INTERVAL === 0 ? '100%' : '50%' }}
        >
          {i % TIMELINE_MARKER_INTERVAL === 0 && (
            <span className="absolute -bottom-4 left-0 text-[10px] text-zinc-600 whitespace-nowrap -translate-x-1/2 tabular-nums">
              {i}s
            </span>
          )}
        </div>
      ))}
    </div>
  );
};







