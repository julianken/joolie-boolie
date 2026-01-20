import { createSessionRoutes } from '@beak-gaming/database/api/session-routes';
import { createClient } from '@/lib/supabase/server';
import { serializeBingoState } from '@/lib/session/serializer';

const routes = createSessionRoutes({
  gameType: 'bingo',
  createClient,
  validateGameState: serializeBingoState,
});

export const POST = routes.verifyPin;
