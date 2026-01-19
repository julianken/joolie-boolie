import { NextRequest, NextResponse } from 'next/server';
import { templateStorage } from '@/lib/api/storage';
import type {
  GameTemplate,
  UpdateTemplateRequest,
  ApiResponse,
} from '@/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/templates/[id]
 * Get a specific template by ID
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const template = templateStorage.getById(id);

    if (!template) {
      const response: ApiResponse<GameTemplate> = {
        data: null,
        error: 'Template not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<GameTemplate> = {
      data: template,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<GameTemplate> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to fetch template',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * PATCH /api/templates/[id]
 * Update a template
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json() as UpdateTemplateRequest;

    const existing = templateStorage.getById(id);
    if (!existing) {
      const response: ApiResponse<GameTemplate> = {
        data: null,
        error: 'Template not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        const response: ApiResponse<GameTemplate> = {
          data: null,
          error: 'Name must be a non-empty string',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate patternId if provided
    if (body.patternId !== undefined) {
      if (typeof body.patternId !== 'string' || body.patternId.trim().length === 0) {
        const response: ApiResponse<GameTemplate> = {
          data: null,
          error: 'patternId must be a non-empty string',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate autoCallSpeed if provided
    if (body.autoCallSpeed !== undefined) {
      if (typeof body.autoCallSpeed !== 'number' || body.autoCallSpeed < 5 || body.autoCallSpeed > 30) {
        const response: ApiResponse<GameTemplate> = {
          data: null,
          error: 'autoCallSpeed must be a number between 5 and 30',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate audioEnabled if provided
    if (body.audioEnabled !== undefined) {
      if (typeof body.audioEnabled !== 'boolean') {
        const response: ApiResponse<GameTemplate> = {
          data: null,
          error: 'audioEnabled must be a boolean',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate isDefault if provided
    if (body.isDefault !== undefined) {
      if (typeof body.isDefault !== 'boolean') {
        const response: ApiResponse<GameTemplate> = {
          data: null,
          error: 'isDefault must be a boolean',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const updated = templateStorage.update(id, {
      ...body,
      name: body.name?.trim(),
      patternId: body.patternId?.trim(),
    });

    const response: ApiResponse<GameTemplate> = {
      data: updated!,
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<GameTemplate> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to update template',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete a template
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const existing = templateStorage.getById(id);
    if (!existing) {
      const response: ApiResponse<null> = {
        data: null,
        error: 'Template not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Prevent deletion of system templates
    if (existing.userId === 'system') {
      const response: ApiResponse<null> = {
        data: null,
        error: 'Cannot delete system templates',
      };
      return NextResponse.json(response, { status: 403 });
    }

    templateStorage.delete(id);

    const response: ApiResponse<{ deleted: boolean }> = {
      data: { deleted: true },
      error: null,
    };

    return NextResponse.json(response);
  } catch (err) {
    const response: ApiResponse<null> = {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to delete template',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
