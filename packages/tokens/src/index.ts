/** NEXUSE GO design tokens. Forest green + off-white + neutrals. */
export const palette = {
  forest: { 50: '#EEF6F1', 100: '#D6EADD', 200: '#ADD5BB', 300: '#7DB993', 400: '#4E9A6E', 500: '#2F7D52', 600: '#1F6340', 700: '#164B31', 800: '#10382A', 900: '#0B271D' },
  neutral: { 0: '#FFFFFF', 50: '#FAF8F3', 100: '#F2EFE8', 200: '#E4E0D6', 300: '#CFCABD', 400: '#A29D90', 500: '#78746A', 600: '#57544C', 700: '#3D3B35', 800: '#262521', 900: '#151412' },
  danger: '#B3261E',
  warning: '#9A6700',
  success: '#1F6340',
} as const;

export const lightTheme = {
  background: palette.neutral[50],
  surface: palette.neutral[0],
  surfaceMuted: palette.neutral[100],
  border: palette.neutral[200],
  text: palette.neutral[900],
  textMuted: palette.neutral[600],
  primary: palette.forest[700],
  primaryHover: palette.forest[800],
  onPrimary: palette.neutral[0],
  accent: palette.forest[500],
  danger: palette.danger,
} as const;

export const darkTheme = {
  background: '#0F1411',
  surface: '#161D18',
  surfaceMuted: '#1D2620',
  border: '#2A362E',
  text: '#EDEBE4',
  textMuted: '#A9B0A8',
  primary: palette.forest[300],
  primaryHover: palette.forest[200],
  onPrimary: palette.forest[900],
  accent: palette.forest[400],
  danger: '#F2B8B5',
} as const;

export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64 } as const;
export const radii = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
export const typography = {
  fontSans: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  fontDisplay: '"Fraunces", Georgia, serif',
  sizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 22, '2xl': 28, '3xl': 36 },
} as const;
export type Theme = typeof lightTheme | typeof darkTheme;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
/** CSS custom properties for a theme, e.g. `--color-surface-muted: #F2EFE8;` (used by the web app). */
export function themeToCssVars(t: Theme): string {
  return Object.entries(t).map(([k, v]) => `--color-${kebab(k)}:${v};`).join('');
}
