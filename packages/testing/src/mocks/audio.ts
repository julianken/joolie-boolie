// Mock Audio for testing
// Provides a mock HTMLAudioElement for tests

class MockAudio {
  src: string = '';
  volume: number = 1;
  muted: boolean = false;
  paused: boolean = true;
  currentTime: number = 0;
  duration: number = 0;

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

  addEventListener(): void {
    // No-op
  }

  removeEventListener(): void {
    // No-op
  }
}

export function mockAudio(): void {
  // @ts-expect-error - Mocking global
  global.Audio = MockAudio;
}

export { MockAudio };
