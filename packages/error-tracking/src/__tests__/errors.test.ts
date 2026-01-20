import { describe, it, expect } from 'vitest';
import { AppError } from '../types/errors';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('AppError');
      expect(error.category).toBe('unknown');
      expect(error.severity).toBe('medium');
      expect(error.recoverable).toBe(false);
      expect(error.id).toMatch(/^err_[a-z0-9]+_[a-z0-9]+$/);
      expect(error.context.timestamp).toBeGreaterThan(0);
    });

    it('should accept custom category', () => {
      const error = new AppError('Network failed', { category: 'network' });

      expect(error.category).toBe('network');
    });

    it('should accept custom severity', () => {
      const error = new AppError('Critical failure', { severity: 'critical' });

      expect(error.severity).toBe('critical');
    });

    it('should accept recoverable flag', () => {
      const error = new AppError('Try again', { recoverable: true });

      expect(error.recoverable).toBe(true);
    });

    it('should accept custom user message', () => {
      const error = new AppError('Technical error', {
        userMessage: 'Please try again later',
      });

      expect(error.userMessage).toBe('Please try again later');
    });

    it('should use default user message based on category', () => {
      const networkError = new AppError('fetch failed', { category: 'network' });
      const authError = new AppError('token expired', { category: 'auth' });

      expect(networkError.userMessage).toContain('trouble connecting');
      expect(authError.userMessage).toContain('problem with your login');
    });

    it('should capture context metadata', () => {
      const error = new AppError('Test error', {
        userAction: 'button_click',
        component: 'GameBoard',
        metadata: { gameId: 'abc123' },
      });

      expect(error.context.userAction).toBe('button_click');
      expect(error.context.component).toBe('GameBoard');
      expect(error.context.metadata).toEqual({ gameId: 'abc123' });
    });
  });

  describe('toTrackedError', () => {
    it('should convert to TrackedError format', () => {
      const error = new AppError('Test error', {
        category: 'game',
        severity: 'high',
      });

      const tracked = error.toTrackedError();

      expect(tracked.id).toBe(error.id);
      expect(tracked.message).toBe('Test error');
      expect(tracked.category).toBe('game');
      expect(tracked.severity).toBe('high');
      expect(tracked.context).toBe(error.context);
      expect(tracked.stack).toBe(error.stack);
      expect(tracked.originalError).toBe(error);
    });
  });

  describe('Error inheritance', () => {
    it('should be an instance of Error', () => {
      const error = new AppError('Test');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should have a stack trace', () => {
      const error = new AppError('Test');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });
});
