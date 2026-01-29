import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetSelector } from '../PresetSelector';
import { ToastProvider } from "@beak-gaming/ui";
import type { BingoPreset } from '@beak-gaming/database/types';

// Mock fetch globally
global.fetch = vi.fn();

// Mock stores
const mockSetPattern = vi.fn();
const mockToggleAutoCall = vi.fn();
const mockSetAutoCallSpeed = vi.fn();
const mockSetVoicePack = vi.fn();

vi.mock('@/stores/game-store', () => ({
  useGameStore: vi.fn((selector) => {
    const store = {
      setPattern: mockSetPattern,
      toggleAutoCall: mockToggleAutoCall,
      setAutoCallSpeed: mockSetAutoCallSpeed,
      autoCallEnabled: false,
    };
    return selector ? selector(store) : store;
  }),
}));

vi.mock('@/stores/audio-store', () => ({
  useAudioStore: vi.fn((selector) => {
    const store = {
      setVoicePack: mockSetVoicePack,
    };
    return selector ? selector(store) : store;
  }),
}));

// Mock pattern registry
vi.mock('@/lib/game/patterns', () => ({
  patternRegistry: {
    get: vi.fn((id: string) => {
      if (id === 'horizontal-line') {
        return {
          id: 'horizontal-line',
          name: 'Horizontal Line',
          category: 'lines',
          cells: [],
        };
      }
      return null;
    }),
  },
}));

const mockPresets: BingoPreset[] = [
  {
    id: 'preset-1',
    user_id: 'user-123',
    name: 'Standard Game',
    pattern_id: 'horizontal-line',
    voice_pack: 'standard',
    auto_call_enabled: true,
    auto_call_interval: 10000,
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'preset-2',
    user_id: 'user-123',
    name: 'Quick Game',
    pattern_id: 'horizontal-line',
    voice_pack: 'british',
    auto_call_enabled: true,
    auto_call_interval: 5000,
    is_default: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('PresetSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ presets: mockPresets }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with loading state initially', () => {
    renderWithProviders(<PresetSelector />);

    expect(screen.getByText(/Load Preset/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('fetches and displays presets on mount', async () => {
    renderWithProviders(<PresetSelector />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/presets');
    });

    await waitFor(() => {
      expect(screen.getByText('Standard Game (Default)')).toBeInTheDocument();
      expect(screen.getByText('Quick Game')).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    } as Response);

    renderWithProviders(<PresetSelector />);

    // Gracefully handles unavailable API - no error shown
    await waitFor(() => {
      expect(screen.getByText(/No saved presets/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no presets exist', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ presets: [] }),
    } as Response);

    renderWithProviders(<PresetSelector />);

    await waitFor(() => {
      expect(screen.getByText(/No saved presets/i)).toBeInTheDocument();
    });
  });

  it('loads preset settings when selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PresetSelector />);

    // Wait for presets to load
    await waitFor(() => {
      expect(screen.getByText('Standard Game (Default)')).toBeInTheDocument();
    });

    // Select preset
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'preset-1');

    // Verify store actions called
    await waitFor(() => {
      expect(mockSetPattern).toHaveBeenCalledWith({
        id: 'horizontal-line',
        name: 'Horizontal Line',
        category: 'lines',
        cells: [],
      });
      expect(mockToggleAutoCall).toHaveBeenCalled();
      // auto_call_interval is 10000ms, converted to 10 seconds
      expect(mockSetAutoCallSpeed).toHaveBeenCalledWith(10);
      expect(mockSetVoicePack).toHaveBeenCalledWith('standard');
    });
  });

  it('handles missing pattern gracefully', async () => {
    const user = userEvent.setup();

    const presetsWithBadPattern: BingoPreset[] = [{
      id: 'bad-preset',
      user_id: 'user-123',
      name: 'Bad Preset',
      pattern_id: 'non-existent-pattern',
      voice_pack: 'standard',
      auto_call_enabled: false,
      auto_call_interval: 5000,
      is_default: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ presets: presetsWithBadPattern }),
    } as Response);

    renderWithProviders(<PresetSelector />);

    await waitFor(() => {
      expect(screen.getByText('Bad Preset')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'bad-preset');

    // Pattern won't be set because it doesn't exist
    await waitFor(() => {
      expect(mockSetPattern).not.toHaveBeenCalled();
    });
  });

  it('disables select when disabled prop is true', () => {
    renderWithProviders(<PresetSelector disabled />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('disables select while loading', () => {
    renderWithProviders(<PresetSelector />);

    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });
});
