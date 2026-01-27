import { HTMLAttributes } from 'react';
import { cn } from '../../../../lib/utils';

export type GridCols = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type GridGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: GridCols | { xs?: GridCols; sm?: GridCols; md?: GridCols; lg?: GridCols; xl?: GridCols };
  gap?: GridGap;
  children: React.ReactNode;
}

const gapSizes: Record<GridGap, string> = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const getGridCols = (cols: GridCols): string => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
    10: 'grid-cols-10',
    11: 'grid-cols-11',
    12: 'grid-cols-12',
  };
  return gridCols[cols];
};

const getResponsiveGridCols = (cols: GridProps['cols']): string => {
  if (typeof cols === 'number') {
    return getGridCols(cols);
  }
  const responsiveClasses: string[] = [];
  if (cols.xs) responsiveClasses.push(getGridCols(cols.xs));
  if (cols.sm) responsiveClasses.push(`sm:${getGridCols(cols.sm)}`);
  if (cols.md) responsiveClasses.push(`md:${getGridCols(cols.md)}`);
  if (cols.lg) responsiveClasses.push(`lg:${getGridCols(cols.lg)}`);
  if (cols.xl) responsiveClasses.push(`xl:${getGridCols(cols.xl)}`);
  return responsiveClasses.join(' ');
};

export const Grid = ({
  className,
  cols = 1,
  gap = 'md',
  children,
  ...props
}: GridProps) => {
  return (
    <div
      className={cn(
        'grid',
        getResponsiveGridCols(cols),
        gapSizes[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
