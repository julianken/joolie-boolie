import { NextRequest, NextResponse } from 'next/server';
import { gameSessionStorage } from '@/lib/api/storage';
import type {
  BingoGameSession,
  UpdateBingoGameRequest,
  ApiResponse,
} from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/games/[id]
 * Get a specific game session by ID
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const session = gameSessionStorage.getById(id);

    if (!session) {
      const response: ApiResponse<BingoGameSession> = {
        data: null,
        error: 'Game session not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<BingoGameSession> = {
      data: session,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<BingoGameSession> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch game session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/games/[id]
 * Update a game session
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json() as UpdateBingoGameRequest;

    const existing = gameSessionStorage.getById(id);
    if (!existing) {
      const response: ApiResponse<BingoGameSession> = {
        data: null,
        error: 'Game session not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        const response: ApiResponse<BingoGameSession> = {
          data: null,
          error: 'Name must be a non-empty string',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate status if provided
    if (body.status !== undefined) {
      const validStatuses = ['idle', 'playing', 'paused', 'ended'];
      if (!validStatuses.includes(body.status)) {
        const response: ApiResponse<BingoGameSession> = {
          data: null,
          error: `Status must be one of: ${validStatuses.join(', ')}`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate autoCallSpeed if provided
    if (body.autoCallSpeed !== undefined) {
      if (typeof body.autoCallSpeed !== 'number' || body.autoCallSpeed < 5 || body.autoCallSpeed > 30) {
        const response: ApiResponse<BingoGameSession> = {
          data: null,
          error: 'autoCallSpeed must be a number between 5 and 30',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const updated = gameSessionStorage.update(id, {
      ...body,
      name: body.name?.trim(),
    });

    const response: ApiResponse<BingoGameSession> = {
      data: updated!,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<BingoGameSession> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to update game session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/games/[id]
 * Delete a game session
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const existing = gameSessionStorage.getById(id);
    if (!existing) {
      const response: ApiResponse<null> = {
        data: null,
        error: 'Game session not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    gameSessionStorage.delete(id);

    const response: ApiResponse<{ deleted: boolean }> = {
      data: { deleted: true },
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<null> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to delete game session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
