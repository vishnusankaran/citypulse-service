import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

import 'dotenv/config';

import corsMiddleware from './middleware/cors.ts';
import authentication from './middleware/authentication.ts';
import authorization from './middleware/authorization.ts';
import type { AuthContext } from './types/index.ts';
import githubAuth from './routes/github-auth.ts';
import profile from './routes/profile.ts';
import { createMiddleware } from 'hono/factory';

const app = new Hono<AuthContext>();

app.use('*', (c, next) => {
  console.log('About to run cors middleware');
  return corsMiddleware(c, next);
});

app.use('*', (c, next) => {
  console.log('About to run authentication middleware');
  return authentication(c, next);
});

app.route('/github', githubAuth);

app.get('/profile', profile);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
