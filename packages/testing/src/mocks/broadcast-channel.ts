// Mock BroadcastChannel for testing
// Extracted from apps/bingo/src/test/mocks/broadcast-channel.ts

type MessageHandler = (event: MessageEvent) => void;

class MockBroadcastChannel {
  name: string;
  onmessage: MessageHandler | null = null;
  private static channels: Map<string, Set<MockBroadcastChannel>> = new Map();

  constructor(name: string) {
    this.name = name;
    const channels = MockBroadcastChannel.channels.get(name) || new Set();
    channels.add(this);
    MockBroadcastChannel.channels.set(name, channels);
  }

  postMessage(message: unknown): void {
    const channels = MockBroadcastChannel.channels.get(this.name);
    if (!channels) return;

    channels.forEach((channel) => {
      if (channel !== this && channel.onmessage) {
        const event = new MessageEvent('message', { data: message });
        channel.onmessage(event);
      }
    });
  }

  close(): void {
    const channels = MockBroadcastChannel.channels.get(this.name);
    if (channels) {
      channels.delete(this);
      if (channels.size === 0) {
        MockBroadcastChannel.channels.delete(this.name);
      }
    }
  }

  static reset(): void {
    MockBroadcastChannel.channels.clear();
  }
}

export function mockBroadcastChannel(): void {
  // @ts-expect-error - Mocking global
  global.BroadcastChannel = MockBroadcastChannel;
}

export { MockBroadcastChannel };
