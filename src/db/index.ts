import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema.ts';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_DATABASE_URL || '',
});

const db = drizzle({ client: pool, schema });

export { schema, db };
