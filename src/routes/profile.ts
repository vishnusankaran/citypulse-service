import { Hono } from 'hono';
import type { Context, Env } from 'hono';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import type { AuthContext } from '../types/index.ts';
import { db, schema } from '../db/index.ts';

const { userTable, sessionTable } = schema;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: [path.resolve(__dirname, '../../') + '/.env'] });

const profile = async (c: Context<AuthContext>) => {
  console.log('About to run profile route');
  const sessionId = c.get('sessionId') || '';

  const result = await db
    .select({ user: userTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.id, sessionId));
  console.log('result', result);

  if (result.length) {
    const { user } = result[0];

    return c.json({ data: { user } });
  } else {
    return c.json({ error: 'Unauthenticated!' }, 401);
  }
};

export default profile;
