import { describe, it, expect } from 'vitest';
import { isProfile, isBingoTemplate, isTriviaTemplate } from '../types';

describe('type guards', () => {
  describe('isProfile', () => {
    it('returns true for valid profile object', () => {
      const profile = {
        id: '123',
        facility_name: 'Test Facility',
        default_game_title: null,
        logo_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(isProfile(profile)).toBe(true);
    });

    it('returns false for object missing required fields', () => {
      expect(isProfile({ id: '123' })).toBe(false);
      expect(isProfile({ created_at: '2024-01-01' })).toBe(false);
    });

    it('returns false for non-objects', () => {
      expect(isProfile(null)).toBe(false);
      expect(isProfile(undefined)).toBe(false);
      expect(isProfile('string')).toBe(false);
      expect(isProfile(123)).toBe(false);
    });
  });

  describe('isBingoTemplate', () => {
    it('returns true for valid bingo template object', () => {
      const template = {
        id: '123',
        user_id: 'user-456',
        name: 'Test Template',
        pattern_id: 'regular',
        voice_pack: 'classic',
        auto_call_enabled: false,
        auto_call_interval: 5000,
        is_default: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(isBingoTemplate(template)).toBe(true);
    });

    it('returns false for object missing required fields', () => {
      expect(isBingoTemplate({ id: '123' })).toBe(false);
      expect(isBingoTemplate({ id: '123', user_id: '456' })).toBe(false);
    });

    it('returns false for non-objects', () => {
      expect(isBingoTemplate(null)).toBe(false);
      expect(isBingoTemplate(undefined)).toBe(false);
    });
  });

  describe('isTriviaTemplate', () => {
    it('returns true for valid trivia template object', () => {
      const template = {
        id: '123',
        user_id: 'user-456',
        name: 'Test Trivia',
        questions: [],
        rounds_count: 3,
        questions_per_round: 5,
        timer_duration: 30,
        is_default: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(isTriviaTemplate(template)).toBe(true);
    });

    it('returns false for object missing required fields', () => {
      expect(isTriviaTemplate({ id: '123', user_id: '456' })).toBe(false);
    });

    it('returns false for non-objects', () => {
      expect(isTriviaTemplate(null)).toBe(false);
      expect(isTriviaTemplate(undefined)).toBe(false);
    });
  });
});
