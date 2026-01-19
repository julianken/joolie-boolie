import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../route';
import { gameSessionStorage } from '@/lib/api/storage';
import { NextRequest } from 'next/server';

// Helper to create mock NextRequest
function createRequest(options: {
  method?: string;
  body?: unknown;
} = {}) {
  return new NextRequest('http://localhost:3000/api/games/test-id', {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

// Helper to create route context
function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/games/[id]', () => {
  beforeEach(() => {
    gameSessionStorage.clear();
  });

  it('returns game when found', async () => {
    const now = new Date().toISOString();
    gameSessionStorage.create({
      id: 'game-123',
      name: 'Test Game',
      status: 'idle',
      patternId: 'pattern-1',
      calledBalls: [],
      currentBall: null,
      autoCallEnabled: false,
      autoCallSpeed: 10,
      audioEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    const response = await GET(createRequest(), createContext('game-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.id).toBe('game-123');
    expect(data.data.name).toBe('Test Game');
    expect(data.error).toBeNull();
  });

  it('returns 404 when game not found', async () => {
    const response = await GET(createRequest(), createContext('nonexistent'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Game session not found');
    expect(data.data).toBeNull();
  });
});

describe('PATCH /api/games/[id]', () => {
  beforeEach(() => {
    gameSessionStorage.clear();
    const now = new Date().toISOString();
    gameSessionStorage.create({
      id: 'game-123',
      name: 'Original Name',
      status: 'idle',
      patternId: null,
      calledBalls: [],
      currentBall: null,
      autoCallEnabled: false,
      autoCallSpeed: 10,
      audioEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('updates game name', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { name: 'Updated Name' } }),
      createContext('game-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe('Updated Name');
    expect(data.error).toBeNull();
  });

  it('updates game status', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { status: 'playing' } }),
      createContext('game-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.status).toBe('playing');
  });

  it('updates multiple fields', async () => {
    const response = await PATCH(
      createRequest({
        method: 'PATCH',
        body: {
          name: 'New Name',
          status: 'paused',
          autoCallSpeed: 20,
          audioEnabled: false,
        },
      }),
      createContext('game-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe('New Name');
    expect(data.data.status).toBe('paused');
    expect(data.data.autoCallSpeed).toBe(20);
    expect(data.data.audioEnabled).toBe(false);
  });

  it('returns 404 when game not found', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { name: 'Test' } }),
      createContext('nonexistent')
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Game session not found');
  });

  it('returns 400 for invalid status', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { status: 'invalid' } }),
      createContext('game-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Status must be one of');
  });

  it('returns 400 for invalid autoCallSpeed', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { autoCallSpeed: 100 } }),
      createContext('game-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('autoCallSpeed must be a number between 5 and 30');
  });

  it('returns 400 for empty name', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { name: '' } }),
      createContext('game-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name must be a non-empty string');
  });
});

describe('DELETE /api/games/[id]', () => {
  beforeEach(() => {
    gameSessionStorage.clear();
    const now = new Date().toISOString();
    gameSessionStorage.create({
      id: 'game-123',
      name: 'To Be Deleted',
      status: 'idle',
      patternId: null,
      calledBalls: [],
      currentBall: null,
      autoCallEnabled: false,
      autoCallSpeed: 10,
      audioEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('deletes existing game', async () => {
    const response = await DELETE(
      createRequest({ method: 'DELETE' }),
      createContext('game-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.deleted).toBe(true);
    expect(data.error).toBeNull();

    // Verify game is deleted
    expect(gameSessionStorage.getById('game-123')).toBeUndefined();
  });

  it('returns 404 when game not found', async () => {
    const response = await DELETE(
      createRequest({ method: 'DELETE' }),
      createContext('nonexistent')
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Game session not found');
  });
});
