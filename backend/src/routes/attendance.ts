import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { attendance, batchStudents, sessions } from '../db/schema.js'
import { env } from '../lib/env.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors.js'
import { isSessionActive } from '../lib/time.js'
import type { AppEnv } from '../app.js'

export const attendanceRouter = new Hono<AppEnv>()
attendanceRouter.use('*', requireAuth)

const MarkSchema = z.object({
  sessionId: z.string(),
  status: z.enum(['PRESENT', 'LATE']),
})

/**
 * POST /attendance/mark
 * STUDENT marks their own attendance for an active session.
 */
attendanceRouter.post('/mark', requireRole('STUDENT'), async (c) => {
  const user = c.get('user')!
  const parsed = MarkSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return badRequest(c, 'Invalid payload')

  const { sessionId, status } = parsed.data

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })
  if (!session) return notFound(c, 'Session not found')

  // Is student enrolled in this batch?
  const link = await db.query.batchStudents.findFirst({
    where: and(eq(batchStudents.batchId, session.batchId), eq(batchStudents.studentId, user.id)),
  })
  if (!link) return forbidden(c, 'You are not enrolled in the batch for this session.')

  if (!isSessionActive(session, env.PROGRAMME_TIME_ZONE)) {
    return badRequest(c, 'Attendance can only be marked during an active session.')
  }

  try {
    const [record] = await db
      .insert(attendance)
      .values({
        sessionId,
        studentId: user.id,
        status,
      })
      .returning()
    return c.json({ ok: true, attendance: record }, 201)
  } catch (err: any) {
    if (err.code === '23505') {
      return conflict(c, 'You have already marked attendance for this session.')
    }
    throw err
  }
})

const OverrideSchema = z.object({
  studentId: z.string(),
  sessionId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
})

/**
 * POST /attendance/override
 * TRAINER manually overrides a student's attendance.
 */
attendanceRouter.post('/override', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!
  const parsed = OverrideSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return badRequest(c, 'Invalid payload')

  const { studentId, sessionId, status } = parsed.data

  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.trainerId, user.id)),
  })
  if (!session) return forbidden(c, 'You do not own this session.')

  // Upsert the record manually
  const [record] = await db
    .insert(attendance)
    .values({ sessionId, studentId, status })
    .onConflictDoUpdate({
      target: [attendance.sessionId, attendance.studentId],
      set: { status },
    })
    .returning()

  return c.json({ ok: true, attendance: record })
})
