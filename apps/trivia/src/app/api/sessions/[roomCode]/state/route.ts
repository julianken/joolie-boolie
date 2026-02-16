import { createSessionRoutes } from '@joolie-boolie/database/api';
import { createClient } from '@joolie-boolie/database/server';

const routes = createSessionRoutes({
  gameType: 'trivia',
  createClient,
});

export const PATCH = routes.updateState;
