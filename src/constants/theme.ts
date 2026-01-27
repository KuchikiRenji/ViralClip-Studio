export const COLORS = {
  background: '#242424',
  sidebar: '#2d2d2d',
  surface: '#323232',
  surfaceHighlight: '#3a3a3a',
  borderSubtle: '#4a4a4a',
  primary: '#3b82f6',
  brandLight: '#60a5fa',
  brandDark: '#2563eb',
  accent: '#8b5cf6',
  textPrimary: '#f5f5f5',
  textSecondary: '#b8b8b8',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
} as const;
export const SPACING = {
  sidebarWidth: 140,
  maxContentWidth: 1400,
  paddingXSmall: 6,
  paddingXMedium: 10,
  paddingXLarge: 12,
  paddingY: 8,
} as const;
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;
export const Z_INDEX = {
  background: 0,
  content: 10,
  sidebar: 50,
  modal: 100,
  tooltip: 150,
} as const;
export const ANIMATION_DURATION_MS = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 700,
} as const;