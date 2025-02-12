import { lucia } from "lucia";
import { hono } from "lucia/middleware";
import { pg } from "@lucia-auth/adapter-postgresql";
import postgres from "pg";
import "lucia/polyfill/node";

const pool = new postgres.Pool({
  connectionString: POSTGRES_DATABASE_URL || "",
});

export const auth = lucia({
  env: "DEV", // "PROD" if deployed to HTTPS
  middleware: hono(),
  adapter: pg(pool, {
    user: "auth_user",
    key: "user_key",
    session: "user_session",
  }),
});

export type Auth = typeof auth;
