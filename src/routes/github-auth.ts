import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { generateState, OAuth2RequestError } from 'arctic';
import { eq, sql } from 'drizzle-orm';

import { db } from '../db/index.ts';
import { userTable } from '../db/schema/user.ts';
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  SESSION_COOKIE_NAME,
} from '../lib/session.ts';
import github from '../lib/providers/github.ts';
import { deleteSessionTokenCookie } from '../lib/cookie.ts';
import { session as sessionMiddleware } from '../middleware/session.ts';
import type { AuthContext, GithubProfile } from '../types/index.ts';

const githubAuth = new Hono<AuthContext>()
  .get('/authorize', async (c) => {
    const state = generateState();
    const referer = c.req.header('referer');

    if (referer) {
      setCookie(c, 'referer', referer, {
        path: '/',
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      });
    }

    const url = github.createAuthorizationURL(state, {
      scopes: ['user:email', 'repo', 'read:org'],
    });

    setCookie(c, 'github_oauth_state', state, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 10, // 10 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });

    return c.redirect(url.toString());
  })
  .get('/callback', async (c) => {
    const storedState = getCookie(c, 'github_oauth_state');
    const state = c.req.query('state');
    const code = c.req.query('code');

    if (!code || !storedState || state !== storedState) {
      throw new HTTPException(400, { message: 'Invalid request' });
    }

    try {
      const githubTokens = await github.validateAuthorizationCode(code);
      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubTokens.accessToken()}`,
        },
      });

      const githubUser: GithubProfile = await githubUserResponse.json();

      if (!githubUser.email) {
        const emailsResponse = await fetch(
          'https://api.github.com/user/emails',
          {
            headers: {
              Authorization: `Bearer ${githubTokens.accessToken()}`,
            },
          }
        );
        if (emailsResponse.ok) {
          const emails: {
            email: string;
            primary: boolean;
            verified: boolean;
          }[] = await emailsResponse.json();
          const primaryEmail = emails.find((e) => e.primary && e.verified);
          if (primaryEmail) {
            githubUser.email = primaryEmail.email;
          }
        }
      }

      const [existingUser] = await db
        .select()
        .from(userTable)
        .where(sql`${userTable.data}->>'id' = ${githubUser.id.toString()}`);

      let userId: number;

      if (existingUser) {
        userId = existingUser.id;
        // User exists, update their profile data
        await db
          .update(userTable)
          .set({
            data: githubUser,
          })
          .where(eq(userTable.id, userId));
      } else {
        // User does not exist, create new user
        const [newUser] = await db
          .insert(userTable)
          .values({
            data: githubUser,
            type: 'github',
          })
          .returning();
        userId = newUser.id;
      }

      const sessionToken = generateSessionToken();
      await createSession(sessionToken, userId);

      setCookie(c, SESSION_COOKIE_NAME, sessionToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        domain: process.env.DOMAIN, // Make sure this is set in your .env
      });

      const referer = getCookie(c, 'referer');
      deleteCookie(c, 'referer'); // Clean up referer cookie
      // Redirect to the original page or a default dashboard
      return c.redirect(referer || '/');
    } catch (e) {
      console.error(e);
      if (e instanceof OAuth2RequestError) {
        return new Response(null, { status: 400 });
      }
      return new Response(null, { status: 500 });
    }
  })
  .use(sessionMiddleware)
  .get('/logout', async (c) => {
    const session = c.get('sessionData');

    // Always try to clear cookies even if there's no session
    deleteCookie(c, 'github_oauth_state', { path: '/', secure: true });
    deleteCookie(c, 'referer', { path: '/', secure: true });
    deleteSessionTokenCookie(c); // Use the helper from lib/cookie

    if (session) {
      await invalidateSession(session.id);
    }

    return c.json({ message: 'Logged out' });
  });

export default githubAuth;
