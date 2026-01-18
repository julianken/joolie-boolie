import { vi } from 'vitest';

type MessageHandler = (event: MessageEvent) => void;

interface MockBroadcastChannelInstance {
  name: string;
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  onmessage: MessageHandler | null;
  onmessageerror: MessageHandler | null;
}

// Store all created channels by name for cross-channel communication
const channels: Map<string, Set<MockBroadcastChannelInstance>> = new Map();

export function createMockBroadcastChannel() {
  class MockBroadcastChannel implements MockBroadcastChannelInstance {
    name: string;
    postMessage: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onmessage: MessageHandler | null = null;
    onmessageerror: MessageHandler | null = null;

    constructor(name: string) {
      this.name = name;
      this.postMessage = vi.fn((message: unknown) => {
        // Broadcast to all other channels with the same name
        const channelSet = channels.get(name);
        if (channelSet) {
          for (const channel of channelSet) {
            if (channel !== this && channel.onmessage) {
              // Simulate async message delivery
              setTimeout(() => {
                channel.onmessage?.({ data: message } as MessageEvent);
              }, 0);
            }
          }
        }
      });
      this.close = vi.fn(() => {
        const channelSet = channels.get(name);
        if (channelSet) {
          channelSet.delete(this);
          if (channelSet.size === 0) {
            channels.delete(name);
          }
        }
      });

      // Register this channel
      if (!channels.has(name)) {
        channels.set(name, new Set());
      }
      channels.get(name)!.add(this);
    }
  }

  return MockBroadcastChannel;
}

export function mockBroadcastChannelGlobal(): void {
  const MockBroadcastChannel = createMockBroadcastChannel();
  vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
}

export function resetMockBroadcastChannel(): void {
  channels.clear();
}

export function restoreBroadcastChannelGlobal(): void {
  channels.clear();
  vi.unstubAllGlobals();
}

// Helper to simulate receiving a message on all channels with a given name
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
