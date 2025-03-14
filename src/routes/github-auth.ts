import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { generateState, OAuth2RequestError } from 'arctic';
import { eq } from 'drizzle-orm';

import { db } from '../db/index.ts';
import { userTable } from '../db/schema.ts';
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  SESSION_COOKIE_NAME,
} from '../lib/session.ts';
import github from '../lib/providers/github.ts';
import { deleteSessionTokenCookie } from '../lib/cookie.ts';
import type { AuthContext, GithubProfile } from '../types/index.ts';

const githubAuth = new Hono<AuthContext>()
  .get('/authorize', async (c) => {
    const state = generateState();

    setCookie(c, 'referer', c.req.header('referer') || '', {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10,
      secure: true,
      sameSite: 'lax',
    });

    const scopes = ['user:email'];
    const url = github.createAuthorizationURL(state, scopes);
    setCookie(c, 'github_oauth_state', state, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10,
      secure: true,
      sameSite: 'lax',
    });

    return c.redirect(url.toString());
  })
  .get('/callback', async (c) => {
    const storedState = getCookie(c, 'github_oauth_state');
    const state = c.req.query('state');
    const code = c.req.query('code') as string;
    console.log('github_oauth_state', state, storedState);
    // validate state
    if (code === null || storedState === null || state !== storedState) {
      console.log('github_oauth_state', state, storedState);
      throw new HTTPException(400, { message: 'Invalid request' });
    }
    try {
      const tokens = await github.validateAuthorizationCode(code);

      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      });

      const githubUser: GithubProfile = await githubUserResponse.json();

      c.set('profile', githubUser);

      const [existingUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, Number(githubUser.id)));

      console.log('Existing User', existingUser);
      const referer = getCookie(c, 'referer');
      let redirectUrl = referer;
      let sessionToken;

      if (existingUser) {
        sessionToken = generateSessionToken();
        console.log('token at existingUser', sessionToken);
        await createSession(sessionToken, existingUser.id);

        console.log('process.env.NODE_ENV', process.env.NODE_ENV);
      } else {
        const [user] = await db
          .insert(userTable)
          .values({
            id: githubUser.id.toString(),
            data: githubUser,
            type: 'github',
          })
          .returning();

        sessionToken = generateSessionToken();
        await createSession(sessionToken, user.id);
      }

      setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
        path: '/',
        httpOnly: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10,
        secure: true,
        sameSite: 'None',
        domain: 'project.localhost',
      });

      return c.redirect(redirectUrl || '');
    } catch (e) {
      console.log(e);
      if (e instanceof OAuth2RequestError) {
        return c.body(null, { status: 400 });
      }
      return c.body(null, { status: 500 });
    }
  })
  .get('/logout', async (c) => {
    const session = c.get('session');

    deleteCookie(c, 'github_oauth_state', {
      path: '/',
      secure: true,
    });

    deleteCookie(c, 'referer', {
      path: '/',
      secure: true,
    });

    deleteCookie(c, SESSION_COOKIE_NAME, {
      path: '/',
      secure: true,
      domain: 'project.localhost',
    });

    if (!session) return c.newResponse('unauthorized', 401);

    await invalidateSession(session.id);

    return c.json({ data: {} });
  });

export default githubAuth;
