import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './drizzle',
  dbCredentials: {
    url: 'postgres://postgres:db_pass@localhost:5432/postgres',
  },
});
