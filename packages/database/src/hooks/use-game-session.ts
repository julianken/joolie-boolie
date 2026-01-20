/**
 * React hooks for game session operations
 *
 * These hooks wrap the persistent session CRUD functions
 * for use in React components.
 */

import { useCallback } from 'react';
import type { TypedSupabaseClient } from '../client';
import type { GameSession, GameSessionInsert } from '../types';
import {
  getGameSessionByRoomCode,
  createGameSession,
  updateGameSessionState,
  incrementFailedPinAttempt,
  resetFailedPinAttempts,
  markSessionCompleted,
} from '../tables/persistent-sessions';
import { verifyPin, isLockedOut } from '../pin-security';
import { useParamQuery, type QueryOptions, type QueryResult } from './use-query';
import { useMutation, type MutationOptions, type MutationResult } from './use-mutation';

// =============================================================================
// Types
// =============================================================================

export interface VerifyPinVariables {
  pin: string;
}

export interface VerifyPinResult {
  success: boolean;
  session: GameSession | null;
  isLockedOut: boolean;
  remainingAttempts: number;
}

export interface UpdateGameStateVariables {
  roomCode: string;
  state: Record<string, unknown>;
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch a game session by room code
 *
 * @example
 * ```tsx
 * const { data: session, isLoading, error, refetch } = useGameSession(
 *   client,
 *   'ABC123',
 *   { enabled: !!roomCode }
 * );
 * ```
 */
export function useGameSession(
  client: TypedSupabaseClient | null,
  roomCode: string,
  options: QueryOptions<GameSession | null> = {}
): QueryResult<GameSession | null> {
  return useParamQuery(
    client,
    roomCode,
    async (c, code) => getGameSessionByRoomCode(c, code),
    {
      ...options,
      enabled: options.enabled !== false && !!roomCode,
    }
  );
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to create a new game session
 *
 * @example
 * ```tsx
 * const { mutate, mutateAsync, isLoading, error, data } = useCreateGameSession(
 *   client,
 *   {
 *     onSuccess: (session) => {
 *       console.log('Created session:', session.room_code);
 *     },
 *   }
 * );
 *
 * // Later:
 * mutate({
 *   room_code: 'ABC123',
 *   session_id: 'sess_abc123',
 *   game_type: 'bingo',
 *   pin_hash: 'hashed-pin',
 *   pin_salt: 'salt-value',
 * });
 * ```
 */
export function useCreateGameSession(
  client: TypedSupabaseClient | null,
  options: MutationOptions<GameSession, GameSessionInsert> = {}
): MutationResult<GameSession, GameSessionInsert> {
  return useMutation(client, createGameSession, options);
}

/**
 * Hook to update game session state
 *
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useUpdateGameSessionState(client);
 *
 * // Later:
 * mutate({ roomCode: 'ABC123', state: { calledBalls: [1, 2, 3] } });
 * ```
 */
export function useUpdateGameSessionState(
  client: TypedSupabaseClient | null,
  options: MutationOptions<GameSession, UpdateGameStateVariables> = {}
): MutationResult<GameSession, UpdateGameStateVariables> {
  return useMutation(
    client,
    async (c, { roomCode, state }) => updateGameSessionState(c, roomCode, state),
    options
  );
}

/**
 * Hook to mark a session as completed
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useMarkSessionCompleted(client);
 *
 * // Later:
 * mutate('ABC123'); // roomCode
 * ```
 */
export function useMarkSessionCompleted(
  client: TypedSupabaseClient | null,
  options: MutationOptions<void, string> = {}
): MutationResult<void, string> {
  return useMutation(
    client,
    async (c, roomCode) => markSessionCompleted(c, roomCode),
    options
  );
}

// =============================================================================
// PIN Verification Hook
// =============================================================================

/**
 * Hook to verify a PIN and get a session
 *
 * This hook combines PIN verification with session retrieval and handles:
 * - PIN verification using stored hash/salt
 * - Lockout checking after failed attempts
 * - Incrementing/resetting failed PIN attempt counters
 *
 * @example
 * ```tsx
 * const { verifyPinAsync, isLoading, error, data } = useVerifyPin(client, 'ABC123');
 *
 * // Later:
 * const result = await verifyPinAsync({ pin: '1234' });
 * if (result.success) {
 *   // PIN verified, use result.session
 * } else if (result.isLockedOut) {
 *   // Too many attempts, user is locked out
 * } else {
 *   // Wrong PIN, show remaining attempts
 *   console.log(`${result.remainingAttempts} attempts remaining`);
 * }
 * ```
 */
export function useVerifyPin(
  client: TypedSupabaseClient | null,
  roomCode: string,
  options: MutationOptions<VerifyPinResult, VerifyPinVariables> = {}
): MutationResult<VerifyPinResult, VerifyPinVariables> & {
  verifyPinAsync: (variables: VerifyPinVariables) => Promise<VerifyPinResult>;
} {
  const MAX_ATTEMPTS = 5;

  const verifyPinFn = useCallback(
    async (c: TypedSupabaseClient, { pin }: VerifyPinVariables): Promise<VerifyPinResult> => {
      // Get the session first
      const session = await getGameSessionByRoomCode(c, roomCode);

      if (!session) {
        return {
          success: false,
          session: null,
          isLockedOut: false,
          remainingAttempts: 0,
        };
      }

      // Check if locked out
      const lockedOut = isLockedOut(
        session.failed_pin_attempts,
        session.last_failed_attempt_at ? new Date(session.last_failed_attempt_at) : null
      );

      if (lockedOut) {
        return {
          success: false,
          session: null,
          isLockedOut: true,
          remainingAttempts: 0,
        };
      }

      // Verify the PIN
      const isValid = await verifyPin(pin, session.pin_hash, session.pin_salt);

      if (isValid) {
        // Reset failed attempts on successful verification
        await resetFailedPinAttempts(c, roomCode);
        return {
          success: true,
          session,
          isLockedOut: false,
          remainingAttempts: MAX_ATTEMPTS,
        };
      } else {
        // Increment failed attempts
        await incrementFailedPinAttempt(c, roomCode);
        const newAttempts = session.failed_pin_attempts + 1;
        const remainingAttempts = Math.max(0, MAX_ATTEMPTS - newAttempts);
        const nowLockedOut = newAttempts >= MAX_ATTEMPTS;

        return {
          success: false,
          session: null,
          isLockedOut: nowLockedOut,
          remainingAttempts,
        };
      }
    },
    [roomCode]
  );

  const mutation = useMutation(client, verifyPinFn, options);

  return {
    ...mutation,
    verifyPinAsync: mutation.mutateAsync,
  };
}
