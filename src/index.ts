import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';

import 'dotenv/config';

import { session as sessionMiddleware } from './middleware/session.ts';
import type { AuthContext } from './types/index.ts';
import githubAuth from './routes/github-auth.ts';
import profile from './routes/profile.ts';

const app = new Hono<AuthContext>();

app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS || '').split(','),
    maxAge: 600,
    allowHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
    allowMethods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
);

app.route('/github', githubAuth);

app.use(sessionMiddleware);

app.get('/profile', profile);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
