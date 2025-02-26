import type { Env } from 'hono';
import type { Session, User } from '../db/schema.ts';

export interface GithubProfile {
  name: string;
  id: number;
  email: string;
  avatar_url: string;
  login: string;
}

export interface AuthContext extends Env {
  Variables: {
    user: User | null;
    session: Session | null;
  };
}
