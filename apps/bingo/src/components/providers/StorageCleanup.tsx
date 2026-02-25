'use client';

import { useEffect } from 'react';
import { cleanupExpiredGameState } from '@joolie-boolie/game-engine';

/**
 * Background storage cleanup component.
 * Runs once on mount to remove expired jb-prefixed localStorage entries
 * (older than 30 days). Renders nothing.
 */
export function StorageCleanup() {
  useEffect(() => {
    try {
      cleanupExpiredGameState();
    } catch {
      // Non-critical -- silently ignore errors
    }
  }, []);

  return null;
}
