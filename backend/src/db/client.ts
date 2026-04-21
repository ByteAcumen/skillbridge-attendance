import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../lib/env.js'
import * as schema from './schema.js'

const maxConnections = env.NODE_ENV === 'production' ? 5 : 1

export const sqlClient = postgres(env.DATABASE_URL, {
  max: maxConnections,
  prepare: false,
})

export const db = drizzle(sqlClient, { schema })
