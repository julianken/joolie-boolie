import { createSessionRoutes } from '@beak-gaming/database/api';
import { createClient } from '@/lib/supabase/server';

const routes = createSessionRoutes({
  gameType: 'bingo',
  createClient,
});

export const GET = routes.GET;
