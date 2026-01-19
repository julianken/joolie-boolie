import { NextRequest, NextResponse } from 'next/server';
import { gameSessionStorage, generateId } from '@/lib/api/storage';
import type {
  BingoGameSession,
  CreateBingoGameRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

/**
 * GET /api/games
 * List all game sessions with optional pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const allSessions = gameSessionStorage.getAll();
    const total = allSessions.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedSessions = allSessions.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<BingoGameSession> = {
      data: paginatedSessions,
      total,
      page,
      pageSize,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: PaginatedResponse<BingoGameSession> = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: err instanceof Error ? err.message : 'Failed to fetch game sessions',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/games
 * Create a new game session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateBingoGameRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      const response: ApiResponse<BingoGameSession> = {
        data: null,
        error: 'Name is required and must be a non-empty string',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate optional fields
    if (body.autoCallSpeed !== undefined) {
      if (typeof body.autoCallSpeed !== 'number' || body.autoCallSpeed < 5 || body.autoCallSpeed > 30) {
        const response: ApiResponse<BingoGameSession> = {
          data: null,
          error: 'autoCallSpeed must be a number between 5 and 30',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const now = new Date().toISOString();
    const newSession: BingoGameSession = {
      id: generateId(),
      name: body.name.trim(),
      status: 'idle',
      patternId: body.patternId || null,
      calledBalls: [],
      currentBall: null,
      autoCallEnabled: false,
      autoCallSpeed: body.autoCallSpeed ?? 10,
      audioEnabled: body.audioEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const created = gameSessionStorage.create(newSession);

    const response: ApiResponse<BingoGameSession> = {
      data: created,
      error: null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const response: ApiResponse<BingoGameSession> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to create game session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
