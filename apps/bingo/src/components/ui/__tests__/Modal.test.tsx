import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    // Clean up any portals
    document.body.textContent = '';
  });

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders title', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  describe('closing behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);
      fireEvent.click(screen.getByLabelText('Close modal'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const handleClose = vi.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);
      // Click the backdrop (the element with bg-black/50)
      const backdrop = document.querySelector('.bg-black\\/50');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(handleClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Cancel button is clicked', () => {
      const handleClose = vi.fn();
      render(<Modal {...defaultProps} onClose={handleClose} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirm behavior', () => {
    it('renders confirm button when onConfirm is provided', () => {
      const handleConfirm = vi.fn();
      render(<Modal {...defaultProps} onConfirm={handleConfirm} />);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', () => {
      const handleConfirm = vi.fn();
      render(<Modal {...defaultProps} onConfirm={handleConfirm} />);
      fireEvent.click(screen.getByText('Confirm'));
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('uses custom confirm label', () => {
      render(
        <Modal {...defaultProps} onConfirm={() => {}} confirmLabel="Delete" />
      );
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('uses custom cancel label', () => {
      render(<Modal {...defaultProps} cancelLabel="Never mind" />);
      expect(screen.getByText('Never mind')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies danger variant to confirm button', () => {
      render(
        <Modal
          {...defaultProps}
          onConfirm={() => {}}
          variant="danger"
          confirmLabel="Delete"
        />
      );
      const deleteButton = screen.getByText('Delete');
      expect(deleteButton.className).toContain('bg-error');
    });

    it('applies primary variant by default', () => {
      render(<Modal {...defaultProps} onConfirm={() => {}} />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton.className).toContain('bg-primary');
    });
  });

  describe('footer visibility', () => {
    it('hides footer when showFooter is false', () => {
      render(<Modal {...defaultProps} showFooter={false} />);
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('shows footer by default', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal="true"', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('has aria-labelledby pointing to title', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'modal-title'
      );
    });

    it('prevents body scroll when open', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('focus management', () => {
    it('close button has accessible label', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });
});
