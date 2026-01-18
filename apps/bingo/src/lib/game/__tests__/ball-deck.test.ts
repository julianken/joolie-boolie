import { describe, it, expect } from 'vitest';
import {
  createDeck,
  drawBall,
  undoDraw,
  getColumnForNumber,
  fisherYatesShuffle,
  createBall,
  generateAllBalls,
  getBallsByColumn,
  getRemainingCount,
  getDrawnCount,
} from '../ball-deck';

describe('ball-deck', () => {
  describe('getColumnForNumber', () => {
    it('returns B for 1-15', () => {
      expect(getColumnForNumber(1)).toBe('B');
      expect(getColumnForNumber(15)).toBe('B');
    });

    it('returns I for 16-30', () => {
      expect(getColumnForNumber(16)).toBe('I');
      expect(getColumnForNumber(30)).toBe('I');
    });

    it('returns N for 31-45', () => {
      expect(getColumnForNumber(31)).toBe('N');
      expect(getColumnForNumber(45)).toBe('N');
    });

    it('returns G for 46-60', () => {
      expect(getColumnForNumber(46)).toBe('G');
      expect(getColumnForNumber(60)).toBe('G');
    });

    it('returns O for 61-75', () => {
      expect(getColumnForNumber(61)).toBe('O');
      expect(getColumnForNumber(75)).toBe('O');
    });

    it('throws error for invalid numbers', () => {
      expect(() => getColumnForNumber(0)).toThrow('Invalid ball number: 0');
      expect(() => getColumnForNumber(76)).toThrow('Invalid ball number: 76');
      expect(() => getColumnForNumber(-1)).toThrow('Invalid ball number: -1');
    });
  });

  describe('createBall', () => {
    it('creates a ball with correct column and label', () => {
      const ball = createBall(1);
      expect(ball.column).toBe('B');
      expect(ball.number).toBe(1);
      expect(ball.label).toBe('B-1');
    });

    it('creates balls with correct labels for each column', () => {
      expect(createBall(15).label).toBe('B-15');
      expect(createBall(16).label).toBe('I-16');
      expect(createBall(31).label).toBe('N-31');
      expect(createBall(46).label).toBe('G-46');
      expect(createBall(75).label).toBe('O-75');
    });
  });

  describe('generateAllBalls', () => {
    it('generates 75 balls', () => {
      const balls = generateAllBalls();
      expect(balls).toHaveLength(75);
    });

    it('generates balls in column order (B, I, N, G, O)', () => {
      const balls = generateAllBalls();
      // First 15 should be B
      for (let i = 0; i < 15; i++) {
        expect(balls[i].column).toBe('B');
        expect(balls[i].number).toBe(i + 1);
      }
      // Next 15 should be I
      for (let i = 15; i < 30; i++) {
        expect(balls[i].column).toBe('I');
        expect(balls[i].number).toBe(i + 1);
      }
    });

    it('generates unique ball numbers', () => {
      const balls = generateAllBalls();
      const numbers = balls.map((b) => b.number);
      const uniqueNumbers = new Set(numbers);
      expect(uniqueNumbers.size).toBe(75);
    });
  });

  describe('createDeck', () => {
    it('creates a deck with 75 balls', () => {
      const deck = createDeck();
      expect(deck.remaining).toHaveLength(75);
      expect(deck.drawn).toHaveLength(0);
    });

    it('shuffles the deck (not in sequential order)', () => {
      const deck = createDeck();
      const numbers = deck.remaining.map((b) => b.number);
      const sequential = Array.from({ length: 75 }, (_, i) => i + 1);
      expect(numbers).not.toEqual(sequential);
    });
  });

  describe('drawBall', () => {
    it('draws a ball from the deck', () => {
      const deck = createDeck();
      const result = drawBall(deck);
      expect(result).not.toBeNull();
      expect(result!.deck.remaining).toHaveLength(74);
      expect(result!.deck.drawn).toHaveLength(1);
    });

    it('returns null when deck is empty', () => {
      let deck = createDeck();
      for (let i = 0; i < 75; i++) {
        deck = drawBall(deck)!.deck;
      }
      expect(drawBall(deck)).toBeNull();
    });
  });

  describe('undoDraw', () => {
    it('returns the last drawn ball to remaining', () => {
      const deck = createDeck();
      const drawn = drawBall(deck)!;
      const undone = undoDraw(drawn.deck)!;
      expect(undone.ball).toEqual(drawn.ball);
      expect(undone.deck.remaining).toHaveLength(75);
      expect(undone.deck.drawn).toHaveLength(0);
    });

    it('returns null when no balls drawn', () => {
      const deck = createDeck();
      expect(undoDraw(deck)).toBeNull();
    });
  });

  describe('fisherYatesShuffle', () => {
    it('returns array of same length', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(fisherYatesShuffle(arr)).toHaveLength(5);
    });

    it('contains all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = fisherYatesShuffle(arr);
      expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('does not mutate original array', () => {
      const arr = [1, 2, 3, 4, 5];
      fisherYatesShuffle(arr);
      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });

    it('handles empty array', () => {
      expect(fisherYatesShuffle([])).toEqual([]);
    });

    it('handles single element array', () => {
      expect(fisherYatesShuffle([42])).toEqual([42]);
    });
  });

  describe('getBallsByColumn', () => {
    it('groups balls by column', () => {
      const balls = [
        createBall(1),
        createBall(15),
        createBall(16),
        createBall(31),
        createBall(46),
        createBall(61),
      ];
      const grouped = getBallsByColumn(balls);

      expect(grouped.B).toEqual([1, 15]);
      expect(grouped.I).toEqual([16]);
      expect(grouped.N).toEqual([31]);
      expect(grouped.G).toEqual([46]);
      expect(grouped.O).toEqual([61]);
    });

    it('returns empty arrays for columns with no balls', () => {
      const balls = [createBall(1)];
      const grouped = getBallsByColumn(balls);

      expect(grouped.B).toEqual([1]);
      expect(grouped.I).toEqual([]);
      expect(grouped.N).toEqual([]);
      expect(grouped.G).toEqual([]);
      expect(grouped.O).toEqual([]);
    });

    it('sorts numbers within each column', () => {
      const balls = [createBall(15), createBall(5), createBall(10), createBall(1)];
      const grouped = getBallsByColumn(balls);

      expect(grouped.B).toEqual([1, 5, 10, 15]);
    });

    it('handles empty input', () => {
      const grouped = getBallsByColumn([]);
      expect(grouped.B).toEqual([]);
      expect(grouped.I).toEqual([]);
      expect(grouped.N).toEqual([]);
      expect(grouped.G).toEqual([]);
      expect(grouped.O).toEqual([]);
    });
  });

  describe('getRemainingCount', () => {
    it('returns 75 for a new deck', () => {
      const deck = createDeck();
      expect(getRemainingCount(deck)).toBe(75);
    });

    it('decreases as balls are drawn', () => {
      const deck = createDeck();
      const result = drawBall(deck)!;
      expect(getRemainingCount(result.deck)).toBe(74);
    });

    it('returns 0 when all balls are drawn', () => {
      let deck = createDeck();
      for (let i = 0; i < 75; i++) {
        deck = drawBall(deck)!.deck;
      }
      expect(getRemainingCount(deck)).toBe(0);
    });
  });

  describe('getDrawnCount', () => {
    it('returns 0 for a new deck', () => {
      const deck = createDeck();
      expect(getDrawnCount(deck)).toBe(0);
    });

    it('increases as balls are drawn', () => {
      const deck = createDeck();
      const result = drawBall(deck)!;
      expect(getDrawnCount(result.deck)).toBe(1);
    });

    it('returns 75 when all balls are drawn', () => {
      let deck = createDeck();
      for (let i = 0; i < 75; i++) {
        deck = drawBall(deck)!.deck;
      }
      expect(getDrawnCount(deck)).toBe(75);
    });
  });
});
