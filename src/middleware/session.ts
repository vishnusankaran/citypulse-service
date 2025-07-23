import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';

import { sessionTable, userTable } from '../db/schema/user.ts';
import { db } from '../db/index.ts';
import { SESSION_COOKIE_NAME } from '../lib/session.ts';
import type { AuthContext } from '../types/index.ts';

export const session: MiddlewareHandler<AuthContext> = async (c, next) => {
  console.log('Session Middleware');
  // Allow OPTIONS requests (CORS preflight) to pass through without auth check
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  let sessionToken, sessionId;

  if (process.env.NODE_ENV === 'development') {
    sessionToken =
      c.req.header('Authorization') || getCookie(c, SESSION_COOKIE_NAME) || '';
  } else {
    sessionToken = getCookie(c, SESSION_COOKIE_NAME);
  }

  if (sessionToken) {
    sessionId = encodeHexLowerCase(
      sha256(new TextEncoder().encode(sessionToken))
    );
    c.set('sessionId', sessionId);
  }
  if (sessionId) {
    const result = await db
      .select()
      .from(sessionTable)
      .where(eq(sessionTable.id, sessionId));

    c.set('sessionData', result[0]);

    const userResult = await db
      .select({ user: userTable, session: sessionTable })
      .from(sessionTable)
      .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
      .where(eq(sessionTable.id, sessionId));

    if (userResult.length) {
      const { user } = userResult[0];

      c.set('user', user);
    } else {
      return c.json({ error: 'Unauthenticated!' }, 401);
    }

    console.log('await next()');
    await next();
  } else {
    return c.json({ error: 'Unauthenticated!' }, 401);
  }
};
