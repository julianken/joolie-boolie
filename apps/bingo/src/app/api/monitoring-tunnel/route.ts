import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_SENTRY_HOSTS = [
  'sentry.io',
  '.ingest.sentry.io',
  'ingest.us.sentry.io',
  'ingest.de.sentry.io',
];

function isAllowedHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_SENTRY_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(host)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const envelope = await request.text();
    const headerLine = envelope.split('\n')[0];
    if (!headerLine) {
      return NextResponse.json({ error: 'Invalid envelope' }, { status: 400 });
    }

    let header: { dsn?: string };
    try {
      header = JSON.parse(headerLine);
    } catch {
      return NextResponse.json({ error: 'Invalid envelope header' }, { status: 400 });
    }

    const dsn = header.dsn;
    if (!dsn) {
      return NextResponse.json({ error: 'Missing DSN' }, { status: 400 });
    }

    let dsnUrl: URL;
    try {
      dsnUrl = new URL(dsn);
    } catch {
      return NextResponse.json({ error: 'Invalid DSN format' }, { status: 400 });
    }

    const projectId = dsnUrl.pathname.replace('/', '');
    const sentryIngestUrl = `https://${dsnUrl.hostname}/api/${projectId}/envelope/`;

    if (!isAllowedHost(sentryIngestUrl)) {
      return NextResponse.json({ error: 'Invalid Sentry host' }, { status: 403 });
    }

    const response = await fetch(sentryIngestUrl, {
      method: 'POST',
      body: envelope,
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Sentry Tunnel] Error forwarding envelope:', error);
    return NextResponse.json({ error: 'Tunnel error' }, { status: 500 });
  }
}
