import { HTMLAttributes } from 'react';
import { cn } from '../../../../lib/utils';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children: React.ReactNode;
}

const containerSizes: Record<ContainerSize, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export const Container = ({
  className,
  size = 'lg',
  children,
  ...props
}: ContainerProps) => {
  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        containerSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
