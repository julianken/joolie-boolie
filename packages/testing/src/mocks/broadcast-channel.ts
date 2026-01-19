// Mock BroadcastChannel for testing
// Used for dual-screen synchronization tests

type MessageHandler = (event: MessageEvent) => void;

// Store all created channels by name for cross-channel communication
const channels: Map<string, Set<MockBroadcastChannel>> = new Map();

/**
 * Mock implementation of BroadcastChannel for testing.
 * Supports cross-channel communication within tests.
 */
export class MockBroadcastChannel {
  name: string;
  onmessage: MessageHandler | null = null;
  onmessageerror: MessageHandler | null = null;

  constructor(name: string) {
    this.name = name;

    // Register this channel
    if (!channels.has(name)) {
      channels.set(name, new Set());
    }
    channels.get(name)!.add(this);
  }

  postMessage(message: unknown): void {
    const channelSet = channels.get(this.name);
    if (!channelSet) return;

    // Broadcast to all other channels with the same name
    // Note: Delivers synchronously in tests for deterministic behavior.
    // Real BroadcastChannel is async, but sync delivery simplifies testing.
    for (const channel of channelSet) {
      if (channel !== this && channel.onmessage) {
        channel.onmessage({ data: message } as MessageEvent);
      }
    }
  }

  close(): void {
    const channelSet = channels.get(this.name);
    if (channelSet) {
      channelSet.delete(this);
      if (channelSet.size === 0) {
        channels.delete(this.name);
      }
    }
  }

  /**
   * Reset all channels. Call in afterEach to clean up between tests.
   */
  static reset(): void {
    channels.clear();
  }
}

/**
 * Set up the global BroadcastChannel mock.
 * Call in beforeEach.
 */
export function mockBroadcastChannel(): void {
  // @ts-expect-error - Mocking global
  global.BroadcastChannel = MockBroadcastChannel;
}

/**
 * Reset all mock channels. Call in afterEach.
 */
export function resetMockBroadcastChannel(): void {
  channels.clear();
}

/**
 * Helper to simulate receiving a message on all channels with a given name.
 * Useful for testing audience window behavior.
 */
export function simulateMessage(channelName: string, data: unknown): void {
  const channelSet = channels.get(channelName);
  if (channelSet) {
    for (const channel of channelSet) {
      if (channel.onmessage) {
        channel.onmessage({ data } as MessageEvent);
      }
    }
  }
}
