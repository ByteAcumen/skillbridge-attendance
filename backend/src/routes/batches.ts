/**
 * src/routes/batches.ts
 *
 * Routes:
 *   GET  /api/batches           — List batches (role-aware: institution/trainer/student)
 *   GET  /api/batches/:id       — Get single batch details
 *   POST /api/batches           — Create a batch (TRAINER or INSTITUTION)
 *   POST /api/batches/:id/invite — Generate a student invite link (TRAINER)
 *   POST /api/batches/:id/join  — Join a batch with invite token (STUDENT)
 *   GET  /api/batches/:id/summary — Attendance summary for a batch (INSTITUTION)
 */
import { Hono } from 'hono'
import { and, desc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { nanoid } from 'nanoid'
import { db } from '../db/client.js'
import { batches, batchInvites, batchStudents, batchTrainers, users, attendance, sessions } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { badRequest, forbidden, notFound } from '../lib/errors.js'
import type { AppEnv } from '../app.js'

export const batchesRouter = new Hono<AppEnv>()

batchesRouter.use('*', requireAuth)

// ── Schemas ────────────────────────────────────────────────────────────────────

const CreateBatchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
})

const InviteSchema = z.object({
  reusable: z.boolean().default(true),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime({ message: 'Must be an ISO 8601 datetime' }).optional(),
})

const JoinSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
})

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/batches
 * Role-aware list:
 *   INSTITUTION → all batches in their institution
 *   TRAINER     → only batches they manage
 *   STUDENT     → only batches they are enrolled in
 */
batchesRouter.get('/', async (c) => {
  const user = c.get('user')!

  if (user.role === 'INSTITUTION') {
    if (!user.institutionId) return badRequest(c, 'Your account is not linked to an institution.')
    const result = await db.query.batches.findMany({
      where: eq(batches.institutionId, user.institutionId),
      orderBy: [desc(batches.createdAt)],
    })
    return c.json({ batches: result })
  }

  if (user.role === 'TRAINER') {
    const links = await db.query.batchTrainers.findMany({
      where: eq(batchTrainers.trainerId, user.id),
      with: { batch: true },
    })
    return c.json({ batches: links.map((l) => l.batch) })
  }

  if (user.role === 'STUDENT') {
    const links = await db.query.batchStudents.findMany({
      where: eq(batchStudents.studentId, user.id),
      with: { batch: true },
    })
    return c.json({ batches: links.map((l) => l.batch) })
  }

  return forbidden(c, `Role ${user.role} cannot list batches.`)
})

/**
 * GET /api/batches/:id
 * Returns a single batch with its trainers and students.
 * INSTITUTION can see any batch in their institution; TRAINER must manage it.
 */
batchesRouter.get('/:id', async (c) => {
  const user = c.get('user')!
  const batchId = c.req.param('id')

  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
    with: {
      trainers: { with: { trainer: { columns: { id: true, name: true, email: true } } } },
      students: { with: { student: { columns: { id: true, name: true, email: true } } } },
    },
  })

  if (!batch) return notFound(c, 'Batch not found.')

  // INSTITUTION sees only their own batches
  if (user.role === 'INSTITUTION' && batch.institutionId !== user.institutionId) {
    return forbidden(c, 'This batch does not belong to your institution.')
  }

  // TRAINER sees only batches they manage
  if (user.role === 'TRAINER') {
    const manages = batch.trainers.some((t) => t.trainerId === user.id)
    if (!manages) return forbidden(c, 'You do not manage this batch.')
  }

  return c.json({ batch })
})

/**
 * POST /api/batches
 * TRAINER or INSTITUTION creates a new batch under their institution.
 */
batchesRouter.post('/', requireRole('TRAINER', 'INSTITUTION'), async (c) => {
  const user = c.get('user')!

  if (!user.institutionId) {
    return forbidden(c, 'You must be linked to an institution to create batches.')
  }

  const body = await c.req.json().catch(() => ({}))
  const parsed = CreateBatchSchema.safeParse(body)
  if (!parsed.success) return badRequest(c, parsed.error.issues[0].message)

  const [newBatch] = await db
    .insert(batches)
    .values({ name: parsed.data.name, institutionId: user.institutionId })
    .returning()

  // Auto-assign creating trainer to the batch
  if (user.role === 'TRAINER') {
    await db.insert(batchTrainers).values({ batchId: newBatch.id, trainerId: user.id })
  }

  return c.json({ batch: newBatch }, 201)
})

