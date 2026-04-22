/**
 * src/routes/sessions.ts
 *
 * Routes:
 *   GET  /api/sessions          — TRAINER lists all sessions for their batches
 *   GET  /api/sessions/active   — STUDENT sees sessions active right now
 *   POST /api/sessions          — TRAINER creates a new session
 *   GET  /api/sessions/:id      — TRAINER gets a single session's details
 *   GET  /api/sessions/:id/attendance — TRAINER sees full attendance for a session
 */
import { Hono } from 'hono'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { batchTrainers, sessions } from '../db/schema.js'
import { env } from '../lib/env.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { badRequest, forbidden } from '../lib/errors.js'
import { getProgrammeDateTime } from '../lib/time.js'
import type { AppEnv } from '../app.js'

export const sessionsRouter = new Hono<AppEnv>()

sessionsRouter.use('*', requireAuth)

// ── Schema ──────────────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const SessionSchema = z
  .object({
    batchId: z.string().min(1, 'batchId is required'),
    title: z.string().min(1, 'title is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    startTime: z.string().regex(timeRegex, 'startTime must be HH:MM (24-hour)'),
    endTime: z.string().regex(timeRegex, 'endTime must be HH:MM (24-hour)'),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: 'startTime must be before endTime',
    path: ['endTime'],
  })

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/sessions
 * TRAINER sees all sessions across all their batches, newest first.
 */
sessionsRouter.get('/', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!

  // Collect all batchIds this trainer manages
  const trainerBatches = await db.query.batchTrainers.findMany({
    where: eq(batchTrainers.trainerId, user.id),
  })

  if (trainerBatches.length === 0) {
    return c.json({ sessions: [] })
  }

  const batchIds = trainerBatches.map((b) => b.batchId)
  const result = await db.query.sessions.findMany({
    where: inArray(sessions.batchId, batchIds),
    orderBy: [desc(sessions.date), desc(sessions.startTime)],
    with: { batch: { columns: { id: true, name: true } } },
  })

  return c.json({ sessions: result })
})

/**
 * GET /api/sessions/active
 * STUDENT sees sessions that are active right now (today, within start–end time).
 * Note: this route MUST be defined before /:id to avoid "active" being treated as an ID.
 */
sessionsRouter.get('/active', requireRole('STUDENT'), async (c) => {
  const user = c.get('user')!
  const current = getProgrammeDateTime(env.PROGRAMME_TIME_ZONE)

  const activeSessions = await db.execute(sql`
    SELECT
      sessions.id,
      sessions.title,
      sessions.date,
      sessions.start_time,
      sessions.end_time,
      sessions.batch_id,
      batches.name AS batch_name
    FROM sessions
    JOIN batches        ON batches.id = sessions.batch_id
    JOIN batch_students ON batch_students.batch_id = sessions.batch_id
    WHERE batch_students.student_id = ${user.id}
      AND sessions.date        = ${current.date}
      AND sessions.start_time <= ${current.time}
      AND sessions.end_time   >= ${current.time}
    ORDER BY sessions.start_time ASC
  `)

  return c.json({ sessions: activeSessions })
})

/**
 * POST /api/sessions
 * TRAINER creates a new session for one of their batches.
 */
sessionsRouter.post('/', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!

  const body = await c.req.json().catch(() => ({}))
  const parsed = SessionSchema.safeParse(body)
  if (!parsed.success) return badRequest(c, parsed.error.issues[0].message)

  const { batchId, title, date, startTime, endTime } = parsed.data

  // Verify the trainer manages this batch
  const link = await db.query.batchTrainers.findFirst({
    where: and(eq(batchTrainers.batchId, batchId), eq(batchTrainers.trainerId, user.id)),
  })
  if (!link) return forbidden(c, 'You do not manage this batch.')

  const [session] = await db
    .insert(sessions)
    .values({ batchId, trainerId: user.id, title, date, startTime, endTime })
    .returning()

  return c.json({ session }, 201)
})

/**
 * GET /api/sessions/:id/attendance
 * TRAINER views full attendance for one of their sessions.
 * Listed before /:id so the route matches correctly.
 */
sessionsRouter.get('/:id/attendance', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!
  const sessionId = c.req.param('id')

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.trainerId, user.id)),
  })
  if (!session) return forbidden(c, 'Session not found or you do not have access.')

  const records = await db.execute(sql`
    SELECT
      users.id          AS student_id,
      users.name        AS student_name,
      users.email,
      COALESCE(attendance.status, 'ABSENT') AS status,
      attendance.marked_at
    FROM batch_students
    JOIN users        ON users.id = batch_students.student_id
    LEFT JOIN attendance
           ON attendance.student_id  = users.id
          AND attendance.session_id  = ${sessionId}
    WHERE batch_students.batch_id = ${session.batchId}
    ORDER BY users.name ASC
  `)

  return c.json({ session, attendance: records })
})

/**
 * GET /api/sessions/:id
 * TRAINER fetches the details of a single session.
 */
sessionsRouter.get('/:id', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!
  const sessionId = c.req.param('id')

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.trainerId, user.id)),
  })
  if (!session) return forbidden(c, 'Session not found or you do not have access.')

  return c.json({ session })
})
