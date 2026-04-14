'use client';

import { useId, useCallback } from 'react';
import type { ThemeMode } from '@hosted-game-night/types';

/**
 * Theme option for the selector dropdown.
 */
export interface ThemeOption {
  value: ThemeMode;
  label: string;
}

/**
 * Default theme options available in both presenter and display selectors.
 */
export const DEFAULT_THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Default' },
];

export interface ThemeSelectorProps {
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Current presenter theme value */
  presenterTheme: ThemeMode;
  /** Current display theme value */
  displayTheme: ThemeMode;
  /** Callback when presenter theme changes */
  onPresenterThemeChange: (theme: ThemeMode) => void;
  /** Callback when display theme changes */
  onDisplayThemeChange: (theme: ThemeMode) => void;
  /** Theme options to display (defaults to light/dark/system) */
  themeOptions?: ThemeOption[];
}

/**
 * Theme selector component for dual-screen presenter/display themes.
 *
 * This component provides two dropdown selectors:
 * - Presenter: Theme for the control panel view
 * - Display: Theme for the audience/projection view
 *
 * @example
 * ```tsx
 * import { ThemeSelector, DEFAULT_THEME_OPTIONS } from '@hosted-game-night/ui';
 * import { useThemeStore } from '@/stores/theme-store';
 *
 * function SettingsPanel() {
 *   const presenterTheme = useThemeStore((state) => state.presenterTheme);
 *   const displayTheme = useThemeStore((state) => state.displayTheme);
 *   const setPresenterTheme = useThemeStore((state) => state.setPresenterTheme);
 *   const setDisplayTheme = useThemeStore((state) => state.setDisplayTheme);
 *
 *   return (
 *     <ThemeSelector
 *       presenterTheme={presenterTheme}
 *       displayTheme={displayTheme}
 *       onPresenterThemeChange={setPresenterTheme}
 *       onDisplayThemeChange={setDisplayTheme}
 *     />
 *   );
 * }
 * ```
 */
export function ThemeSelector({
  disabled = false,
  presenterTheme,
  displayTheme,
  onPresenterThemeChange,
  onDisplayThemeChange,
  themeOptions = DEFAULT_THEME_OPTIONS,
}: ThemeSelectorProps) {
  const presenterThemeId = useId();
  const displayThemeId = useId();

  const handlePresenterThemeChange = useCallback(
    (theme: ThemeMode) => {
      onPresenterThemeChange(theme);
    },
    [onPresenterThemeChange]
  );

  const handleDisplayThemeChange = useCallback(
    (theme: ThemeMode) => {
      onDisplayThemeChange(theme);
    },
    [onDisplayThemeChange]
  );

  const selectClassName = `
    w-full h-[44px] px-4 text-lg
    bg-background border-2 border-border rounded-lg
    cursor-pointer appearance-none
    focus:outline-none focus:ring-4 focus:ring-primary/50 focus:border-primary
    disabled:opacity-50 disabled:cursor-not-allowed
    ${disabled ? '' : 'hover:border-primary/50'}
  `;

  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '20px',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Theme</h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Presenter Theme */}
        <div className="space-y-2">
          <label
            htmlFor={presenterThemeId}
            className={`
              block text-base font-medium
              ${disabled ? 'opacity-50' : ''}
            `}
          >
            Presenter
          </label>
          <select
            id={presenterThemeId}
            value={presenterTheme}
            onChange={(e) => handlePresenterThemeChange(e.target.value as ThemeMode)}
            disabled={disabled}
            className={selectClassName}
            style={selectStyle}
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Display Theme */}
        <div className="space-y-2">
          <label
            htmlFor={displayThemeId}
            className={`
              block text-base font-medium
              ${disabled ? 'opacity-50' : ''}
            `}
          >
            Display
          </label>
          <select
            id={displayThemeId}
            value={displayTheme}
            onChange={(e) => handleDisplayThemeChange(e.target.value as ThemeMode)}
            disabled={disabled}
            className={selectClassName}
            style={selectStyle}
          >
            {themeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
