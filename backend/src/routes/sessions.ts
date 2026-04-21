import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
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

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

const SessionSchema = z
  .object({
    batchId: z.string(),
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
    startTime: z.string().regex(timeRegex, 'Must be HH:MM in 24-hour format'),
    endTime: z.string().regex(timeRegex, 'Must be HH:MM in 24-hour format'),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: 'startTime must be before endTime',
    path: ['endTime'],
  })

/**
 * GET /sessions/active
 * STUDENT sees active sessions for batches they are enrolled in.
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
    JOIN batches ON batches.id = sessions.batch_id
    JOIN batch_students ON batch_students.batch_id = sessions.batch_id
    WHERE batch_students.student_id = ${user.id}
      AND sessions.date = ${current.date}
      AND sessions.start_time <= ${current.time}
      AND sessions.end_time >= ${current.time}
    ORDER BY sessions.start_time ASC
  `)

  return c.json({ sessions: activeSessions })
})

/**
 * POST /sessions
 * TRAINER creates a new session for a batch they manage.
 */
sessionsRouter.post('/', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!
  const parsed = SessionSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return badRequest(c, parsed.error.message)

  const { batchId, title, date, startTime, endTime } = parsed.data

  // Verify trainer
  const link = await db.query.batchTrainers.findFirst({
    where: and(eq(batchTrainers.batchId, batchId), eq(batchTrainers.trainerId, user.id)),
  })
  if (!link) return forbidden(c, 'You do not manage this batch.')

  const [session] = await db
    .insert(sessions)
    .values({
      batchId,
      trainerId: user.id,
      title,
      date,
      startTime,
      endTime,
    })
    .returning()

  return c.json({ session }, 201)
})

/**
 * GET /sessions/:id/attendance
 * TRAINER views full attendance for one of their sessions.
 */
sessionsRouter.get('/:id/attendance', requireRole('TRAINER'), async (c) => {
  const sessionId = c.req.param('id')
  const user = c.get('user')!

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.trainerId, user.id)),
  })

  if (!session) return forbidden(c, 'Session not found or you do not have access.')

  const records = await db.execute(sql`
    SELECT
      users.id AS student_id,
      users.name AS student_name,
      users.email,
      COALESCE(attendance.status, 'ABSENT') AS status,
      attendance.marked_at
    FROM batch_students
    JOIN users ON users.id = batch_students.student_id
    LEFT JOIN attendance
      ON attendance.student_id = users.id
      AND attendance.session_id = ${sessionId}
    WHERE batch_students.batch_id = ${session.batchId}
    ORDER BY users.name ASC
  `)

  return c.json({ session, attendance: records })
})

/**
 * GET /sessions/:id
 * TRAINER gets details of a session.
 */
sessionsRouter.get('/:id', requireRole('TRAINER'), async (c) => {
  const sessionId = c.req.param('id')
  const user = c.get('user')!

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.trainerId, user.id)),
  })

  if (!session) return forbidden(c, 'Session not found or you do not have access.')

  return c.json({ session })
})
