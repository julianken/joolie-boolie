/**
 * In-memory storage for game sessions, templates, and session history.
 * This is a temporary solution until Supabase integration is ready.
 */

import type { BingoGameSession, GameTemplate, BingoSession } from '@/types';

// In-memory stores
const gameSessionsStore = new Map<string, BingoGameSession>();
const templatesStore = new Map<string, GameTemplate>();
const sessionsStore = new Map<string, BingoSession>();

// Default templates for initialization
const defaultTemplates: GameTemplate[] = [
  {
    id: 'default-1',
    userId: 'system',
    name: 'Standard Bingo',
    patternId: 'horizontal-line',
    autoCallSpeed: 10,
    audioEnabled: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-2',
    userId: 'system',
    name: 'Quick Game',
    patternId: 'four-corners',
    autoCallSpeed: 5,
    audioEnabled: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-3',
    userId: 'system',
    name: 'Blackout Challenge',
    patternId: 'blackout',
    autoCallSpeed: 15,
    audioEnabled: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize default templates
defaultTemplates.forEach(template => {
  templatesStore.set(template.id, template);
});

// Game Session Storage Operations
export const gameSessionStorage = {
  getAll(): BingoGameSession[] {
    return Array.from(gameSessionsStore.values());
  },

  getById(id: string): BingoGameSession | undefined {
    return gameSessionsStore.get(id);
  },

  create(session: BingoGameSession): BingoGameSession {
    gameSessionsStore.set(session.id, session);
    return session;
  },

  update(id: string, updates: Partial<BingoGameSession>): BingoGameSession | undefined {
    const existing = gameSessionsStore.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    gameSessionsStore.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return gameSessionsStore.delete(id);
  },

  clear(): void {
    gameSessionsStore.clear();
  },
};

// Template Storage Operations
export const templateStorage = {
  getAll(): GameTemplate[] {
    return Array.from(templatesStore.values());
  },

  getById(id: string): GameTemplate | undefined {
    return templatesStore.get(id);
  },

  create(template: GameTemplate): GameTemplate {
    templatesStore.set(template.id, template);
    return template;
  },

  update(id: string, updates: Partial<GameTemplate>): GameTemplate | undefined {
    const existing = templatesStore.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    templatesStore.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return templatesStore.delete(id);
  },

  clear(): void {
    templatesStore.clear();
    // Re-add default templates
    defaultTemplates.forEach(template => {
      templatesStore.set(template.id, template);
    });
  },
};

// Session History Storage Operations
export const sessionStorage = {
  getAll(): BingoSession[] {
    // Return sessions sorted by createdAt descending (newest first)
    return Array.from(sessionsStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getById(id: string): BingoSession | undefined {
    return sessionsStore.get(id);
  },

  create(session: BingoSession): BingoSession {
    sessionsStore.set(session.id, session);
    return session;
  },

  update(id: string, updates: Partial<BingoSession>): BingoSession | undefined {
    const existing = sessionsStore.get(id);
    if (!existing) return undefined;

    const updated: BingoSession = {
      ...existing,
      ...updates,
      // Recalculate totalBallsCalled if calledBalls is updated
      totalBallsCalled: updates.calledBalls
        ? updates.calledBalls.length
        : existing.totalBallsCalled,
      updatedAt: new Date().toISOString(),
    };
    sessionsStore.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return sessionsStore.delete(id);
  },

  clear(): void {
    sessionsStore.clear();
  },
};

// Utility to generate UUIDs
export function generateId(): string {
  return crypto.randomUUID();
}
