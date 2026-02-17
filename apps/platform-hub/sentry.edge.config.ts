import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isE2E = process.env.NEXT_PUBLIC_E2E_TESTING === 'true';

if (dsn && !isE2E) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.1,
    skipOpenTelemetrySetup: true,
    enabled: true,
    initialScope: {
      tags: { app: 'platform-hub' },
    },
  });
}
