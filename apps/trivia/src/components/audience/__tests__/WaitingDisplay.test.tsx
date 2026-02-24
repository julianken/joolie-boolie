import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaitingDisplay } from '../WaitingDisplay';

describe('WaitingDisplay', () => {
  describe('rendering', () => {
    it('should render the provided message', () => {
      render(<WaitingDisplay message="Waiting for the game to start..." />);

      expect(
        screen.getByText('Waiting for the game to start...')
      ).toBeInTheDocument();
    });

    it('should render a different message', () => {
      render(<WaitingDisplay message="Please stand by" />);

      expect(screen.getByText('Please stand by')).toBeInTheDocument();
    });

    it('should render the helper text', () => {
      render(<WaitingDisplay message="Test message" />);

      expect(
        screen.getByText('The game will appear here when the presenter is ready.')
      ).toBeInTheDocument();
    });
  });

  describe('text size for readability', () => {
    it('should have the message as a distinct paragraph', () => {
      render(
        <WaitingDisplay message="Large readable message" />
      );

      const messageElement = screen.getByText('Large readable message');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement.tagName).toBe('P');
      expect(messageElement).toHaveClass('font-medium');
    });

    it('should have readable text for the helper', () => {
      render(<WaitingDisplay message="Test" />);

      const helperElement = screen.getByText(
        'The game will appear here when the presenter is ready.'
      );
      expect(helperElement).toBeInTheDocument();
      expect(helperElement).toHaveClass('text-foreground-secondary');
    });
  });

  describe('layout', () => {
    it('should be centered vertically', () => {
      const { container } = render(<WaitingDisplay message="Test" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('should fill available height', () => {
      const { container } = render(<WaitingDisplay message="Test" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('h-full');
    });
  });

  describe('loading indicator', () => {
    it('should render a spinner', () => {
      const { container } = render(<WaitingDisplay message="Loading" />);

      // Check for the spinning element
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should have visible spinner styling', () => {
      const { container } = render(<WaitingDisplay message="Loading" />);

      const spinner = container.querySelector('.rounded-full.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('accessibility', () => {
    it('should have centered text', () => {
      const { container } = render(<WaitingDisplay message="Test" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('text-center');
    });

    it('should have role="status"', () => {
      render(<WaitingDisplay message="Test" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-label matching message', () => {
      render(<WaitingDisplay message="Game starting soon" />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Game starting soon');
    });
  });
});
