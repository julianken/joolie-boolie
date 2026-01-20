import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as supabaseServer from '@/lib/supabase/server';
import * as tables from '@beak-gaming/database/tables';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock the database functions
vi.mock('@beak-gaming/database/tables', () => ({
  getGameSessionByRoomCode: vi.fn(),
}));

describe('GET /api/sessions/room/[roomCode]', () => {
  const mockClient = {} as ReturnType<typeof supabaseServer.createClient> extends Promise<infer T> ? T : never;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockClient);
  });

  it('returns session data for valid room code', async () => {
    const mockSession = {
      id: 'uuid-1',
      session_id: 'test-session-123',
      room_code: 'ABC123',
      game_type: 'bingo' as const,
      status: 'active' as const,
      game_state: {},
      template_id: null,
      user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      pin_hash: 'hash',
      pin_salt: 'salt',
      failed_pin_attempts: 0,
      last_failed_attempt_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      sequence_number: 0,
    };

    vi.mocked(tables.getGameSessionByRoomCode).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/sessions/room/ABC123');
    const params = Promise.resolve({ roomCode: 'ABC123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      sessionId: 'test-session-123',
      roomCode: 'ABC123',
      gameType: 'bingo',
      status: 'active',
    });
    expect(tables.getGameSessionByRoomCode).toHaveBeenCalledWith(mockClient, 'ABC123');
  });

  it('returns 404 when session not found', async () => {
    vi.mocked(tables.getGameSessionByRoomCode).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/sessions/room/INVALID');
    const params = Promise.resolve({ roomCode: 'INVALID' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Session not found' });
  });

  it('returns 500 on database error', async () => {
    vi.mocked(tables.getGameSessionByRoomCode).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/sessions/room/ABC123');
    const params = Promise.resolve({ roomCode: 'ABC123' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch session' });
  });

  it('handles different game types', async () => {
    const mockSession = {
      id: 'uuid-2',
      session_id: 'trivia-session-456',
      room_code: 'XYZ789',
      game_type: 'trivia' as const,
      status: 'active' as const,
      game_state: {},
      template_id: null,
      user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      pin_hash: 'hash',
      pin_salt: 'salt',
      failed_pin_attempts: 0,
      last_failed_attempt_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      sequence_number: 0,
    };

    vi.mocked(tables.getGameSessionByRoomCode).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/sessions/room/XYZ789');
    const params = Promise.resolve({ roomCode: 'XYZ789' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.gameType).toBe('trivia');
  });

  it('handles completed session status', async () => {
    const mockSession = {
      id: 'uuid-3',
      session_id: 'completed-session',
      room_code: 'DONE99',
      game_type: 'bingo' as const,
      status: 'completed' as const,
      game_state: {},
      template_id: null,
      user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      pin_hash: 'hash',
      pin_salt: 'salt',
      failed_pin_attempts: 0,
      last_failed_attempt_at: new Date().toISOString(),
      last_sync_at: new Date().toISOString(),
      sequence_number: 0,
    };

    vi.mocked(tables.getGameSessionByRoomCode).mockResolvedValue(mockSession);

    const request = new NextRequest('http://localhost:3000/api/sessions/room/DONE99');
    const params = Promise.resolve({ roomCode: 'DONE99' });

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('completed');
  });
});
