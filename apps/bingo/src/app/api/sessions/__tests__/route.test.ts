import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { sessionStorage } from '@/lib/api/storage';
import { NextRequest } from 'next/server';
import type { BingoSession } from '@/types';

// Helper to create mock NextRequest
function createRequest(options: {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL('http://localhost:3000/api/sessions');
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

// Helper to create a test session
function createTestSession(overrides: Partial<BingoSession> = {}): BingoSession {
  const now = new Date().toISOString();
  return {
    id: 'session-1',
    userId: null,
    patternId: 'blackout',
    patternName: 'Blackout',
    calledBalls: [],
    totalBallsCalled: 0,
    winner: null,
    startedAt: now,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('GET /api/sessions', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns empty list when no sessions exist', async () => {
    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.total).toBe(0);
    expect(data.error).toBeNull();
  });

  it('returns list of sessions with pagination', async () => {
    sessionStorage.create(createTestSession({ id: 'session-1' }));
    sessionStorage.create(createTestSession({ id: 'session-2', patternName: 'Four Corners' }));

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(10);
  });

  it('respects pagination parameters', async () => {
    // Create 15 test sessions
    for (let i = 1; i <= 15; i++) {
      sessionStorage.create(createTestSession({
        id: `session-${i}`,
        createdAt: new Date(2024, 0, i).toISOString(),
      }));
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

  it('returns sessions sorted by createdAt descending', async () => {
    sessionStorage.create(createTestSession({
      id: 'older',
      createdAt: new Date(2024, 0, 1).toISOString(),
    }));
    sessionStorage.create(createTestSession({
      id: 'newer',
      createdAt: new Date(2024, 0, 15).toISOString(),
    }));

    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data[0].id).toBe('newer');
    expect(data.data[1].id).toBe('older');
  });
});

describe('POST /api/sessions', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('creates a new session with valid data', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { patternId: 'blackout', patternName: 'Blackout' },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toBeDefined();
    expect(data.data.patternId).toBe('blackout');
    expect(data.data.patternName).toBe('Blackout');
    expect(data.data.calledBalls).toEqual([]);
    expect(data.data.totalBallsCalled).toBe(0);
    expect(data.data.winner).toBeNull();
    expect(data.data.endedAt).toBeNull();
    expect(data.data.userId).toBeNull();
    expect(data.error).toBeNull();
  });

  it('creates a session with userId', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { patternId: 'four-corners', patternName: 'Four Corners', userId: 'user-123' },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.userId).toBe('user-123');
  });

  it('returns 400 when patternId is missing', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { patternName: 'Blackout' },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('patternId is required and must be a non-empty string');
    expect(data.data).toBeNull();
  });

  it('returns 400 when patternName is missing', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { patternId: 'blackout' },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('patternName is required and must be a non-empty string');
    expect(data.data).toBeNull();
  });

  it('returns 400 when patternId is empty', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: { patternId: '   ', patternName: 'Blackout' },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('patternId is required and must be a non-empty string');
  });

  it('trims whitespace from fields', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        patternId: '  blackout  ',
        patternName: '  Blackout Challenge  ',
        userId: '  user-123  ',
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.patternId).toBe('blackout');
    expect(data.data.patternName).toBe('Blackout Challenge');
    expect(data.data.userId).toBe('user-123');
  });
});
