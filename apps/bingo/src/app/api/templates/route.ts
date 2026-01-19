import { NextRequest, NextResponse } from 'next/server';
import { templateStorage, generateId } from '@/lib/api/storage';
import type {
  GameTemplate,
  CreateTemplateRequest,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

/**
 * GET /api/templates
 * List all game templates with optional pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));

    const allTemplates = templateStorage.getAll();
    const total = allTemplates.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedTemplates = allTemplates.slice(startIndex, startIndex + pageSize);

    const response: PaginatedResponse<GameTemplate> = {
      data: paginatedTemplates,
      total,
      page,
      pageSize,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: PaginatedResponse<GameTemplate> = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      error: err instanceof Error ? err.message : 'Failed to fetch templates',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST /api/templates
 * Create a new game template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateTemplateRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      const response: ApiResponse<GameTemplate> = {
        data: null,
        error: 'Name is required and must be a non-empty string',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!body.patternId || typeof body.patternId !== 'string' || body.patternId.trim().length === 0) {
      const response: ApiResponse<GameTemplate> = {
        data: null,
        error: 'patternId is required and must be a non-empty string',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate autoCallSpeed
    if (typeof body.autoCallSpeed !== 'number' || body.autoCallSpeed < 5 || body.autoCallSpeed > 30) {
      const response: ApiResponse<GameTemplate> = {
        data: null,
        error: 'autoCallSpeed is required and must be a number between 5 and 30',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate audioEnabled
    if (typeof body.audioEnabled !== 'boolean') {
      const response: ApiResponse<GameTemplate> = {
        data: null,
        error: 'audioEnabled is required and must be a boolean',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const now = new Date().toISOString();
    const newTemplate: GameTemplate = {
      id: generateId(),
      userId: 'anonymous', // Will be replaced with actual user ID when auth is integrated
      name: body.name.trim(),
      patternId: body.patternId.trim(),
      autoCallSpeed: body.autoCallSpeed,
      audioEnabled: body.audioEnabled,
      isDefault: body.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const created = templateStorage.create(newTemplate);

    const response: ApiResponse<GameTemplate> = {
      data: created,
      error: null,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const response: ApiResponse<GameTemplate> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to create template',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
