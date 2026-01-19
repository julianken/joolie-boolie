// Mock Audio for testing
// Provides a mock HTMLAudioElement for tests

/**
 * Mock implementation of HTMLAudioElement for testing.
 */
export class MockAudio {
  src: string = '';
  volume: number = 1;
  muted: boolean = false;
  paused: boolean = true;
  currentTime: number = 0;
  duration: number = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;

  play(): Promise<void> {
    this.paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this.paused = true;
  }

  load(): void {
    // No-op
  }

  addEventListener(_event: string, _handler: EventListener): void {
    // No-op - can be extended to track listeners if needed
  }

  removeEventListener(_event: string, _handler: EventListener): void {
    // No-op
  }
}

/**
 * Set up the global Audio mock.
 * Call in beforeEach.
 */
export function mockAudio(): void {
  // @ts-expect-error - Mocking global
  global.Audio = MockAudio;
}

/**
 * Create a mock audio instance for direct use in tests.
 * Useful when you need to track method calls.
 */
export function createMockAudio(): MockAudio {
  return new MockAudio();
}
