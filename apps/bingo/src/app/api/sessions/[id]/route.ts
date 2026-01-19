import { NextRequest, NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/api/storage';
import type {
  BingoSession,
  UpdateBingoSessionRequest,
  ApiResponse,
  BingoSessionWinner,
} from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/sessions/[id]
 * Get a specific session by ID
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const session = sessionStorage.getById(id);

    if (!session) {
      const response: ApiResponse<BingoSession> = {
        data: null,
        error: 'Session not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<BingoSession> = {
      data: session,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<BingoSession> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Validate winner object structure
 */
function isValidWinner(winner: unknown): winner is BingoSessionWinner {
  if (winner === null) return true; // null is valid (no winner)
  if (typeof winner !== 'object') return false;

  const w = winner as Record<string, unknown>;
  if (typeof w.name !== 'string' || w.name.trim().length === 0) return false;
  if (w.cardNumber !== undefined && typeof w.cardNumber !== 'string') return false;
  if (typeof w.verifiedAt !== 'string') return false;

  return true;
}

/**
 * PATCH /api/sessions/[id]
 * Update a session (add called balls, set winner, end session)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json() as UpdateBingoSessionRequest;

    const existing = sessionStorage.getById(id);
    if (!existing) {
      const response: ApiResponse<BingoSession> = {
        data: null,
        error: 'Session not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validate calledBalls if provided
    if (body.calledBalls !== undefined) {
      if (!Array.isArray(body.calledBalls)) {
        const response: ApiResponse<BingoSession> = {
          data: null,
          error: 'calledBalls must be an array',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate winner if provided
    if (body.winner !== undefined && !isValidWinner(body.winner)) {
      const response: ApiResponse<BingoSession> = {
        data: null,
        error: 'winner must be null or an object with name (string), optional cardNumber (string), and verifiedAt (string)',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate endedAt if provided
    if (body.endedAt !== undefined && body.endedAt !== null) {
      if (typeof body.endedAt !== 'string') {
        const response: ApiResponse<BingoSession> = {
          data: null,
          error: 'endedAt must be null or an ISO date string',
        };
        return NextResponse.json(response, { status: 400 });
      }
      // Try to parse the date
      const parsed = new Date(body.endedAt);
      if (isNaN(parsed.getTime())) {
        const response: ApiResponse<BingoSession> = {
          data: null,
          error: 'endedAt must be a valid ISO date string',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const updated = sessionStorage.update(id, body);

    const response: ApiResponse<BingoSession> = {
      data: updated!,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<BingoSession> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to update session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/sessions/[id]
 * Delete a session from history
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const existing = sessionStorage.getById(id);
    if (!existing) {
      const response: ApiResponse<null> = {
        data: null,
        error: 'Session not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    sessionStorage.delete(id);

    const response: ApiResponse<{ deleted: boolean }> = {
      data: { deleted: true },
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<null> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to delete session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
