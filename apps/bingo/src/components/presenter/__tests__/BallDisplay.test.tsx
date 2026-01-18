import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BallDisplay, RecentBalls, BallCounter } from '../BallDisplay';
import { BingoBall } from '@/types';

describe('BallDisplay', () => {
  const mockBall: BingoBall = {
    column: 'B',
    number: 5,
    label: 'B-5',
  };

  describe('when ball is null', () => {
    it('renders placeholder', () => {
      render(<BallDisplay ball={null} />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('has accessible label for no ball', () => {
      render(<BallDisplay ball={null} />);
      expect(screen.getByLabelText('No ball called yet')).toBeInTheDocument();
    });
  });

  describe('when ball is provided', () => {
    it('renders ball with column letter', () => {
      render(<BallDisplay ball={mockBall} />);
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('renders ball number', () => {
      render(<BallDisplay ball={mockBall} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('has accessible label with ball info', () => {
      render(<BallDisplay ball={mockBall} />);
      expect(screen.getByRole('img', { name: 'Ball B-5' })).toBeInTheDocument();
    });
  });

  describe('column colors', () => {
    const columnBalls: Record<string, BingoBall> = {
      B: { column: 'B', number: 1, label: 'B-1' },
      I: { column: 'I', number: 16, label: 'I-16' },
      N: { column: 'N', number: 31, label: 'N-31' },
      G: { column: 'G', number: 46, label: 'G-46' },
      O: { column: 'O', number: 61, label: 'O-61' },
    };

    it('applies B column color', () => {
      render(<BallDisplay ball={columnBalls.B} />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('bg-ball-b');
    });

    it('applies I column color', () => {
      render(<BallDisplay ball={columnBalls.I} />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('bg-ball-i');
    });

    it('applies N column color', () => {
      render(<BallDisplay ball={columnBalls.N} />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('bg-ball-n');
    });

    it('applies G column color', () => {
      render(<BallDisplay ball={columnBalls.G} />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('bg-ball-g');
    });

    it('applies O column color', () => {
      render(<BallDisplay ball={columnBalls.O} />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('bg-ball-o');
    });
  });

  describe('size variants', () => {
    it('applies sm size class', () => {
      render(<BallDisplay ball={mockBall} size="sm" />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('w-[48px]');
    });

    it('applies md size class', () => {
      render(<BallDisplay ball={mockBall} size="md" />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('w-[64px]');
    });

    it('applies lg size class by default', () => {
      render(<BallDisplay ball={mockBall} />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('w-[96px]');
    });

    it('applies xl size class', () => {
      render(<BallDisplay ball={mockBall} size="xl" />);
      const ball = screen.getByRole('img');
      expect(ball.className).toContain('w-[160px]');
    });
  });
});

describe('RecentBalls', () => {
  const mockBalls: BingoBall[] = [
    { column: 'B', number: 5, label: 'B-5' },
    { column: 'I', number: 20, label: 'I-20' },
    { column: 'N', number: 35, label: 'N-35' },
  ];

  it('shows empty message when no balls', () => {
    render(<RecentBalls balls={[]} />);
    expect(screen.getByText('No balls called yet')).toBeInTheDocument();
  });

  it('renders multiple balls', () => {
    render(<RecentBalls balls={mockBalls} />);
    expect(screen.getByRole('img', { name: 'Ball B-5' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ball I-20' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ball N-35' })).toBeInTheDocument();
  });

  it('limits display to maxDisplay prop', () => {
    const manyBalls: BingoBall[] = [
      { column: 'B', number: 1, label: 'B-1' },
      { column: 'B', number: 2, label: 'B-2' },
      { column: 'B', number: 3, label: 'B-3' },
      { column: 'B', number: 4, label: 'B-4' },
      { column: 'B', number: 5, label: 'B-5' },
      { column: 'B', number: 6, label: 'B-6' },
    ];
    render(<RecentBalls balls={manyBalls} maxDisplay={3} />);
    const balls = screen.getAllByRole('img');
    expect(balls).toHaveLength(3);
  });

  it('shows Recent Calls heading', () => {
    render(<RecentBalls balls={mockBalls} />);
    expect(screen.getByText('Recent Calls')).toBeInTheDocument();
  });
});

describe('BallCounter', () => {
  it('shows called count', () => {
    render(<BallCounter called={10} remaining={65} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Called')).toBeInTheDocument();
  });

  it('shows remaining count', () => {
    render(<BallCounter called={10} remaining={65} />);
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();
  });

  it('displays zero counts correctly', () => {
    render(<BallCounter called={0} remaining={75} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });
});
