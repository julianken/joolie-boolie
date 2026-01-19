# @beak-gaming/testing

Shared test utilities and mocks for the Beak Gaming Platform.

## Installation

```json
{
  "devDependencies": {
    "@beak-gaming/testing": "workspace:*"
  },
  "peerDependencies": {
    "vitest": "^4.0.0"
  }
}
```

## Available Mocks

### BroadcastChannel Mock

Mock for the BroadcastChannel API used in dual-screen synchronization.

```typescript
import { mockBroadcastChannel, MockBroadcastChannel } from '@beak-gaming/testing/mocks';

// In your test setup
beforeEach(() => {
  mockBroadcastChannel();
});

afterEach(() => {
  MockBroadcastChannel.reset();
});

// In tests
test('syncs state between windows', () => {
  const channel1 = new BroadcastChannel('test-channel');
  const channel2 = new BroadcastChannel('test-channel');

  const received: unknown[] = [];
  channel2.onmessage = (event) => {
    received.push(event.data);
  };

  channel1.postMessage({ type: 'TEST', payload: 'hello' });

  expect(received).toContainEqual({ type: 'TEST', payload: 'hello' });
});
```

### Audio Mock

Mock for the HTML5 Audio API used in sound playback.

```typescript
import { mockAudio, MockAudio } from '@beak-gaming/testing/mocks';

// In your test setup
beforeEach(() => {
  mockAudio();
});

// In tests
test('plays audio', async () => {
  const audio = new Audio('/test.mp3');
  await audio.play();

  expect(audio.paused).toBe(false);
});
```

## Test Setup Example

Create a shared test setup file:

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { mockBroadcastChannel, MockBroadcastChannel, mockAudio } from '@beak-gaming/testing/mocks';

beforeEach(() => {
  mockBroadcastChannel();
  mockAudio();
});

afterEach(() => {
  MockBroadcastChannel.reset();
});
```

Configure in your vitest config:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

## App-Specific Test Helpers

Apps maintain their own test helpers for store resetting and app-specific utilities:

```typescript
// apps/my-game/src/test/helpers/store.ts
import { useGameStore } from '@/stores/game-store';
import { createInitialState } from '@/lib/game/engine';

export function resetGameStore(): void {
  useGameStore.setState(createInitialState());
}

export function resetAllStores(): void {
  resetGameStore();
  // Reset other stores...
}
```

## API Reference

### mockBroadcastChannel()

Sets up the global BroadcastChannel mock. Call in `beforeEach`.

### MockBroadcastChannel

The mock class itself. Provides:
- `static reset()`: Clear all channels between tests
- `name`: Channel name
- `postMessage(message)`: Broadcasts to other channels with same name
- `close()`: Removes this channel instance
- `onmessage`: Message handler

### mockAudio()

Sets up the global Audio mock. Call in `beforeEach`.

### MockAudio

The mock class itself. Provides:
- `src`: Audio source URL
- `volume`: Volume level (0-1)
- `muted`: Muted state
- `paused`: Paused state
- `currentTime`: Current playback position
- `duration`: Audio duration
- `play()`: Returns Promise<void>
- `pause()`: Pauses playback
- `load()`: No-op
- `addEventListener()`: No-op
- `removeEventListener()`: No-op

## Extending Mocks

To add app-specific mocks, create them in your app's test directory:

```typescript
// apps/my-game/src/test/mocks/my-mock.ts
import { vi } from 'vitest';

export function mockMyService() {
  vi.stubGlobal('myService', {
    fetch: vi.fn(),
    // ...
  });
}
```

Then export from a central location:

```typescript
// apps/my-game/src/test/mocks/index.ts
export * from '@beak-gaming/testing/mocks';
export { mockMyService } from './my-mock';
```

## Future Additions

Planned utilities:
- React component test helpers
- Zustand store test utilities
- Supabase mock helpers
- Common fixture generators
