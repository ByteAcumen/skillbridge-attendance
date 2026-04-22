/**
 * src/db/client.ts
 *
 * Database client (Drizzle ORM on top of postgres-js).
 *
 * Connection limits:
 *   - Neon Serverless needs max 1 connection per-process in dev
 *   - Production can use a small pool (5) behind a load balancer
 *   - `prepare: false` is required for Neon — it doesn't support prepared statements
 *
 * initDb():
 *   - In PRODUCTION: runs pending Drizzle migrations, then verifies connectivity.
 *   - In DEVELOPMENT: skips migrations (run `npm run db:migrate` manually once),
 *     just pings the DB so hot-reload doesn't repeatedly migrate on every file save.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { join } from 'node:path'
import { env } from '../lib/env.js'
import * as schema from './schema.js'

const maxConnections = env.NODE_ENV === 'production' ? 5 : 1

export const sqlClient = postgres(env.DATABASE_URL, {
  max: maxConnections,
  prepare: false, // Required for Neon
})

export const db = drizzle(sqlClient, { schema })

/**
 * Initialises the database connection.
 *
 * Production: runs any pending Drizzle migrations then pings the DB.
 * Development: skips migrations (use `npm run db:migrate` once) and just pings.
 *
 * Must be called before the HTTP server starts.
 */
export async function initDb(): Promise<void> {
  if (env.NODE_ENV === 'production') {
    // In production, auto-migrate on every deploy so schema never drifts.
    const migrationsFolder = join(process.cwd(), 'drizzle')
    console.log('  Running database migrations...')
    await migrate(db, { migrationsFolder })
    console.log('  Migrations up to date.')
  } else {
    // In dev, migrations are run manually via `npm run db:migrate`.
    // We skip auto-migration to avoid re-running on every tsx hot-reload.
    console.log('  Skipping migrations in development (run `npm run db:migrate` to apply).')
  }

  // Always verify the connection is alive before accepting traffic.
  await sqlClient`SELECT 1`
  console.log('  Database connection verified.')
}
