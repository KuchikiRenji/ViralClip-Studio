import { forwardRef } from 'react';
import { cn } from '../../../../lib/utils';

export type TextVariant = 'heading' | 'body' | 'caption' | 'label';
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: React.ReactNode;
}

const textVariants: Record<TextVariant, string> = {
  heading: 'text-white',
  body: 'text-zinc-200',
  caption: 'text-zinc-400',
  label: 'text-zinc-300',
};

const textSizes: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const textWeights: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const defaultElements: Record<TextVariant, 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  heading: 'h2',
  body: 'p',
  caption: 'span',
  label: 'span',
};

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ className, variant = 'body', size = 'md', weight = 'normal', as, children, ...props }, ref) => {
    const Component = (as || defaultElements[variant]) as React.ElementType;
    return (
      <Component
        ref={ref}
        className={cn(
          textVariants[variant],
          textSizes[size],
          textWeights[weight],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
