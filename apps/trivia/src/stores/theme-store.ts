import {
  createThemeStore,
  DEFAULT_THEME,
  THEME_OPTIONS,
  type ThemeStore,
  type ThemeMode,
} from '@joolie-boolie/theme';

export const useThemeStore = createThemeStore('jb-trivia-theme');

// Re-export types and constants for backward compatibility
export { DEFAULT_THEME, THEME_OPTIONS };
export type { ThemeStore, ThemeMode };
