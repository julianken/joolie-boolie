import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector, DEFAULT_THEME_OPTIONS } from '../theme-selector';
import type { ThemeMode } from '@joolie-boolie/types';

describe('ThemeSelector', () => {
  const defaultProps = {
    presenterTheme: 'light' as ThemeMode,
    displayTheme: 'dark' as ThemeMode,
    onPresenterThemeChange: vi.fn(),
    onDisplayThemeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with default props', () => {
      render(<ThemeSelector {...defaultProps} />);

      expect(screen.getByText('Theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Presenter')).toBeInTheDocument();
      expect(screen.getByLabelText('Display')).toBeInTheDocument();
    });

    it('should render both presenter and display selectors', () => {
      render(<ThemeSelector {...defaultProps} />);

      const selects = screen.getAllByRole('combobox');
      expect(selects).toHaveLength(2);
    });

    it('should display current theme values', () => {
      render(
        <ThemeSelector
          {...defaultProps}
          presenterTheme="dark"
          displayTheme="system"
        />
      );

      const presenterSelect = screen.getByLabelText('Presenter');
      const displaySelect = screen.getByLabelText('Display');

      expect(presenterSelect).toHaveValue('dark');
      expect(displaySelect).toHaveValue('system');
    });

    it('should render default theme options', () => {
      render(<ThemeSelector {...defaultProps} />);

      // Check options exist in presenter dropdown
      const presenterSelect = screen.getByLabelText('Presenter');
      expect(presenterSelect).toContainHTML('<option value="light">Light</option>');
      expect(presenterSelect).toContainHTML('<option value="dark">Dark</option>');
      expect(presenterSelect).toContainHTML('<option value="system">System Default</option>');
    });

    it('should render custom theme options when provided', () => {
      const customOptions = [
        { value: 'light' as ThemeMode, label: 'Day Mode' },
        { value: 'dark' as ThemeMode, label: 'Night Mode' },
      ];

      render(<ThemeSelector {...defaultProps} themeOptions={customOptions} />);

      expect(screen.getAllByText('Day Mode')).toHaveLength(2); // Both dropdowns
      expect(screen.getAllByText('Night Mode')).toHaveLength(2);
      expect(screen.queryByText('System Default')).not.toBeInTheDocument();
    });
  });

  describe('theme selection callbacks', () => {
    it('should call onPresenterThemeChange when presenter theme is changed', () => {
      const handlePresenterChange = vi.fn();
      render(
        <ThemeSelector
          {...defaultProps}
          onPresenterThemeChange={handlePresenterChange}
        />
      );

      const presenterSelect = screen.getByLabelText('Presenter');
      fireEvent.change(presenterSelect, { target: { value: 'dark' } });

      expect(handlePresenterChange).toHaveBeenCalledWith('dark');
      expect(handlePresenterChange).toHaveBeenCalledTimes(1);
    });

    it('should call onDisplayThemeChange when display theme is changed', () => {
      const handleDisplayChange = vi.fn();
      render(
        <ThemeSelector
          {...defaultProps}
          onDisplayThemeChange={handleDisplayChange}
        />
      );

      const displaySelect = screen.getByLabelText('Display');
      fireEvent.change(displaySelect, { target: { value: 'system' } });

      expect(handleDisplayChange).toHaveBeenCalledWith('system');
      expect(handleDisplayChange).toHaveBeenCalledTimes(1);
    });

    it('should not trigger display callback when presenter is changed', () => {
      const handlePresenterChange = vi.fn();
      const handleDisplayChange = vi.fn();
      render(
        <ThemeSelector
          {...defaultProps}
          onPresenterThemeChange={handlePresenterChange}
          onDisplayThemeChange={handleDisplayChange}
        />
      );

      const presenterSelect = screen.getByLabelText('Presenter');
      fireEvent.change(presenterSelect, { target: { value: 'dark' } });

      expect(handlePresenterChange).toHaveBeenCalled();
      expect(handleDisplayChange).not.toHaveBeenCalled();
    });

    it('should not trigger presenter callback when display is changed', () => {
      const handlePresenterChange = vi.fn();
      const handleDisplayChange = vi.fn();
      render(
        <ThemeSelector
          {...defaultProps}
          onPresenterThemeChange={handlePresenterChange}
          onDisplayThemeChange={handleDisplayChange}
        />
      );

      const displaySelect = screen.getByLabelText('Display');
      fireEvent.change(displaySelect, { target: { value: 'light' } });

      expect(handleDisplayChange).toHaveBeenCalled();
      expect(handlePresenterChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should disable both selects when disabled is true', () => {
      render(<ThemeSelector {...defaultProps} disabled />);

      const presenterSelect = screen.getByLabelText('Presenter');
      const displaySelect = screen.getByLabelText('Display');

      expect(presenterSelect).toBeDisabled();
      expect(displaySelect).toBeDisabled();
    });

    it('should enable both selects when disabled is false', () => {
      render(<ThemeSelector {...defaultProps} disabled={false} />);

      const presenterSelect = screen.getByLabelText('Presenter');
      const displaySelect = screen.getByLabelText('Display');

      expect(presenterSelect).not.toBeDisabled();
      expect(displaySelect).not.toBeDisabled();
    });

    it('should apply disabled styling to labels when disabled', () => {
      render(<ThemeSelector {...defaultProps} disabled />);

      const presenterLabel = screen.getByText('Presenter');
      const displayLabel = screen.getByText('Display');

      expect(presenterLabel.className).toContain('opacity-50');
      expect(displayLabel.className).toContain('opacity-50');
    });

    it('should not apply disabled styling to labels when enabled', () => {
      render(<ThemeSelector {...defaultProps} disabled={false} />);

      const presenterLabel = screen.getByText('Presenter');
      const displayLabel = screen.getByText('Display');

      expect(presenterLabel.className).not.toContain('opacity-50');
      expect(displayLabel.className).not.toContain('opacity-50');
    });
  });

  describe('accessibility', () => {
    it('should have properly associated labels with selects', () => {
      render(<ThemeSelector {...defaultProps} />);

      // Labels are associated via htmlFor and id
      const presenterSelect = screen.getByLabelText('Presenter');
      const displaySelect = screen.getByLabelText('Display');

      expect(presenterSelect.tagName).toBe('SELECT');
      expect(displaySelect.tagName).toBe('SELECT');
    });

    it('should have unique ids for each select', () => {
      render(<ThemeSelector {...defaultProps} />);

      const presenterSelect = screen.getByLabelText('Presenter');
      const displaySelect = screen.getByLabelText('Display');

      expect(presenterSelect.id).toBeTruthy();
      expect(displaySelect.id).toBeTruthy();
      expect(presenterSelect.id).not.toBe(displaySelect.id);
    });
  });

  describe('styling', () => {
    it('should have minimum 44px height for accessible design', () => {
      render(<ThemeSelector {...defaultProps} />);

      const presenterSelect = screen.getByLabelText('Presenter');
      const displaySelect = screen.getByLabelText('Display');

      expect(presenterSelect.className).toContain('h-[44px]');
      expect(displaySelect.className).toContain('h-[44px]');
    });

    it('should apply hover styles when not disabled', () => {
      render(<ThemeSelector {...defaultProps} disabled={false} />);

      const presenterSelect = screen.getByLabelText('Presenter');
      expect(presenterSelect.className).toContain('hover:border-primary/50');
    });

    it('should not apply hover styles when disabled', () => {
      render(<ThemeSelector {...defaultProps} disabled />);

      const presenterSelect = screen.getByLabelText('Presenter');
      expect(presenterSelect.className).not.toContain('hover:border-primary/50');
    });
  });

  describe('DEFAULT_THEME_OPTIONS export', () => {
    it('should export default theme options with correct values', () => {
      expect(DEFAULT_THEME_OPTIONS).toHaveLength(3);
      expect(DEFAULT_THEME_OPTIONS).toContainEqual({ value: 'light', label: 'Light' });
      expect(DEFAULT_THEME_OPTIONS).toContainEqual({ value: 'dark', label: 'Dark' });
      expect(DEFAULT_THEME_OPTIONS).toContainEqual({ value: 'system', label: 'System Default' });
    });
  });
});
