import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { SESSION_COOKIE_NAME, validateSessionToken } from '../lib/session.ts';
import { deleteSessionTokenCookie } from '../lib/cookie.ts';
import type { AuthContext } from '../types/index.ts';

const authentication: MiddlewareHandler<AuthContext> = async (c, next) => {
  try {
    const sessionId =
      getCookie(c, SESSION_COOKIE_NAME) || c.req.header('Authorization');

    if (!sessionId) {
      c.set('user', null);
      c.set('session', null);
    } else {
      const { session, user } = await validateSessionToken(sessionId);

      if (!session) {
        deleteSessionTokenCookie(c);
      }

      c.set('user', user);
      c.set('session', session);
    }

    await next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    c.set('user', null);
    c.set('session', null);
    await next(); // Proceed to the next middleware even on error
  }
};

export default authentication;
