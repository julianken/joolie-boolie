/**
 * Mock @opentelemetry/api for testing.
 *
 * Provides mock implementations of the OTel trace API.
 * Use `mockOtel._reset()` in afterEach to clear all recorded calls.
 *
 * Usage:
 *   vi.mock('@opentelemetry/api', () => mockOtel);
 */

import { type Mock, vi } from 'vitest';

export interface MockSpan {
  spanContext: Mock;
  setAttribute: Mock;
  setAttributes: Mock;
  addEvent: Mock;
  setStatus: Mock;
  updateName: Mock;
  end: Mock;
  isRecording: Mock;
  recordException: Mock;
}

function createMockSpan(): MockSpan {
  return {
    spanContext: vi.fn(() => ({
      traceId: '00000000000000000000000000000001',
      spanId: '0000000000000001',
      traceFlags: 1,
    })),
    setAttribute: vi.fn(),
    setAttributes: vi.fn(),
    addEvent: vi.fn(),
    setStatus: vi.fn(),
    updateName: vi.fn(),
    end: vi.fn(),
    isRecording: vi.fn(() => true),
    recordException: vi.fn(),
  };
}

/** Tracks all spans created during a test. */
let createdSpans: MockSpan[] = [];

export interface MockTracer {
  startSpan: Mock;
  startActiveSpan: Mock;
}

export interface MockTracerProvider {
  getTracer: Mock;
  register: Mock;
  addSpanProcessor: Mock;
  shutdown: Mock;
}

export const mockTracer: MockTracer = {
  startSpan: vi.fn((_name: string, _options?: unknown) => {
    const span = createMockSpan();
    createdSpans.push(span);
    return span;
  }),
  startActiveSpan: vi.fn(
    (_name: string, ...args: unknown[]) => {
      const span = createMockSpan();
      createdSpans.push(span);
      // The last arg is always the callback function
      const callback = args[args.length - 1] as (span: MockSpan) => unknown;
      if (typeof callback === 'function') {
        return callback(span);
      }
      return span;
    }
  ),
};

export const mockTracerProvider: MockTracerProvider = {
  getTracer: vi.fn(() => mockTracer),
  register: vi.fn(),
  addSpanProcessor: vi.fn(),
  shutdown: vi.fn().mockResolvedValue(undefined),
};

export interface MockOtel {
  trace: {
    getTracer: Mock;
    getTracerProvider: Mock;
    setGlobalTracerProvider: Mock;
    getActiveSpan: Mock;
    getSpan: Mock;
    setSpan: Mock;
    deleteSpan: Mock;
    setSpanContext: Mock;
  };
  context: {
    active: Mock;
    with: Mock;
    bind: Mock;
    setValue: Mock;
    getValue: Mock;
    deleteValue: Mock;
  };
  SpanStatusCode: {
    UNSET: 0;
    OK: 1;
    ERROR: 2;
  };
  SpanKind: {
    INTERNAL: 0;
    SERVER: 1;
    CLIENT: 2;
    PRODUCER: 3;
    CONSUMER: 4;
  };
  _mockTracer: MockTracer;
  _mockTracerProvider: MockTracerProvider;
  _getCreatedSpans(): MockSpan[];
  _reset(): void;
}

/**
 * Full mock of @opentelemetry/api.
 */
export const mockOtel: MockOtel = {
  trace: {
    getTracer: vi.fn((_name: string, _version?: string) => mockTracer),
    getTracerProvider: vi.fn(() => mockTracerProvider),
    setGlobalTracerProvider: vi.fn(),
    getActiveSpan: vi.fn(() => createdSpans[createdSpans.length - 1] ?? null),
    getSpan: vi.fn(() => createdSpans[createdSpans.length - 1] ?? null),
    setSpan: vi.fn((_context: unknown, _span: unknown) => ({})),
    deleteSpan: vi.fn((_context: unknown) => ({})),
    setSpanContext: vi.fn((_context: unknown, _spanContext: unknown) => ({})),
  },

  context: {
    active: vi.fn(() => ({})),
    with: vi.fn((_ctx: unknown, fn: () => unknown) => fn()),
    bind: vi.fn((_ctx: unknown, fn: unknown) => fn),
    setValue: vi.fn((_ctx: unknown, _key: unknown, _value: unknown) => ({})),
    getValue: vi.fn(() => undefined),
    deleteValue: vi.fn((_ctx: unknown, _key: unknown) => ({})),
  },

  // SpanStatusCode enum
  SpanStatusCode: {
    UNSET: 0,
    OK: 1,
    ERROR: 2,
  } as const,

  // SpanKind enum
  SpanKind: {
    INTERNAL: 0,
    SERVER: 1,
    CLIENT: 2,
    PRODUCER: 3,
    CONSUMER: 4,
  } as const,

  // Direct access to mock internals for assertions
  _mockTracer: mockTracer,
  _mockTracerProvider: mockTracerProvider,

  /** Get all spans created since last reset. */
  _getCreatedSpans(): MockSpan[] {
    return [...createdSpans];
  },

  /** Reset all mocks between tests. */
  _reset(): void {
    createdSpans = [];
    mockTracer.startSpan.mockClear();
    mockTracer.startActiveSpan.mockClear();
    // Re-implement after clearing
    mockTracer.startSpan.mockImplementation((_name: string, _options?: unknown) => {
      const span = createMockSpan();
      createdSpans.push(span);
      return span;
    });
    mockTracer.startActiveSpan.mockImplementation(
      (_name: string, ...args: unknown[]) => {
        const span = createMockSpan();
        createdSpans.push(span);
        const callback = args[args.length - 1] as (span: MockSpan) => unknown;
        if (typeof callback === 'function') {
          return callback(span);
        }
        return span;
      }
    );
    mockTracerProvider.getTracer.mockClear();
    mockTracerProvider.register.mockClear();
    mockTracerProvider.addSpanProcessor.mockClear();
    mockTracerProvider.shutdown.mockClear();
    mockOtel.trace.getTracer.mockClear();
    mockOtel.trace.getTracer.mockImplementation((_name: string, _version?: string) => mockTracer);
    mockOtel.trace.getTracerProvider.mockClear();
    mockOtel.trace.getActiveSpan.mockClear();
    mockOtel.trace.getSpan.mockClear();
    mockOtel.trace.setSpan.mockClear();
    mockOtel.trace.deleteSpan.mockClear();
    mockOtel.trace.setSpanContext.mockClear();
    mockOtel.trace.setGlobalTracerProvider.mockClear();
    mockOtel.context.active.mockClear();
    mockOtel.context.with.mockClear();
    mockOtel.context.bind.mockClear();
    mockOtel.context.setValue.mockClear();
    mockOtel.context.getValue.mockClear();
    mockOtel.context.deleteValue.mockClear();
  },
};
