import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { generateState, OAuth2RequestError } from 'arctic';
import { eq } from 'drizzle-orm';

import { db } from '../db/index.ts';
import { userTable } from '../db/schema.ts';
import {
  createSession,
  generateSessionToken,
  invalidateSession,
} from '../lib/session.ts';
import github from '../lib/providers/github.ts';
import {
  deleteSessionTokenCookie,
  setSessionTokenCookie,
} from '../lib/cookie.ts';
import type { AuthContext, GithubProfile } from '../types/index.ts';

const githubAuth = new Hono<AuthContext>()
  .get('/authorize', async (c) => {
    const state = generateState();

    const scopes = ['user:email'];
    const url = github.createAuthorizationURL(state, scopes);
    setCookie(c, 'github_oauth_state', state, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10,
      secure: process.env.NODE_ENV === 'production',
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

      console.log('Github User', githubUser);

      const [existingUser] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, Number(githubUser.id)));

      console.log('Existing User', existingUser);

      if (existingUser) {
        const sessionToken = generateSessionToken();
        console.log('token at existingUser', sessionToken);
        const session = await createSession(sessionToken, existingUser.id);
        setSessionTokenCookie(c, sessionToken, session.expiresAt);

        return c.redirect('/');
      } else {
        const [user] = await db
          .insert(userTable)
          .values({
            id: githubUser.id.toString(),
            name: githubUser.name,
          })
          .returning();

        const sessionToken = generateSessionToken();
        console.log('token at !existingUser', sessionToken);
        const session = await createSession(sessionToken, user.id);
        setSessionTokenCookie(c, sessionToken, session.expiresAt);
      }

      return c.redirect('/');
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
    if (!session) return c.newResponse('unauthorized', 401);

    await invalidateSession(session.id);
    deleteSessionTokenCookie(c);

    return c.redirect('/');
  });

export default githubAuth;
