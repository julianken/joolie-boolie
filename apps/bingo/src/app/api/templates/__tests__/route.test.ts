import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { templateStorage } from '@/lib/api/storage';
import { NextRequest } from 'next/server';

// Helper to create mock NextRequest
function createRequest(options: {
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL('http://localhost:3000/api/templates');
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return new NextRequest(url, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

describe('GET /api/templates', () => {
  beforeEach(() => {
    templateStorage.clear();
  });

  it('returns default templates', async () => {
    const response = await GET(createRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.error).toBeNull();
  });

  it('includes system templates', async () => {
    const response = await GET(createRequest());
    const data = await response.json();

    const systemTemplates = data.data.filter(
      (t: { userId: string }) => t.userId === 'system'
    );
    expect(systemTemplates.length).toBeGreaterThan(0);
  });

  it('respects pagination parameters', async () => {
    const response = await GET(createRequest({
      searchParams: { page: '1', pageSize: '2' },
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.length).toBeLessThanOrEqual(2);
    expect(data.page).toBe(1);
    expect(data.pageSize).toBe(2);
  });
});

describe('POST /api/templates', () => {
  beforeEach(() => {
    templateStorage.clear();
  });

  it('creates a new template with valid data', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: 'My Template',
        patternId: 'horizontal-line',
        autoCallSpeed: 10,
        audioEnabled: true,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toBeDefined();
    expect(data.data.name).toBe('My Template');
    expect(data.data.patternId).toBe('horizontal-line');
    expect(data.data.autoCallSpeed).toBe(10);
    expect(data.data.audioEnabled).toBe(true);
    expect(data.data.isDefault).toBe(false);
    expect(data.error).toBeNull();
  });

  it('creates a template as default', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: 'Default Template',
        patternId: 'blackout',
        autoCallSpeed: 15,
        audioEnabled: false,
        isDefault: true,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.isDefault).toBe(true);
  });

  it('returns 400 when name is missing', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        patternId: 'pattern-1',
        autoCallSpeed: 10,
        audioEnabled: true,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name is required and must be a non-empty string');
  });

  it('returns 400 when patternId is missing', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: 'Test Template',
        autoCallSpeed: 10,
        audioEnabled: true,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('patternId is required and must be a non-empty string');
  });

  it('returns 400 when autoCallSpeed is missing', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: 'Test Template',
        patternId: 'pattern-1',
        audioEnabled: true,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('autoCallSpeed is required and must be a number between 5 and 30');
  });

  it('returns 400 when autoCallSpeed is out of range', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: 'Test Template',
        patternId: 'pattern-1',
        autoCallSpeed: 50,
        audioEnabled: true,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('autoCallSpeed is required and must be a number between 5 and 30');
  });

  it('returns 400 when audioEnabled is missing', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: 'Test Template',
        patternId: 'pattern-1',
        autoCallSpeed: 10,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('audioEnabled is required and must be a boolean');
  });

  it('trims whitespace from name and patternId', async () => {
    const response = await POST(createRequest({
      method: 'POST',
      body: {
        name: '  Trimmed Name  ',
        patternId: '  pattern-1  ',
        autoCallSpeed: 10,
        audioEnabled: true,
      },
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe('Trimmed Name');
    expect(data.data.patternId).toBe('pattern-1');
  });
});
