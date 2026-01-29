/**
 * Bingo Preset API Routes
 * Handles listing and creating bingo presets
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listAllBingoPresets,
  createBingoPreset,
  AUTO_CALL_INTERVAL_MIN,
  AUTO_CALL_INTERVAL_MAX,
} from '@beak-gaming/database/tables';
import { isDatabaseError } from '@beak-gaming/database/errors';
import type { BingoPresetInsert } from '@beak-gaming/database/types';

/**
 * GET /api/presets
 * List all presets for the authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const presets = await listAllBingoPresets(supabase, user.id);

    return NextResponse.json({ presets });
  } catch (error) {
    console.error('Error listing bingo presets:', error);

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
 * POST /api/presets
 * Create a new preset for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!body.pattern_id || typeof body.pattern_id !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: pattern_id' },
        { status: 400 }
      );
    }

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

    // Create preset data
    const presetData: BingoPresetInsert = {
      user_id: user.id,
      name: body.name,
      pattern_id: body.pattern_id,
      voice_pack: body.voice_pack || 'classic',
      auto_call_enabled: body.auto_call_enabled ?? false,
      auto_call_interval: body.auto_call_interval ?? 5000,
      is_default: body.is_default ?? false,
    };

    const preset = await createBingoPreset(supabase, presetData);

    return NextResponse.json({ preset }, { status: 201 });
  } catch (error) {
    console.error('Error creating bingo preset:', error);

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
