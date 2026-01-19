import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up portals and body styles
    document.body.style.overflow = '';
  });

  it('renders when isOpen is true', async () => {
    render(<Modal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title', async () => {
    render(<Modal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });
  });

  it('renders children content', async () => {
    render(<Modal {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });
  });

  describe('closing behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const handleClose = vi.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);
      await waitFor(() => {
        expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Close modal'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const handleClose = vi.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', async () => {
      const handleClose = vi.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cancel'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirm behavior', () => {
    it('renders confirm button when onConfirm is provided', async () => {
      const handleConfirm = vi.fn();
      render(<Modal {...defaultProps} onConfirm={handleConfirm} />);
      await waitFor(() => {
        expect(screen.getByText('Confirm')).toBeInTheDocument();
      });
    });

    it('calls onConfirm when confirm button is clicked', async () => {
      const handleConfirm = vi.fn();
      render(<Modal {...defaultProps} onConfirm={handleConfirm} />);
      await waitFor(() => {
        expect(screen.getByText('Confirm')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Confirm'));
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('uses custom confirm label', async () => {
      render(
        <Modal {...defaultProps} onConfirm={() => {}} confirmLabel="Delete" />
      );
      await waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
      });
    });

    it('uses custom cancel label', async () => {
      render(<Modal {...defaultProps} cancelLabel="Never mind" />);
      await waitFor(() => {
        expect(screen.getByText('Never mind')).toBeInTheDocument();
      });
    });
  });

  describe('variants', () => {
    it('applies danger variant to confirm button', async () => {
      render(
        <Modal
          {...defaultProps}
          onConfirm={() => {}}
          variant="danger"
          confirmLabel="Delete"
        />
      );
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        expect(deleteButton.className).toContain('bg-error');
      });
    });

    it('applies primary variant by default', async () => {
      render(<Modal {...defaultProps} onConfirm={() => {}} />);
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirm');
        expect(confirmButton.className).toContain('bg-primary');
      });
    });
  });

  describe('footer visibility', () => {
    it('hides footer when showFooter is false', async () => {
      render(<Modal {...defaultProps} showFooter={false} />);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('shows footer by default', async () => {
      render(<Modal {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', async () => {
      render(<Modal {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('has aria-modal="true"', async () => {
      render(<Modal {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      });
    });

    it('has aria-labelledby pointing to title', async () => {
      render(<Modal {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute(
          'aria-labelledby',
          'modal-title'
        );
      });
    });

    it('prevents body scroll when open', async () => {
      render(<Modal {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
    });

    it('restores body scroll when closed', async () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden');
      });
      rerender(<Modal {...defaultProps} isOpen={false} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });
  });

  describe('focus management', () => {
    it('close button has accessible label', async () => {
      render(<Modal {...defaultProps} />);
      await waitFor(() => {
        expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
      });
    });
  });
});
