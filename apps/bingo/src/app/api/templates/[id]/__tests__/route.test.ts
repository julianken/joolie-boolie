import { describe, it, expect, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '../route';
import { templateStorage } from '@/lib/api/storage';
import { NextRequest } from 'next/server';

// Helper to create mock NextRequest
function createRequest(options: {
  method?: string;
  body?: unknown;
} = {}) {
  return new NextRequest('http://localhost:3000/api/templates/test-id', {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });
}

// Helper to create route context
function createContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/templates/[id]', () => {
  beforeEach(() => {
    templateStorage.clear();
  });

  it('returns template when found', async () => {
    const response = await GET(createRequest(), createContext('default-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.id).toBe('default-1');
    expect(data.data.name).toBe('Standard Bingo');
    expect(data.error).toBeNull();
  });

  it('returns 404 when template not found', async () => {
    const response = await GET(createRequest(), createContext('nonexistent'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Template not found');
    expect(data.data).toBeNull();
  });
});

describe('PATCH /api/templates/[id]', () => {
  beforeEach(() => {
    templateStorage.clear();
    const now = new Date().toISOString();
    templateStorage.create({
      id: 'template-123',
      userId: 'user-1',
      name: 'Original Name',
      patternId: 'pattern-1',
      autoCallSpeed: 10,
      audioEnabled: true,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('updates template name', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { name: 'Updated Name' } }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe('Updated Name');
    expect(data.error).toBeNull();
  });

  it('updates template patternId', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { patternId: 'blackout' } }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.patternId).toBe('blackout');
  });

  it('updates multiple fields', async () => {
    const response = await PATCH(
      createRequest({
        method: 'PATCH',
        body: {
          name: 'New Name',
          patternId: 'four-corners',
          autoCallSpeed: 20,
          audioEnabled: false,
          isDefault: true,
        },
      }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.name).toBe('New Name');
    expect(data.data.patternId).toBe('four-corners');
    expect(data.data.autoCallSpeed).toBe(20);
    expect(data.data.audioEnabled).toBe(false);
    expect(data.data.isDefault).toBe(true);
  });

  it('returns 404 when template not found', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { name: 'Test' } }),
      createContext('nonexistent')
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Template not found');
  });

  it('returns 400 for empty name', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { name: '' } }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name must be a non-empty string');
  });

  it('returns 400 for empty patternId', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { patternId: '  ' } }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('patternId must be a non-empty string');
  });

  it('returns 400 for invalid autoCallSpeed', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { autoCallSpeed: 2 } }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('autoCallSpeed must be a number between 5 and 30');
  });

  it('returns 400 for invalid audioEnabled', async () => {
    const response = await PATCH(
      createRequest({ method: 'PATCH', body: { audioEnabled: 'yes' } }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('audioEnabled must be a boolean');
  });
});

describe('DELETE /api/templates/[id]', () => {
  beforeEach(() => {
    templateStorage.clear();
    const now = new Date().toISOString();
    templateStorage.create({
      id: 'template-123',
      userId: 'user-1',
      name: 'To Be Deleted',
      patternId: 'pattern-1',
      autoCallSpeed: 10,
      audioEnabled: true,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('deletes existing user template', async () => {
    const response = await DELETE(
      createRequest({ method: 'DELETE' }),
      createContext('template-123')
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.deleted).toBe(true);
    expect(data.error).toBeNull();

    // Verify template is deleted
    expect(templateStorage.getById('template-123')).toBeUndefined();
  });

  it('returns 404 when template not found', async () => {
    const response = await DELETE(
      createRequest({ method: 'DELETE' }),
      createContext('nonexistent')
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Template not found');
  });

  it('returns 403 when trying to delete system template', async () => {
    const response = await DELETE(
      createRequest({ method: 'DELETE' }),
      createContext('default-1')
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Cannot delete system templates');
  });
});
