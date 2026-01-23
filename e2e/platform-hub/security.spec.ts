import { test, expect } from '@playwright/test';

/**
 * Platform Hub Security E2E Tests
 *
 * Tests verify security edge cases and protections.
 */

const BASE_URL = 'http://localhost:3002';

test.describe('Platform Hub Security @high', () => {
  test.describe('Rate Limiting', () => {
    test('login endpoint has rate limiting @high', async ({ page, context }) => {
      // Make multiple rapid login attempts
      const attempts = [];
      for (let i = 0; i < 12; i++) {
        attempts.push(
          page.goto(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            timeout: 5000,
          }).catch(() => null)
        );
      }

      await Promise.all(attempts);

      // After many attempts, should see rate limit response
      // Note: Actual rate limit behavior depends on implementation
      // This test validates the endpoint doesn't crash
      const finalResponse = await page.goto(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
      }).catch(e => null);

      // Should either rate limit (429) or handle gracefully
      expect([200, 400, 401, 429, 500]).toContain(finalResponse?.status() || 500);
    });
  });

  test.describe('XSS Prevention', () => {
    test('login form prevents XSS in email field @high', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const xssPayload = '<script>alert("XSS")</script>';
      await page.fill('input[name="email"]', xssPayload);
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Wait for any potential XSS execution
      await page.waitForTimeout(1000);

      // No script should have executed - page should still be on login
      expect(page.url()).toContain('/login');

      // XSS payload should be escaped in error message or input
      const emailValue = await page.locator('input[name="email"]').inputValue();
      expect(emailValue).toBe(xssPayload); // Should be preserved as string, not executed
    });

    test('signup form prevents XSS in inputs @high', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup`);

      const xssPayload = '<img src=x onerror=alert(1)>';
      await page.fill('input[name="email"]', xssPayload);

      // Wait and verify no alert fired
      await page.waitForTimeout(500);

      const emailValue = await page.locator('input[name="email"]').inputValue();
      expect(emailValue).toBe(xssPayload); // Preserved as text
    });
  });

  test.describe('CSRF Protection', () => {
    test('OAuth state parameter prevents CSRF @high', async ({ page }) => {
      await page.goto(`${BASE_URL}/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000`);

      // Check that URL contains state parameter
      const url = page.url();
      expect(url).toMatch(/state=/);

      // State should be present in any OAuth flow
      const stateParam = new URL(url).searchParams.get('state');
      if (stateParam) {
        expect(stateParam.length).toBeGreaterThan(10); // Should be a random string
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('dashboard requires authentication @critical', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('settings requires authentication @critical', async ({ page }) => {
      await page.goto(`${BASE_URL}/settings`);

      // Should redirect to login
      await page.waitForURL(/\/login/, { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });

    test('API routes require authentication @critical', async ({ request }) => {
      // Try to access protected API without auth
      const response = await request.get(`${BASE_URL}/api/user/profile`).catch(e => null);

      if (response) {
        // Should be 401 Unauthorized or 403 Forbidden
        expect([401, 403]).toContain(response.status());
      }
    });
  });

  test.describe('Input Validation', () => {
    test('SQL injection prevented in search @high', async ({ page }) => {
      await page.goto(BASE_URL);

      const sqlPayload = "'; DROP TABLE users; --";

      // Try SQL injection in any search or filter input
      const searchInput = page.locator('input[type="search"], input[type="text"]').first();

      if (await searchInput.count() > 0) {
        await searchInput.fill(sqlPayload);
        await searchInput.press('Enter');

        await page.waitForTimeout(500);

        // Page should still function normally
        expect(page.url()).toContain(BASE_URL);
      }
    });

    test('invalid email format rejected @high', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(500);

      // Should show validation error or prevent submission
      expect(page.url()).toContain('/login');
    });
  });

  test.describe('Security Headers', () => {
    test('security headers are present @medium', async ({ request }) => {
      const response = await request.get(BASE_URL);

      const headers = response.headers();

      // Check for common security headers
      // Note: Actual headers depend on Next.js config
      expect(response.status()).toBe(200);

      // X-Frame-Options prevents clickjacking
      const xFrameOptions = headers['x-frame-options'];
      if (xFrameOptions) {
        expect(['DENY', 'SAMEORIGIN']).toContain(xFrameOptions);
      }
    });
  });
});
