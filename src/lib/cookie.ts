import type { Context } from 'hono';
import { SESSION_COOKIE_NAME } from './session.ts';

export function deleteSessionTokenCookie(c: Context): void {
  c.header(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/; Secure;`,
    {
      append: true,
    }
  );
}
