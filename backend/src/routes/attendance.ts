/**
 * src/routes/attendance.ts
 *
 * Routes:
 *   POST /api/attendance/mark     — STUDENT marks their own attendance
 *   POST /api/attendance/override — TRAINER manually overrides a student's status
 */
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

// ── Schemas ────────────────────────────────────────────────────────────────────

const MarkSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  status: z.enum(['PRESENT', 'LATE'], {
    errorMap: () => ({ message: 'status must be PRESENT or LATE' }),
  }),
})

const OverrideSchema = z.object({
  studentId: z.string().min(1, 'studentId is required'),
  sessionId: z.string().min(1, 'sessionId is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE'], {
    errorMap: () => ({ message: 'status must be PRESENT, ABSENT, or LATE' }),
  }),
})

// Helper: detect Postgres unique-constraint violation regardless of driver version
function isUniqueViolation(err: unknown): boolean {
  const e = err as Record<string, unknown>
  return (
    e.code === '23505' ||
    (typeof e.message === 'string' && e.message.includes('unique constraint')) ||
    (typeof e.cause === 'object' && (e.cause as Record<string, unknown>)?.code === '23505')
  )
}

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/attendance/mark
 * STUDENT marks their own attendance for an active session.
 * Status can only be PRESENT or LATE (ABSENT is inferred server-side).
 */
attendanceRouter.post('/mark', requireRole('STUDENT'), async (c) => {
  const user = c.get('user')!

  const body = await c.req.json().catch(() => ({}))
  const parsed = MarkSchema.safeParse(body)
  if (!parsed.success) return badRequest(c, parsed.error.issues[0].message)

  const { sessionId, status } = parsed.data

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  })
  if (!session) return notFound(c, 'Session not found.')

  // Student must be enrolled in this batch
  const enrolled = await db.query.batchStudents.findFirst({
    where: and(eq(batchStudents.batchId, session.batchId), eq(batchStudents.studentId, user.id)),
  })
  if (!enrolled) return forbidden(c, 'You are not enrolled in the batch for this session.')

  // Session must be currently active
  if (!isSessionActive(session, env.PROGRAMME_TIME_ZONE)) {
    return badRequest(c, 'Attendance can only be marked during an active session.')
  }

  try {
    const [record] = await db
      .insert(attendance)
      .values({ sessionId, studentId: user.id, status })
      .returning()

    return c.json({ ok: true, attendance: record }, 201)
  } catch (err) {
    if (isUniqueViolation(err)) {
      return conflict(c, 'You have already marked attendance for this session.')
    }
    throw err
  }
})

/**
 * POST /api/attendance/override
 * TRAINER manually sets (or corrects) a student's attendance status.
 * Uses INSERT ... ON CONFLICT DO UPDATE (upsert), so it creates or updates.
 */
attendanceRouter.post('/override', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!

  const body = await c.req.json().catch(() => ({}))
  const parsed = OverrideSchema.safeParse(body)
  if (!parsed.success) return badRequest(c, parsed.error.issues[0].message)

  const { studentId, sessionId, status } = parsed.data

  // Only the trainer who owns the session can override
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, sessionId), eq(sessions.trainerId, user.id)),
  })
  if (!session) return forbidden(c, 'You do not own this session.')

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
