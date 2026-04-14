import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ChatGptGuide } from '../ChatGptGuide';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: mockWriteText },
  });
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatGptGuide', () => {
  it('renders collapsed by default', () => {
    render(<ChatGptGuide />);

    const trigger = screen.getByRole('button', { name: /create questions with chatgpt/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const panel = document.getElementById('chatgpt-guide-panel');
    expect(panel).toHaveAttribute('hidden');
  });

  it('expands when trigger is clicked', () => {
    render(<ChatGptGuide />);

    const trigger = screen.getByRole('button', { name: /create questions with chatgpt/i });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = document.getElementById('chatgpt-guide-panel');
    expect(panel).not.toHaveAttribute('hidden');
  });

  it('collapses when trigger is clicked again', () => {
    render(<ChatGptGuide />);

    const trigger = screen.getByRole('button', { name: /create questions with chatgpt/i });
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    const panel = document.getElementById('chatgpt-guide-panel');
    expect(panel).toHaveAttribute('hidden');
  });

  it('copies prompt to clipboard and shows "Copied!" feedback', async () => {
    render(<ChatGptGuide />);

    // Expand first
    const trigger = screen.getByRole('button', { name: /create questions with chatgpt/i });
    fireEvent.click(trigger);

    const copyBtn = screen.getByRole('button', { name: /copy prompt/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('[YOUR TOPIC HERE]'));
    expect(copyBtn).toHaveTextContent('Copied!');
  });

  it('reverts copy label after 2 seconds', async () => {
    vi.useFakeTimers();
    render(<ChatGptGuide />);

    // Expand
    const trigger = screen.getByRole('button', { name: /create questions with chatgpt/i });
    fireEvent.click(trigger);

    const copyBtn = screen.getByRole('button', { name: /copy prompt/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(copyBtn).toHaveTextContent('Copied!');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(copyBtn).toHaveTextContent('Copy prompt');
  });

  it('writes expansion state to localStorage on toggle', () => {
    render(<ChatGptGuide />);

    const trigger = screen.getByRole('button', { name: /create questions with chatgpt/i });

    fireEvent.click(trigger);
    expect(localStorage.getItem('hgn-trivia-chatgpt-guide-expanded')).toBe('true');

    fireEvent.click(trigger);
    expect(localStorage.getItem('hgn-trivia-chatgpt-guide-expanded')).toBe('false');
  });

  it('starts expanded if localStorage has "true"', () => {
    localStorage.setItem('hgn-trivia-chatgpt-guide-expanded', 'true');
    render(<ChatGptGuide />);

    const trigger = screen.getByRole('button', { name: /create questions with chatgpt/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = document.getElementById('chatgpt-guide-panel');
    expect(panel).not.toHaveAttribute('hidden');
  });
});
