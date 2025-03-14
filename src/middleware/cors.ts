import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';

console.log('ALLOWED_ORIGINS', (process.env.ALLOWED_ORIGINS || '')?.split(','));

const corsMiddleware = createMiddleware(async (c, next) => {
  const middleware = cors({
    origin: (process.env.ALLOWED_ORIGINS || '')?.split(','),
    maxAge: 600,
    credentials: true,
  });

  return middleware(c, next);
});

export default corsMiddleware;
