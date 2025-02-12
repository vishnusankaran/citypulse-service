import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { eq } from 'drizzle-orm';

import { db, profile } from './schema/index.ts'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get('/user/:id', async (c) => {
  const id = c.req.param('id')

  const [userProfile] = await db.select().from(profile).where(eq(profile.id, id)).execute();

  return c.json(userProfile)
})

const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})
