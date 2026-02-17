import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isE2E = process.env.NEXT_PUBLIC_E2E_TESTING === 'true';

if (dsn && !isE2E) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? 'development',
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: true,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    initialScope: {
      tags: { app: 'trivia' },
    },
    tunnel: '/api/monitoring-tunnel',
  });
}
