/**
 * Mock @sentry/nextjs for testing.
 *
 * Provides mock implementations of common Sentry functions.
 * Use `mockSentry._reset()` in afterEach to clear all recorded calls.
 *
 * Usage:
 *   vi.mock('@sentry/nextjs', () => mockSentry);
 */

import { type Mock, vi } from 'vitest';

export interface MockScope {
  setLevel: Mock;
  setTag: Mock;
  setContext: Mock;
  setUser: Mock;
  setExtra: Mock;
  setExtras: Mock;
  setTags: Mock;
  addBreadcrumb: Mock;
}

function createMockScope(): MockScope {
  return {
    setLevel: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    setUser: vi.fn(),
    setExtra: vi.fn(),
    setExtras: vi.fn(),
    setTags: vi.fn(),
    addBreadcrumb: vi.fn(),
  };
}

/** The scope instance passed to withScope callbacks. */
let lastScope: MockScope = createMockScope();

export interface MockSentryTransaction {
  finish: Mock;
  setTag: Mock;
  setData: Mock;
  startChild: Mock;
}

export interface MockSentry {
  captureException: Mock;
  captureMessage: Mock;
  captureEvent: Mock;
  setUser: Mock;
  setTag: Mock;
  setTags: Mock;
  setExtra: Mock;
  setExtras: Mock;
  setContext: Mock;
  addBreadcrumb: Mock;
  withScope: Mock;
  configureScope: Mock;
  init: Mock;
  close: Mock;
  flush: Mock;
  startTransaction: Mock;
  _getLastScope(): MockScope;
  _reset(): void;
}

/**
 * Full mock of @sentry/nextjs.
 *
 * Every exported function is a vi.fn() so you can assert on calls:
 *   expect(mockSentry.captureException).toHaveBeenCalledWith(...)
 */
export const mockSentry: MockSentry = {
  // Core capture functions
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  captureEvent: vi.fn(),

  // Context functions
  setUser: vi.fn(),
  setTag: vi.fn(),
  setTags: vi.fn(),
  setExtra: vi.fn(),
  setExtras: vi.fn(),
  setContext: vi.fn(),

  // Breadcrumbs
  addBreadcrumb: vi.fn(),

  // Scope management
  withScope: vi.fn((callback: (scope: MockScope) => void) => {
    lastScope = createMockScope();
    callback(lastScope);
  }),
  configureScope: vi.fn((callback: (scope: MockScope) => void) => {
    lastScope = createMockScope();
    callback(lastScope);
  }),

  // Initialization
  init: vi.fn(),
  close: vi.fn().mockResolvedValue(true),
  flush: vi.fn().mockResolvedValue(true),

  // Transaction / performance (minimal stubs)
  startTransaction: vi.fn(() => ({
    finish: vi.fn(),
    setTag: vi.fn(),
    setData: vi.fn(),
    startChild: vi.fn(() => ({
      finish: vi.fn(),
      setTag: vi.fn(),
      setData: vi.fn(),
    })),
  })),

  // Helper: get the most recent scope passed to withScope
  _getLastScope(): MockScope {
    return lastScope;
  },

  // Helper: reset all mocks between tests
  _reset(): void {
    mockSentry.captureException.mockClear();
    mockSentry.captureMessage.mockClear();
    mockSentry.captureEvent.mockClear();
    mockSentry.setUser.mockClear();
    mockSentry.setTag.mockClear();
    mockSentry.setTags.mockClear();
    mockSentry.setExtra.mockClear();
    mockSentry.setExtras.mockClear();
    mockSentry.setContext.mockClear();
    mockSentry.addBreadcrumb.mockClear();
    mockSentry.withScope.mockClear();
    // Re-implement withScope after clearing
    mockSentry.withScope.mockImplementation((callback: (scope: MockScope) => void) => {
      lastScope = createMockScope();
      callback(lastScope);
    });
    mockSentry.configureScope.mockClear();
    mockSentry.configureScope.mockImplementation((callback: (scope: MockScope) => void) => {
      lastScope = createMockScope();
      callback(lastScope);
    });
    mockSentry.init.mockClear();
    mockSentry.close.mockClear();
    mockSentry.flush.mockClear();
    mockSentry.startTransaction.mockClear();
    lastScope = createMockScope();
  },
};
