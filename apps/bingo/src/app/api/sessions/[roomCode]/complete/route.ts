import { createSessionRoutes } from '@joolie-boolie/database/api';
import { createClient } from '@joolie-boolie/database/server';

const routes = createSessionRoutes({
  gameType: 'bingo',
  createClient,
});

export const POST = routes.complete;
