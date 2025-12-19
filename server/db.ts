import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log("[DB] Initializing database connection...");
console.log("[DB] Database URL present:", !!process.env.DATABASE_URL);
console.log("[DB] Environment:", process.env.NODE_ENV);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

// Add error handler
pool.on('error', (err) => {
  console.error('[DB] Unexpected database error:', err);
});

pool.on('connect', () => {
  console.log('[DB] Database connection established');
});

export const db = drizzle(pool, { schema });

// Verify connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('[DB] Database connection test failed:', err);
  } else {
    console.log('[DB] Database connection test successful:', res.rows[0]);
  }
});
