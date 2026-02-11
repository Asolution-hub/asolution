// Attenda Design Tokens for Remotion Video

export const colors = {
  primary: '#6366F1',      // Indigo (Attenda brand)
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  accent: '#14B8A6',       // Teal
  accentLight: '#2DD4BF',
  success: '#22C55E',      // Green (attended)
  successLight: '#4ADE80',
  danger: '#EF4444',       // Red (no-show)
  dangerLight: '#F87171',
  warning: '#F59E0B',
  background: '#FAFAFA',   // Light gray
  backgroundDark: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  glass: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(99, 102, 241, 0.2)',
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowHeavy: 'rgba(0, 0, 0, 0.15)',
};

export const fonts = {
  inter: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export const fontSizes = {
  xs: 14,
  sm: 16,
  base: 18,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 56,
  '5xl': 72,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Video specifications
export const videoConfig = {
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 2100, // ~70 seconds
};

// Scene timings (in frames at 30fps)
export const sceneTiming = {
  scene1: { start: 0, end: 180 },        // 0-6s: Problem
  scene2: { start: 180, end: 360 },      // 6-12s: Insight
  scene3: { start: 360, end: 600 },      // 12-20s: Connect
  scene4: { start: 600, end: 900 },      // 20-30s: Protection
  scene5: { start: 900, end: 1200 },     // 30-40s: Confirmation
  scene6: { start: 1200, end: 1650 },    // 40-55s: Outcomes
  scene7: { start: 1650, end: 1950 },    // 55-65s: Value
  scene8: { start: 1950, end: 2100 },    // 65-70s: Closing
};
