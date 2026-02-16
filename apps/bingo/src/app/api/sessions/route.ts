import { createSessionRoutes } from '@joolie-boolie/database/api';
import { createClient } from '@joolie-boolie/database/server';
import { getApiUser } from '@joolie-boolie/auth';

const routes = createSessionRoutes({
  gameType: 'bingo',
  createClient,
  authenticateRequest: getApiUser,
});

export const POST = routes.POST;