/**
 * POST /api/batches/:id/invite
 * TRAINER generates a student invite link for one of their batches.
 */
batchesRouter.post('/:id/invite', requireRole('TRAINER'), async (c) => {
  const user = c.get('user')!
  const batchId = c.req.param('id')

  const link = await db.query.batchTrainers.findFirst({
    where: and(eq(batchTrainers.batchId, batchId), eq(batchTrainers.trainerId, user.id)),
  })
  if (!link) return forbidden(c, 'You do not manage this batch.')

  const body = await c.req.json().catch(() => ({}))
  const parsed = InviteSchema.safeParse(body)
  if (!parsed.success) return badRequest(c, parsed.error.issues[0].message)

  const [invite] = await db
    .insert(batchInvites)
    .values({
      batchId,
      token: nanoid(10),
      reusable: parsed.data.reusable,
      maxUses: parsed.data.maxUses,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdById: user.id,
    })
    .returning()

  return c.json({ invite })
})

/**
 * POST /api/batches/:id/join
 * STUDENT joins a batch using an invite token.
 */
batchesRouter.post('/:id/join', requireRole('STUDENT'), async (c) => {
  const user = c.get('user')!
  const batchId = c.req.param('id')

  const body = await c.req.json().catch(() => ({}))
  const parsed = JoinSchema.safeParse(body)
  if (!parsed.success) return badRequest(c, parsed.error.issues[0].message)

  const invite = await db.query.batchInvites.findFirst({
    where: and(eq(batchInvites.batchId, batchId), eq(batchInvites.token, parsed.data.token)),
  })
  if (!invite) return notFound(c, 'Invalid invite link.')

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return forbidden(c, 'This invite link has expired.')
  }
  if (!invite.reusable && invite.usesCount >= 1) {
    return forbidden(c, 'This invite link has already been used.')
  }
  if (invite.maxUses !== null && invite.usesCount >= invite.maxUses) {
    return forbidden(c, 'This invite link has reached its usage limit.')
  }

  const alreadyEnrolled = await db.query.batchStudents.findFirst({
    where: and(eq(batchStudents.batchId, batchId), eq(batchStudents.studentId, user.id)),
  })
  if (alreadyEnrolled) return badRequest(c, 'You are already enrolled in this batch.')

  await db.insert(batchStudents).values({ batchId, studentId: user.id })
  await db
    .update(batchInvites)
    .set({ usesCount: sql`${batchInvites.usesCount} + 1` })
    .where(eq(batchInvites.id, invite.id))

  return c.json({ ok: true, message: 'Joined batch successfully.' })
})

/**
 * GET /api/batches/:id/summary
 * INSTITUTION views per-student attendance summary for a specific batch.
 */
batchesRouter.get('/:id/summary', requireRole('INSTITUTION'), async (c) => {
  const user = c.get('user')!
  const batchId = c.req.param('id')

  const batch = await db.query.batches.findFirst({
    where: and(eq(batches.id, batchId), eq(batches.institutionId, user.institutionId!)),
  })
  if (!batch) return forbidden(c, 'Batch not found or it does not belong to your institution.')

  const summary = await db.execute(sql`
    SELECT
      users.name AS student_name,
      users.email,
      COUNT(attendance.id)                                                       AS marked_sessions,
      SUM(CASE WHEN attendance.status = 'PRESENT' THEN 1 ELSE 0 END)           AS present_count,
      SUM(CASE WHEN attendance.status = 'LATE'    THEN 1 ELSE 0 END)           AS late_count
    FROM batch_students
    JOIN users        ON users.id = batch_students.student_id
    LEFT JOIN sessions   ON sessions.batch_id = batch_students.batch_id
    LEFT JOIN attendance ON attendance.session_id = sessions.id
                       AND attendance.student_id  = users.id
    WHERE batch_students.batch_id = ${batchId}
    GROUP BY users.id, users.name, users.email
    ORDER BY users.name ASC
  `)

  return c.json({ batch, summary })
})
