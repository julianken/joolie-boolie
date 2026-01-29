import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SavePresetModal } from '../SavePresetModal';
import { ToastProvider } from "@beak-gaming/ui";

// Mock fetch globally
global.fetch = vi.fn();

// Mock stores
vi.mock('@/stores/game-store', () => ({
  useGameStore: vi.fn((selector) => {
    const store = {
      pattern: {
        id: 'horizontal-line',
        name: 'Horizontal Line',
        category: 'lines',
        cells: [],
      },
      autoCallEnabled: true,
      autoCallSpeed: 10, // Speed in seconds (converted to milliseconds in component)
    };
    return selector ? selector(store) : store;
  }),
}));

vi.mock('@/stores/audio-store', () => ({
  useAudioStore: vi.fn((selector) => {
    const store = {
      voicePack: 'standard',
    };
    return selector ? selector(store) : store;
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('SavePresetModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        preset: {
          id: 'new-preset-id',
          name: 'Test Preset',
        },
      }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    renderWithProviders(
      <SavePresetModal isOpen={false} onClose={mockOnClose} />
    );

    expect(screen.queryByText('Save Preset')).not.toBeInTheDocument();
  });

  it('renders modal when isOpen is true', () => {
    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    expect(screen.getByText('Save Preset')).toBeInTheDocument();
    expect(screen.getByLabelText(/Preset Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Set as default preset/i)).toBeInTheDocument();
  });

  it('displays current settings preview', () => {
    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    expect(screen.getByText('Current Settings')).toBeInTheDocument();
    expect(screen.getByText(/Pattern:/)).toBeInTheDocument();
    expect(screen.getByText(/Horizontal Line/)).toBeInTheDocument();
    expect(screen.getByText(/Voice Pack:/)).toBeInTheDocument();
    expect(screen.getByText(/standard/)).toBeInTheDocument();
    expect(screen.getByText(/Auto-Call:/)).toBeInTheDocument();
    expect(screen.getByText(/On \(10s\)/)).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    // Click save without entering name
    const saveButton = screen.getByRole('button', { name: /Save/i });
    await user.click(saveButton);

    expect(screen.getByText('Preset name is required')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('saves preset with valid input', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    // Enter preset name
    const nameInput = screen.getByLabelText(/Preset Name/i);
    await user.type(nameInput, 'My Test Preset');

    // Check "Set as default"
    const defaultCheckbox = screen.getByLabelText(/Set as default preset/i);
    await user.click(defaultCheckbox);

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save/i });
    await user.click(saveButton);

    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'My Test Preset',
          pattern_id: 'horizontal-line',
          voice_pack: 'standard',
          auto_call_enabled: true,
          auto_call_interval: 10000,
          is_default: true,
        }),
      });
    });

    // Verify callbacks
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error message when save fails', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Duplicate preset name' }),
    } as Response);

    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    const nameInput = screen.getByLabelText(/Preset Name/i);
    await user.type(nameInput, 'Test');

    const saveButton = screen.getByRole('button', { name: /Save/i });
    await user.click(saveButton);

    // Error should appear
    await waitFor(() => {
      const errors = screen.getAllByText('Duplicate preset name');
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('trims whitespace from preset name', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    const nameInput = screen.getByLabelText(/Preset Name/i);
    await user.type(nameInput, '  Trimmed Name  ');

    const saveButton = screen.getByRole('button', { name: /Save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"name":"Trimmed Name"'),
      });
    });
  });

  it('shows loading state while saving', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({}),
      } as Response), 1000))
    );

    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    const nameInput = screen.getByLabelText(/Preset Name/i);
    await user.type(nameInput, 'Test');

    const saveButton = screen.getByRole('button', { name: /Save/i });
    await user.click(saveButton);

    // Should show loading state
    expect(screen.getByRole('button', { name: /Saving.../i })).toBeInTheDocument();
    expect(nameInput).toBeDisabled();
  });

  it('prevents closing modal while saving', async () => {
    const user = userEvent.setup();

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({}),
      } as Response), 1000))
    );

    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    const nameInput = screen.getByLabelText(/Preset Name/i);
    await user.type(nameInput, 'Test');

    const saveButton = screen.getByRole('button', { name: /Save/i });
    await user.click(saveButton);

    // Try to close modal (click Cancel)
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    // Should not close while saving
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SavePresetModal isOpen onClose={mockOnClose} />
    );

    const nameInput = screen.getByLabelText(/Preset Name/i);
    const checkbox = screen.getByLabelText(/Set as default preset/i);
    const saveButton = screen.getByRole('button', { name: /Save/i });
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });

    expect(nameInput).toBeInTheDocument();
    expect(checkbox).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    await user.tab();
    const focusedElement = document.activeElement;
    expect([nameInput, checkbox, saveButton, cancelButton]).toContainEqual(focusedElement);
  });
});
