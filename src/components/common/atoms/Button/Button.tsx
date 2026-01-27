import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  touchOptimized?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border-blue-600 hover:border-blue-500',
  secondary: 'bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white border-zinc-700 hover:border-zinc-600',
  outline: 'border border-zinc-600 hover:border-zinc-500 active:border-zinc-400 text-zinc-300 hover:text-white bg-transparent active:bg-zinc-800/50',
  ghost: 'bg-transparent hover:bg-zinc-800 active:bg-zinc-700 text-zinc-400 hover:text-white border-transparent',
  danger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-red-600 hover:border-red-500',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs font-medium min-h-[36px] sm:min-h-[32px]',
  md: 'px-4 py-2.5 text-sm font-medium min-h-[44px] sm:min-h-[40px]',
  lg: 'px-6 py-3.5 text-base font-semibold min-h-[52px] sm:min-h-[48px]',
  icon: 'p-2.5 min-h-[44px] min-w-[44px] sm:p-2 sm:min-h-[40px] sm:min-w-[40px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, touchOptimized = true, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg border transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98] touch-manipulation',
          'select-none',
          buttonVariants[variant],
          buttonSizes[size],
          touchOptimized && 'touch-target',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
