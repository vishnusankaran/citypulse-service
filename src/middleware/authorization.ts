import type { MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

import { SESSION_COOKIE_NAME } from '../lib/session.ts';
import type { AuthContext } from '../types/index.ts';

const authorization: MiddlewareHandler<AuthContext> = async (c, next) => {
  try {
    const user = c.get('user');
    const session = c.get('session');

    console.log('authorization test', getCookie(c, SESSION_COOKIE_NAME));

    if (!session) {
      c.status(401);
      c.header('Content-Type', 'application/json');

      return c.json({
        error: {
          message: 'Unauthenticated!',
        },
      });
    } else if (user?.id) {
      return next();
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);

    c.status(401);
    c.header('Content-Type', 'application/json');

    return c.json({
      error: {
        message: 'Unauthenticated!',
      },
    });
  }
};

export default authorization;
