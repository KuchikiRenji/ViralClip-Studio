import { CSSProperties } from 'react';
import { cn } from '../../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  style?: CSSProperties;
}

export const Skeleton = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  style: customStyle,
}: SkeletonProps) => {
  const baseClasses = 'bg-zinc-800/50 border border-white/5';
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: '',
  };
  const style: CSSProperties = { ...customStyle };
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], animationClasses[animation], className)}
      style={style}
    />
  );
};

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('bg-zinc-900/40 backdrop-blur-sm border border-white/[0.06] rounded-xl overflow-hidden', className)}>
    <Skeleton variant="rectangular" height={200} className="w-full" />
    <div className="p-6 space-y-3">
      <Skeleton variant="text" width="80%" height={20} />
      <Skeleton variant="text" width="60%" height={16} />
      <div className="flex justify-end pt-2">
        <Skeleton variant="rectangular" width={100} height={36} />
      </div>
    </div>
  </div>
);

export const FeatureCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('min-h-[320px] bg-zinc-900/40 backdrop-blur-sm border border-white/[0.06] rounded-xl overflow-hidden', className)}>
    <Skeleton variant="rectangular" height={180} className="w-full" style={{ aspectRatio: '16/9' }} />
    <div className="p-6 space-y-3">
      <Skeleton variant="text" width="70%" height={20} />
      <Skeleton variant="text" width="90%" height={16} />
      <Skeleton variant="text" width="50%" height={16} />
      <div className="flex justify-end pt-3">
        <Skeleton variant="rectangular" width={120} height={36} />
      </div>
    </div>
  </div>
);

export const ActionCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('min-h-[280px] bg-zinc-900/40 backdrop-blur-sm border border-white/[0.06] rounded-xl overflow-hidden', className)}>
    <div className="p-6 flex flex-col h-full">
      <div className="flex items-start gap-4 mb-6 flex-1">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="80%" height={16} />
        </div>
      </div>
      <div className="mt-auto">
        <Skeleton variant="rectangular" width={120} height={36} />
      </div>
    </div>
  </div>
);

export const MediaItemSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-2', className)}>
    <Skeleton variant="rectangular" width="100%" height={120} className="rounded-lg" />
    <Skeleton variant="text" width="80%" height={14} />
    <Skeleton variant="text" width="60%" height={12} />
  </div>
);

export const VideoThumbnailSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('relative bg-zinc-900/50 rounded-xl overflow-hidden border border-white/5', className)}>
    <Skeleton variant="rectangular" width="100%" height={180} />
    <div className="absolute inset-0 flex items-center justify-center">
      <Skeleton variant="circular" width={48} height={48} />
    </div>
    <div className="absolute top-3 right-3">
      <Skeleton variant="rectangular" width={40} height={20} className="rounded" />
    </div>
    <div className="absolute bottom-3 left-3 right-3 space-y-2">
      <Skeleton variant="text" width="60%" height={14} />
      <Skeleton variant="text" width="40%" height={12} />
    </div>
  </div>
);
