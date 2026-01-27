import { useState, useEffect } from 'react';
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentBreakpoint: Breakpoint;
  greaterThan: (breakpoint: Breakpoint) => boolean;
  lessThan: (breakpoint: Breakpoint) => boolean;
  between: (min: Breakpoint, max: Breakpoint) => boolean;
}
const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
const getBreakpoint = (width: number): Breakpoint => {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};
export const useResponsive = (): ResponsiveState => {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 1024, height: 768 }; 
  });
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { width, height } = dimensions;
  const currentBreakpoint = getBreakpoint(width);
  const isMobile = width < BREAKPOINTS.sm;
  const isTablet = width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;
  const greaterThan = (breakpoint: Breakpoint): boolean => {
    return width >= BREAKPOINTS[breakpoint];
  };
  const lessThan = (breakpoint: Breakpoint): boolean => {
    return width < BREAKPOINTS[breakpoint];
  };
  const between = (min: Breakpoint, max: Breakpoint): boolean => {
    return width >= BREAKPOINTS[min] && width < BREAKPOINTS[max];
  };
  return {
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    greaterThan,
    lessThan,
    between,
  };
};







