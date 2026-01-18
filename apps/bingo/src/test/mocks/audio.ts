import { vi } from 'vitest';

export interface MockAudioElement {
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  src: string;
  volume: number;
  currentTime: number;
  onended: (() => void) | null;
  onerror: (() => void) | null;
}

export function createMockAudio(): MockAudioElement {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    src: '',
    volume: 1,
    currentTime: 0,
    onended: null,
    onerror: null,
  };
}

export function mockAudioGlobal(): MockAudioElement {
  const mockAudio = createMockAudio();
  vi.stubGlobal('Audio', vi.fn(() => mockAudio));
  return mockAudio;
}

export function restoreAudioGlobal(): void {
  vi.unstubAllGlobals();
}
