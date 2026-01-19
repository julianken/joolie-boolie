import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../route';
import { sessionStorage } from '@/lib/api/storage';
import { NextRequest } from 'next/server';
import type { BingoSession, BingoBall } from '@/types';

// Helper to create mock NextRequest
function createRequest(options: {
  method?: string;
  body?: unknown;
} = {}) {
  return new NextRequest('http://localhost:3000/api/sessions/test-id', {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

// Helper to create route context
function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

// Helper to create a test session
function createTestSession(overrides: Partial<BingoSession> = {}): BingoSession {
  const now = new Date().toISOString();
  return {
    id: 'session-123',
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

// Helper to create a test ball
function createTestBall(column: 'B' | 'I' | 'N' | 'G' | 'O', number: number): BingoBall {
  return {
    column,
    number,
    label: `${column}-${number}`,
  };
}

describe('GET /api/sessions/[id]', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('returns session when found', async () => {
    sessionStorage.create(createTestSession({ id: 'session-123' }));

    const response = await GET(createRequest(), createContext('session-123'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.id).toBe('session-123');
    expect(data.data.patternId).toBe('blackout');
    expect(data.data.patternName).toBe('Blackout');
    expect(data.error).toBeNull();
  });

  it('returns 404 when session not found', async () => {
    const response = await GET(createRequest(), createContext('nonexistent'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Session not found');
    expect(data.data).toBeNull();
  });
});

describe('PATCH /api/sessions/[id]', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.create(createTestSession({ id: 'session-123' }));
  });

  it('updates calledBalls and totalBallsCalled', async () => {
    const balls = [
      createTestBall('B', 1),
      createTestBall('I', 16),
      createTestBall('N', 31),
    ];

    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { calledBalls: balls } }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.calledBalls).toHaveLength(3);
    expect(data.data.totalBallsCalled).toBe(3);
    expect(data.error).toBeNull();
  });

  it('updates winner with valid data', async () => {
    const winner = {
      name: 'John Doe',
      cardNumber: 'CARD-001',
      verifiedAt: new Date().toISOString(),
    };

    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { winner } }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.winner).toEqual(winner);
  });

  it('allows setting winner to null', async () => {
    // First set a winner
    const session = createTestSession({
      id: 'session-456',
      winner: { name: 'Jane', verifiedAt: new Date().toISOString() },
    });
    sessionStorage.create(session);

    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { winner: null } }),
      createContext('session-456')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.winner).toBeNull();
  });

  it('updates endedAt with valid ISO date', async () => {
    const endedAt = new Date().toISOString();

    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { endedAt } }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.endedAt).toBe(endedAt);
  });

  it('allows setting endedAt to null', async () => {
    const session = createTestSession({
      id: 'session-456',
      endedAt: new Date().toISOString(),
    });
    sessionStorage.create(session);

    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { endedAt: null } }),
      createContext('session-456')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.endedAt).toBeNull();
  });

  it('updates multiple fields at once', async () => {
    const balls = [createTestBall('B', 5)];
    const winner = { name: 'Alice', verifiedAt: new Date().toISOString() };
    const endedAt = new Date().toISOString();

    const response = await PATCH(
      createRequest({
        method: 'PATCH',
        body: { calledBalls: balls, winner, endedAt },
      }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.calledBalls).toHaveLength(1);
    expect(data.data.totalBallsCalled).toBe(1);
    expect(data.data.winner.name).toBe('Alice');
    expect(data.data.endedAt).toBe(endedAt);
  });

  it('returns 404 when session not found', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { endedAt: new Date().toISOString() } }),
      createContext('nonexistent')
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Session not found');
  });

  it('returns 400 when calledBalls is not an array', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { calledBalls: 'not-an-array' } }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('calledBalls must be an array');
  });

  it('returns 400 when winner is invalid', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { winner: { name: '' } } }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('winner must be null or an object');
  });

  it('returns 400 when winner is missing verifiedAt', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { winner: { name: 'John' } } }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('winner must be null or an object');
  });

  it('returns 400 when endedAt is invalid date string', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { endedAt: 'not-a-date' } }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('endedAt must be a valid ISO date string');
  });
});

describe('DELETE /api/sessions/[id]', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.create(createTestSession({ id: 'session-123' }));
  });

  it('deletes existing session', async () => {
    const response = await DELETE(
      createRequest({ method: 'DELETE' }),
      createContext('session-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.deleted).toBe(true);
    expect(data.error).toBeNull();

    // Verify session is deleted
    expect(sessionStorage.getById('session-123')).toBeUndefined();
  });

  it('returns 404 when session not found', async () => {
    const response = await DELETE(
      createRequest({ method: 'DELETE' }),
      createContext('nonexistent')
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Session not found');
  });
});
