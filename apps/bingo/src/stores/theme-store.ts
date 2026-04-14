import {
  createThemeStore,
  DEFAULT_THEME,
  THEME_OPTIONS,
  type ThemeStore,
  type ThemeMode,
} from '@hosted-game-night/theme';

export const useThemeStore = createThemeStore('hgn-bingo-theme');

// Re-export types and constants for backward compatibility
export { DEFAULT_THEME, THEME_OPTIONS };
export type { ThemeStore, ThemeMode };
