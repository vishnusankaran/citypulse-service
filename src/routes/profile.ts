import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';

import type { AuthContext } from '../types/index.ts';
import { db, schema } from '../db/index.ts';
import { SESSION_COOKIE_NAME } from '../lib/session.ts';

const { userTable, sessionTable } = schema;

const profile = async (c: Context<AuthContext>) => {
  let sessionToken;

  if (process.env.NODE_ENV === 'development') {
    sessionToken = c.req.header('Authorization') || '';
  } else {
    sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  }

  console.log('sessionToken', sessionToken);

  const sessionId = encodeHexLowerCase(
    sha256(new TextEncoder().encode(sessionToken))
  );

  if (sessionId) {
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
  } else {
    return c.json({ error: 'Unauthenticated!' }, 401);
  }
};

export default profile;
