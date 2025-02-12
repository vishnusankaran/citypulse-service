// Make sure to install the 'pg' package 
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, text, integer } from 'drizzle-orm/pg-core';

// You can specify any property from the node-postgres connection options
export const db = drizzle({ 
  connection: { 
    connectionString: process.env.POSTGRES_DATABASE_URL,
    ssl: true
  }
});

// This is a sample drizzle schema for your database
export const profile = pgTable('profile', {
    id: text('id').primaryKey(),
    external_id: text('external_id').notNull(),
    email: text('email').notNull().unique(),
    email_verified: integer('email_verified').notNull(),
    given_name: text('given_name').notNull(),
    family_name: text('family_name').notNull(),
    name: text('name').notNull(),
    picture: text('picture').notNull(),
  });

// Create Table the first time the app is run
  function initializeDatabase() {
    db.execute(sql`
      CREATE TABLE IF NOT EXISTS profile (
        id TEXT PRIMARY KEY,
        external_id TEXT NOT NULL,
        email TEXT NOT NULL,
        email_verified INTEGER NOT NULL,
        given_name TEXT,
        family_name TEXT,
        name TEXT,
        picture TEXT
      )
    `);
  }
  
  initializeDatabase()