import { Hono } from 'hono';
import { serveStatic } from 'hono/serve-static';
import { serve } from '@hono/node-server';
import { eq } from 'drizzle-orm';

import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import 'dotenv/config';

import { db, schema } from './db/index.ts';
import authentication from './middleware/authentication.ts';
import type { AuthContext } from './types/index.ts';
import githubAuth from './routes/github-auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { userTable } = schema;

const app = new Hono<AuthContext>();

app.use('*', authentication);

app.get('/', (c) => {
  return c.redirect('/login');
});

app.get(
  '/login',
  serveStatic({
    root: './',
    getContent: async () => {
      return fs.readFileSync(
        path.join(__dirname, 'static/login.html'),
        'utf-8'
      );
    },
  })
);

app.route('/github', githubAuth);

app.get('/user/:id', async (c) => {
  const id = Number(c.req.param('id'));

  const loggedInUser = c.get('user');

  if (loggedInUser?.id === id) {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable?.id, id))
      .execute();

    return c.json(user);
  } else {
    return c.json({
      error: {
        code: 'Access Error',
        message: 'Only profile data for own user is available',
      },
    });
  }
});

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
