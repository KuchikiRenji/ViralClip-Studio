import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  error?: boolean;
  touchOptimized?: boolean;
}

const inputSizes: Record<InputSize, string> = {
  sm: 'px-3 py-2.5 text-sm min-h-[40px] sm:py-1.5 sm:text-xs sm:min-h-[36px]',
  md: 'px-4 py-3 text-base min-h-[48px] sm:py-2 sm:text-sm sm:min-h-[44px]',
  lg: 'px-4 py-3.5 text-base min-h-[52px] sm:py-3 sm:min-h-[48px]',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'md', error = false, touchOptimized = true, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-zinc-900 text-white placeholder-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'transition-colors duration-200',
          'touch-manipulation',
          error ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700',
          inputSizes[size],
          touchOptimized && 'touch-target',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
