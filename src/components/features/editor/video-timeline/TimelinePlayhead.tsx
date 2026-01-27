import { TimelinePlayheadProps } from './types';
import { PLAYHEAD_WIDTH_PX, timeToPixels } from './constants';

export const TimelinePlayhead = ({
  currentTime,
  zoom,
  height,
  onDragStart,
}: TimelinePlayheadProps) => {
  const left = timeToPixels(currentTime, zoom);

  return (
    <div
      className="absolute top-0 z-30 pointer-events-none group"
      style={{
        left: `${left}px`,
        height: `${height}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <div
        className="absolute top-0 bottom-0 bg-orange-500 shadow-lg shadow-orange-500/30
          transition-shadow duration-150 group-hover:shadow-orange-500/50 pointer-events-none"
        style={{
          left: '50%',
          width: `${PLAYHEAD_WIDTH_PX}px`,
          transform: 'translateX(-50%)',
        }}
      />

      <div
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-6 pointer-events-auto cursor-ew-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(e);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          const touch = e.touches[0];
          if (touch) {
            onDragStart({
              clientX: touch.clientX,
              clientY: touch.clientY,
              button: 0,
            });
          }
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2
            w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px]
            border-l-transparent border-r-transparent border-t-orange-500
            transition-all duration-150 group-hover:border-t-orange-400 pointer-events-none"
        />
        <div
          className="absolute top-0.5 left-1/2 -translate-x-1/2
            w-3 h-3 bg-orange-500 rounded-full
            shadow-lg shadow-orange-500/50 border border-orange-400
            transition-all duration-150 group-hover:bg-orange-400 group-hover:scale-110 pointer-events-none"
        />
      </div>

      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 pointer-events-auto cursor-ew-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          onDragStart(e);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          const touch = e.touches[0];
          if (touch) {
            onDragStart({
              clientX: touch.clientX,
              clientY: touch.clientY,
              button: 0,
            });
          }
        }}
      >
        <div
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2
            w-3 h-3 bg-orange-500 rounded-full
            shadow-lg shadow-orange-500/50 border border-orange-400
            transition-all duration-150 group-hover:bg-orange-400 group-hover:scale-110 pointer-events-none"
        />
      </div>
    </div>
  );
};
