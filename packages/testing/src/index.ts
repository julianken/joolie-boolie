// Testing package - Shared test utilities and mocks
// Re-export all mocks for convenience

// Mocks - BroadcastChannel
export {
  mockBroadcastChannel,
  MockBroadcastChannel,
  resetMockBroadcastChannel,
  simulateMessage,
} from './mocks/broadcast-channel';

// Mocks - Audio
export {
  mockAudio,
  MockAudio,
  createMockAudio,
} from './mocks/audio';

// Mocks - Supabase
export {
  createMockSupabaseClient,
  createMockUser,
  createMockSession,
  mockSupabaseSsr,
  type MockUser,
  type MockSession,
  type MockAuthState,
  type MockSupabaseClient,
} from './mocks/supabase';

// Helpers
export { HELPERS_PLACEHOLDER } from './helpers/index';
