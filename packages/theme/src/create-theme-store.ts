import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Theme mode for the application.
 * Matches the ThemeMode type from @beak-gaming/types.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme store state interface.
 * Supports dual-screen apps with separate presenter and display themes.
 */
export interface ThemeStore {
  // Persisted state
  presenterTheme: ThemeMode;
  displayTheme: ThemeMode;

  // Actions
  setPresenterTheme: (theme: ThemeMode) => void;
  setDisplayTheme: (theme: ThemeMode) => void;
}

/**
 * Default theme mode.
 */
export const DEFAULT_THEME: ThemeMode = 'system';

/**
 * Available theme options for UI selectors.
 */
export const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Default' },
];

/**
 * Creates a theme store with the given storage key.
 * Each app should use a unique storage key to persist theme preferences separately.
 *
 * @param storageKey - The localStorage key for persisting theme state (e.g., 'beak-bingo-theme')
 * @returns A Zustand hook for the theme store
 *
 * @example
 * // apps/bingo/src/stores/theme-store.ts
 * import { createThemeStore } from '@beak-gaming/theme';
 * export const useThemeStore = createThemeStore('beak-bingo-theme');
 *
 * @example
 * // apps/trivia/src/stores/theme-store.ts
 * import { createThemeStore } from '@beak-gaming/theme';
 * export const useThemeStore = createThemeStore('beak-trivia-theme');
 */
export function createThemeStore(storageKey: string) {
  return create<ThemeStore>()(
    persist(
      (set) => ({
        // Persisted state
        presenterTheme: DEFAULT_THEME,
        displayTheme: DEFAULT_THEME,

        // Actions
        setPresenterTheme: (theme: ThemeMode) => {
          set({ presenterTheme: theme });
        },

        setDisplayTheme: (theme: ThemeMode) => {
          set({ displayTheme: theme });
        },
      }),
      {
        name: storageKey,
        partialize: (state) => ({
          presenterTheme: state.presenterTheme,
          displayTheme: state.displayTheme,
        }),
      }
    )
  );
}
