/**
 * src/app.ts
 *
 * Hono application setup:
 *  - Security headers on every response
 *  - Request logging
 *  - CORS scoped to FRONTEND_URL
 *  - 64 KB body size limit (stops body-flood attacks)
 *  - Global error handler (catches unhandled route errors)
 *  - 404 handler
 *  - Health + root endpoints (no auth)
 *  - API routes mounted under /api/*
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { env } from './lib/env.js'
import { serverError } from './lib/errors.js'

import { attendanceRouter } from './routes/attendance.js'
import { batchesRouter } from './routes/batches.js'
import { institutionsRouter } from './routes/institutions.js'
import { meRouter } from './routes/me.js'
import { programmeRouter } from './routes/programme.js'
import { sessionsRouter } from './routes/sessions.js'

export type Role =
  | 'STUDENT'
  | 'TRAINER'
  | 'INSTITUTION'
  | 'PROGRAMME_MANAGER'
  | 'MONITORING_OFFICER'

export type AppEnv = {
  Variables: {
    user?: {
      id: string
      clerkUserId: string
      role: Role
      institutionId: string | null
    }
  }
}

export const app = new Hono<AppEnv>()

// ── Global middleware (order matters) ──────────────────────────────────────────

// Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.
app.use('*', secureHeaders())

// Request logging — prints METHOD PATH STATUS TIME to stdout
app.use('*', logger())

// CORS — only allow the configured frontend origin(s)
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL.split(',').map((o) => o.trim()),
    credentials: true,
  }),
)

// Body size limit — reject payloads larger than 64 KB
app.use(
  '*',
  bodyLimit({
    maxSize: 64 * 1024, // 64 KB
    onError: (c) => c.json({ error: 'PayloadTooLarge', message: 'Request body exceeds 64 KB' }, 413),
  }),
)

// ── Error handlers ─────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('[Unhandled Error]', err)
  return serverError(c, 'An unexpected server error occurred.')
})

app.notFound((c) => c.json({ error: 'NotFound', message: 'API route not found' }, 404))

// ── Public endpoints (no auth required) ───────────────────────────────────────

app.get('/', (c) =>
  c.json({
    name: 'SkillBridge Attendance API',
    version: '1.0.0',
    status: 'running',
    docs: 'See README.md for the full API reference',
  }),
)

app.get('/health', (c) =>
  c.json({
    ok: true,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }),
)

// ── API routes ─────────────────────────────────────────────────────────────────

app.route('/api/me', meRouter)
app.route('/api/batches', batchesRouter)
app.route('/api/sessions', sessionsRouter)
app.route('/api/attendance', attendanceRouter)
app.route('/api/programme', programmeRouter)
app.route('/api/institutions', institutionsRouter)
