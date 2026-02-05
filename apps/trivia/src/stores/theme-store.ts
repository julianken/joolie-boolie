import {
  createThemeStore,
  DEFAULT_THEME,
  THEME_OPTIONS,
  type ThemeStore,
  type ThemeMode,
} from '@beak-gaming/theme';

export const useThemeStore = createThemeStore('beak-trivia-theme');

// Re-export types and constants for backward compatibility
export { DEFAULT_THEME, THEME_OPTIONS };
export type { ThemeStore, ThemeMode };
