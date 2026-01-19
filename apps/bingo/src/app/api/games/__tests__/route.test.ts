import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { gameSessionStorage } from '@/lib/api/storage';
import { NextRequest } from 'next/server';

// Helper to create mock NextRequest
function createRequest(options: {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL('http://localhost:3000/api/games');
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return new NextRequest(url, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

describe('GET /api/games', () => {
  beforeEach(() => {
    gameSessionStorage.clear();
  });

  it('returns empty list when no games exist', async () => {
    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
    expect(data.error).toBeNull();
  });

  it('returns list of games with pagination', async () => {
    // Create some test games
    const now = new Date().toISOString();
    gameSessionStorage.create({
      id: 'game-1',
      name: 'Game 1',
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
    gameSessionStorage.create({
      id: 'game-2',
      name: 'Game 2',
      status: 'playing',
      patternId: 'pattern-1',
      calledBalls: [],
      currentBall: null,
      autoCallEnabled: true,
      autoCallSpeed: 5,
      audioEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(10);
  });

  it('respects pagination parameters', async () => {
    // Create 15 test games
    const now = new Date().toISOString();
    for (let i = 1; i <= 15; i++) {
      gameSessionStorage.create({
        id: `game-${i}`,
        name: `Game ${i}`,
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
    }

    const response = await GET(createRequest({
      searchParams: { page: '2', pageSize: '5' },
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(5);
    expect(data.total).toBe(15);
    expect(data.page).toBe(2);
    expect(data.pageSize).toBe(5);
  });
});

describe('POST /api/games', () => {
  beforeEach(() => {
    gameSessionStorage.clear();
  });

  it('creates a new game with valid data', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { name: 'My New Game' },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toBeDefined();
    expect(data.data.name).toBe('My New Game');
    expect(data.data.status).toBe('idle');
    expect(data.data.autoCallSpeed).toBe(10);
    expect(data.data.audioEnabled).toBe(true);
    expect(data.error).toBeNull();
  });

  it('creates a game with all optional parameters', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: 'Custom Game',
        patternId: 'blackout',
        autoCallSpeed: 15,
        audioEnabled: false,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe('Custom Game');
    expect(data.data.patternId).toBe('blackout');
    expect(data.data.autoCallSpeed).toBe(15);
    expect(data.data.audioEnabled).toBe(false);
  });

  it('returns 400 when name is missing', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {},
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name is required and must be a non-empty string');
    expect(data.data).toBeNull();
  });

  it('returns 400 when name is empty', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { name: '   ' },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name is required and must be a non-empty string');
  });

  it('returns 400 when autoCallSpeed is out of range', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { name: 'Test Game', autoCallSpeed: 3 },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('autoCallSpeed must be a number between 5 and 30');
  });

  it('trims whitespace from name', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { name: '  Trimmed Name  ' },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe('Trimmed Name');
  });
});
