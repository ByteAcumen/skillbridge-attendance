import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
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

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL.split(',').map((origin) => origin.trim()),
    credentials: true,
  }),
)

app.onError((err, c) => {
  console.error('[Unhandled Error]', err)
  return serverError(c, 'An unexpected server error occurred.')
})

app.notFound((c) => c.json({ error: 'NotFound', message: 'API route not found' }, 404))

app.get('/', (c) =>
  c.json({
    name: 'SkillBridge API',
    status: 'running',
    framework: 'Hono',
    version: '1.0.0',
  }),
)

app.get('/health', (c) =>
  c.json({
    ok: true,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }),
)

app.route('/api/me', meRouter)
app.route('/api/batches', batchesRouter)
app.route('/api/sessions', sessionsRouter)
app.route('/api/attendance', attendanceRouter)
app.route('/api/programme', programmeRouter)
app.route('/api/institutions', institutionsRouter)
