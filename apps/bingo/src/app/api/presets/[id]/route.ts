/**
 * Bingo Preset API Routes - Single Preset Operations
 * Handles getting, updating, and deleting individual presets
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getBingoPreset,
  updateBingoPreset,
  deleteBingoPreset,
  AUTO_CALL_INTERVAL_MIN,
  AUTO_CALL_INTERVAL_MAX,
} from '@beak-gaming/database/tables';
import { isDatabaseError } from '@beak-gaming/database/errors';
import type { BingoPresetUpdate } from '@beak-gaming/database/types';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/presets/[id]
 * Get a single preset by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // getBingoPreset throws NotFoundError if preset doesn't exist or user lacks access (via RLS)
    const preset = await getBingoPreset(supabase, id);

    return NextResponse.json({ preset });
  } catch (error) {
    console.error('Error getting bingo preset:', error);

    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/presets/[id]
 * Update an existing preset
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate auto_call_interval if provided
    if (body.auto_call_interval !== undefined) {
      const interval = body.auto_call_interval;
      if (typeof interval !== 'number' || interval < AUTO_CALL_INTERVAL_MIN || interval > AUTO_CALL_INTERVAL_MAX) {
        return NextResponse.json(
          { error: `auto_call_interval must be between ${AUTO_CALL_INTERVAL_MIN} and ${AUTO_CALL_INTERVAL_MAX}ms` },
          { status: 400 }
        );
      }
    }

    // Build update data from request body
    const updateData: BingoPresetUpdate = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.pattern_id !== undefined) updateData.pattern_id = body.pattern_id;
    if (body.voice_pack !== undefined) updateData.voice_pack = body.voice_pack;
    if (body.auto_call_enabled !== undefined) updateData.auto_call_enabled = body.auto_call_enabled;
    if (body.auto_call_interval !== undefined) updateData.auto_call_interval = body.auto_call_interval;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;

    // updateBingoPreset throws NotFoundError if preset doesn't exist or user lacks access (via RLS)
    const preset = await updateBingoPreset(supabase, id, updateData);

    return NextResponse.json({ preset });
  } catch (error) {
    console.error('Error updating bingo preset:', error);

    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/presets/[id]
 * Delete a preset
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // RLS will prevent deleting other users' presets
    await deleteBingoPreset(supabase, id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting bingo preset:', error);

    if (isDatabaseError(error)) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
