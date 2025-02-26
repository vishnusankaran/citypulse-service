import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import * as schema from './schema.ts';

const pool = new pg.Pool({
  host: 'starter-postgres',
  database: 'postgres',
  user: 'postgres',
  password: 'db_pass',
  port: 5432,
  // connectionString: process.env.POSTGRES_DATABASE_URL || '',
});

const db = drizzle({ client: pool, schema });

export { schema, db };
