import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

export type CardVariant = 'default' | 'elevated' | 'outlined';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
}

const cardVariants: Record<CardVariant, string> = {
  default: 'bg-zinc-900/40 backdrop-blur-sm border border-white/5',
  elevated: 'bg-zinc-900/60 backdrop-blur-sm border border-white/10 shadow-xl',
  outlined: 'bg-transparent border border-white/10',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-300',
          cardVariants[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
