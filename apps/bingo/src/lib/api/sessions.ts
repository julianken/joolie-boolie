/**
 * API client functions for session history management.
 * These functions are used by the frontend to interact with the sessions API.
 */

import type {
  BingoSession,
  CreateBingoSessionRequest,
  UpdateBingoSessionRequest,
  ApiResponse,
  PaginatedResponse,
  BingoSessionWinner,
  BingoBall,
} from '@/types';

const API_BASE = '/api/sessions';

/**
 * Fetch all sessions with optional pagination
 */
export async function getSessions(options?: {
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<BingoSession>> {
  const params = new URLSearchParams();
  if (options?.page) params.set('page', options.page.toString());
  if (options?.pageSize) params.set('pageSize', options.pageSize.toString());

  const url = params.toString() ? `${API_BASE}?${params}` : API_BASE;
  const response = await fetch(url);
  return response.json();
}

/**
 * Fetch a single session by ID
 */
export async function getSession(id: string): Promise<ApiResponse<BingoSession>> {
  const response = await fetch(`${API_BASE}/${id}`);
  return response.json();
}

/**
 * Create a new session
 */
export async function createSession(
  data: CreateBingoSessionRequest
): Promise<ApiResponse<BingoSession>> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Update an existing session
 */
export async function updateSession(
  id: string,
  data: UpdateBingoSessionRequest
): Promise<ApiResponse<BingoSession>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Delete a session
 */
export async function deleteSession(
  id: string
): Promise<ApiResponse<{ deleted: boolean }>> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Start a new game session (convenience wrapper)
 */
export async function startSession(
  patternId: string,
  patternName: string,
  userId?: string
): Promise<ApiResponse<BingoSession>> {
  return createSession({ patternId, patternName, userId });
}

/**
 * Record a ball being called in a session
 */
export async function recordBallCalled(
  sessionId: string,
  calledBalls: BingoBall[]
): Promise<ApiResponse<BingoSession>> {
  return updateSession(sessionId, { calledBalls });
}

/**
 * End a session with optional winner
 */
export async function endSession(
  sessionId: string,
  winner?: BingoSessionWinner
): Promise<ApiResponse<BingoSession>> {
  return updateSession(sessionId, {
    endedAt: new Date().toISOString(),
    winner: winner || null,
  });
}

/**
 * Record a winner for a session (without ending it)
 */
export async function recordWinner(
  sessionId: string,
  winner: BingoSessionWinner
): Promise<ApiResponse<BingoSession>> {
  return updateSession(sessionId, { winner });
}
