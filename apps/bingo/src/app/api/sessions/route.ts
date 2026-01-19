import { NextRequest, NextResponse } from 'next/server';
import { sessionStorage, generateId } from '@/lib/api/storage';
import type {
  BingoSession,
  CreateBingoSessionRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

/**
 * GET /api/sessions
 * List all session history records with optional pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const allSessions = sessionStorage.getAll();
    const total = allSessions.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedSessions = allSessions.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<BingoSession> = {
      data: paginatedSessions,
      total,
      page,
      pageSize,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: PaginatedResponse<BingoSession> = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: err instanceof Error ? err.message : 'Failed to fetch sessions',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/sessions
 * Create a new session history record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateBingoSessionRequest;

    // Validate required fields
    if (!body.patternId || typeof body.patternId !== 'string' || body.patternId.trim().length === 0) {
      const response: ApiResponse<BingoSession> = {
        data: null,
        error: 'patternId is required and must be a non-empty string',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!body.patternName || typeof body.patternName !== 'string' || body.patternName.trim().length === 0) {
      const response: ApiResponse<BingoSession> = {
        data: null,
        error: 'patternName is required and must be a non-empty string',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const now = new Date().toISOString();
    const newSession: BingoSession = {
      id: generateId(),
      userId: body.userId?.trim() || null,
      patternId: body.patternId.trim(),
      patternName: body.patternName.trim(),
      calledBalls: [],
      totalBallsCalled: 0,
      winner: null,
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const created = sessionStorage.create(newSession);

    const response: ApiResponse<BingoSession> = {
      data: created,
      error: null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const response: ApiResponse<BingoSession> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to create session',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
