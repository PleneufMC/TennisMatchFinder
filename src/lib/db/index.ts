import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy initialization to avoid build-time errors when DATABASE_URL is not set
let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const sql = neon(databaseUrl);
  _db = drizzle(sql, { schema });
  return _db;
}

// Export a proxy that lazily initializes the database connection
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const database = getDb();
    const value = database[prop as keyof typeof database];
    if (typeof value === 'function') {
      return value.bind(database);
    }
    return value;
  },
});

// Export types
export type Database = typeof db;
