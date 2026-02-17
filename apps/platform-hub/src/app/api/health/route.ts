import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.getSession();

    if (authError) {
      return NextResponse.json(
        {
          status: 'degraded',
          app: 'platform-hub',
          checks: { supabase: 'error' },
          error: authError.message,
          timestamp: new Date().toISOString(),
          version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      app: 'platform-hub',
      checks: { supabase: 'ok' },
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        app: 'platform-hub',
        checks: { supabase: 'error' },
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        version: process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown',
      },
      { status: 503 }
    );
  }
}
