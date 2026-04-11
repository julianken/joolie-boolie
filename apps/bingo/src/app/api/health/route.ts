import { NextResponse } from 'next/server';

/**
 * GET /api/health — minimal liveness check for uptime monitors.
 *
 * Used by Grafana Synthetic Monitoring probes (see docs/ALERTING_SETUP.md)
 * and by the E2E baseline health spec. Intentionally has no auth, no external
 * dependencies, and no side effects — a 200 response means the Next.js server
 * is accepting requests.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'bingo',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
