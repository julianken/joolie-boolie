import { test, expect } from '@playwright/test';

test.describe('Platform Hub Health Endpoint', () => {
  test('GET /api/health returns 200 with status ok', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('GET /api/health returns a timestamp', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).toBeGreaterThan(0);
  });
});
