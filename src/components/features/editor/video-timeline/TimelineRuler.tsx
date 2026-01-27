import { useMemo } from 'react';
import { TimelineRulerProps } from './types';
import { RULER_HEIGHT_PX, formatTimeMMSS, timeToPixels } from './constants';

export const TimelineRuler = ({
  duration,
  zoom,
  frameRate,
  scrollLeft,
}: TimelineRulerProps) => {
  const intervals = useMemo(() => {
    if (zoom < 20) {
      return { major: 30, minor: 10 };
    } else if (zoom < 40) {
      return { major: 10, minor: 5 };
    } else if (zoom < 80) {
      return { major: 5, minor: 1 };
    } else if (zoom < 150) {
      return { major: 2, minor: 0.5 };
    } else {
      return { major: 1, minor: 1 / frameRate };
    }
  }, [zoom, frameRate]);

  const visibleStart = Math.max(0, scrollLeft / zoom - 1);
  const visibleEnd = (scrollLeft + 2000) / zoom;

  const ticks = useMemo(() => {
    const result: Array<{
      time: number;
      x: number;
      isMajor: boolean;
      label?: string;
    }> = [];

    const startTime = Math.floor(visibleStart / intervals.major) * intervals.major;
    const endTime = Math.min(duration + intervals.major, visibleEnd);

    for (let time = startTime; time <= endTime; time += intervals.minor) {
      if (time < 0) continue;

      const x = timeToPixels(time, zoom);
      const isMajor = Math.abs(time % intervals.major) < 0.001;

      result.push({
        time,
        x,
        isMajor,
        label: isMajor ? formatTimeMMSS(time) : undefined,
      });
    }

    return result;
  }, [visibleStart, visibleEnd, duration, zoom, intervals]);

  const totalWidth = timeToPixels(duration, zoom) + 100;

  return (
    <div
      className="relative bg-zinc-900/50 border-b border-white/5 select-none"
      style={{ height: RULER_HEIGHT_PX, width: totalWidth }}
    >
      {ticks.map((tick, index) => (
        <div
          key={`${tick.time}-${index}`}
          className="absolute top-0"
          style={{ left: tick.x }}
        >
          <div
            className={`w-px ${tick.isMajor ? 'h-4 bg-zinc-400' : 'h-2 bg-zinc-600'}`}
          />

          {tick.label && (
            <span
              className="absolute top-4 left-0 -translate-x-1/2 text-[9px] text-zinc-400 whitespace-nowrap font-mono"
              style={{ minWidth: '40px', textAlign: 'center' }}
            >
              {tick.label}
            </span>
          )}
        </div>
      ))}

      <div
        className="absolute top-0 h-full border-r-2 border-dashed border-zinc-600"
        style={{ left: timeToPixels(duration, zoom) }}
      >
        <span className="absolute -top-0 right-1 text-[8px] text-zinc-500 whitespace-nowrap">
          END
        </span>
      </div>
    </div>
  );
};
