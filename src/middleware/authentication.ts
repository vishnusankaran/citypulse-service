import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import {
  generateSessionToken,
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from '../lib/session.ts';
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from '../lib/cookie.ts';
import type { AuthContext } from '../types/index.ts';

const authentication = createMiddleware<AuthContext>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME) ?? null;
  console.log('middleware running');
  console.log(sessionId);
  if (!sessionId) {
    c.set('user', null);
    c.set('session', null);
    return next();
  }

  const { session, user } = await validateSessionToken(sessionId);
  // if (session && !c.req.path.startsWith("/auth")) {
  //   const token = generateSessionToken();
  //   setSessionTokenCookie(c, token, session.expiresAt);
  // }

  if (!session) {
    deleteSessionTokenCookie(c);
  }

  c.set('user', user);
  c.set('session', session);
  return next();
});

export default authentication;
