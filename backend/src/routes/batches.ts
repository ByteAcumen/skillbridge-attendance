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

// All routes here require authentication
batchesRouter.use('*', requireAuth)

/**
 * GET /batches
 * Returns batches. Role-aware:
 * - INSTITUTION: sees all batches in their institution
 * - TRAINER: sees only batches they manage
 * - STUDENT: sees batches they are enrolled in
 */
batchesRouter.get('/', async (c) => {
  const user = c.get('user')!

  if (user.role === 'INSTITUTION') {
    if (!user.institutionId) return badRequest(c, 'Institution ID missing on your profile')
    const result = await db.query.batches.findMany({
      where: eq(batches.institutionId, user.institutionId),
      orderBy: [desc(batches.createdAt)],
    })
    return c.json({ batches: result })
  }

  if (user.role === 'TRAINER') {
    const trainerLinks = await db.query.batchTrainers.findMany({
      where: eq(batchTrainers.trainerId, user.id),
      with: { batch: true },
    })
    return c.json({ batches: trainerLinks.map((l) => l.batch) })
  }

  if (user.role === 'STUDENT') {
    const studentLinks = await db.query.batchStudents.findMany({
      where: eq(batchStudents.studentId, user.id),
      with: { batch: true },
    })
    return c.json({ batches: studentLinks.map((l) => l.batch) })
  }

  return forbidden(c, 'Role not supported for listing batches')
})

const CreateBatchSchema = z.object({
  name: z.string().min(1),
})

const InviteSchema = z.object({
  reusable: z.boolean().default(true),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

/**
 * POST /batches
 * TRAINER or INSTITUTION creates a new batch. They must belong to an institution.
 */
batchesRouter.post('/', requireRole('TRAINER', 'INSTITUTION'), async (c) => {
  const user = c.get('user')!
  if (!user.institutionId) {
    return forbidden(c, 'You must be assigned to an institution to create batches.')
  }

  const parsed = CreateBatchSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return badRequest(c, 'Batch name is required.')

  const [newBatch] = await db
    .insert(batches)
    .values({
      name: parsed.data.name,
      institutionId: user.institutionId,
    })
    .returning()

  // If a trainer creates it, auto-assign them
  if (user.role === 'TRAINER') {
    await db.insert(batchTrainers).values({
      batchId: newBatch.id,
      trainerId: user.id,
    })
  }

  return c.json({ batch: newBatch }, 201)
})

/**
 * POST /batches/:id/invite
 * TRAINER generates an invite link for students to join.
 */
batchesRouter.post('/:id/invite', requireRole('TRAINER'), async (c) => {
  const batchId = c.req.param('id')
  const user = c.get('user')!

  // Verify trainer actually manages this batch
  const link = await db.query.batchTrainers.findFirst({
    where: and(eq(batchTrainers.batchId, batchId), eq(batchTrainers.trainerId, user.id)),
  })
  if (!link) return forbidden(c, 'You do not manage this batch.')

  const parsed = InviteSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) return badRequest(c, 'Invalid invite settings.')

  const token = nanoid(10) // e.g. "V1StGXR8_Z"

  const [invite] = await db
    .insert(batchInvites)
    .values({
      batchId,
      token,
      reusable: parsed.data.reusable,
      maxUses: parsed.data.maxUses,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdById: user.id,
    })
    .returning()

  return c.json({ invite })
})

/**
 * POST /batches/:id/join
 * STUDENT joins a batch using the invite token.
 */
batchesRouter.post('/:id/join', requireRole('STUDENT'), async (c) => {
  const batchId = c.req.param('id')
  const user = c.get('user')!
  const parsed = z.object({ token: z.string() }).safeParse(await c.req.json().catch(() => ({})))
  
  if (!parsed.success) return badRequest(c, 'Invite token is required.')

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

  const existingEnrollment = await db.query.batchStudents.findFirst({
    where: and(eq(batchStudents.batchId, batchId), eq(batchStudents.studentId, user.id)),
  })

  if (existingEnrollment) {
    return badRequest(c, 'You are already enrolled in this batch.')
  }

  await db.insert(batchStudents).values({
    batchId,
    studentId: user.id,
  })

  await db.update(batchInvites)
    .set({ usesCount: sql`${batchInvites.usesCount} + 1` })
    .where(eq(batchInvites.id, invite.id))

  return c.json({ ok: true, message: 'Joined batch successfully.' })
})

/**
 * GET /batches/:id/summary
 * INSTITUTION views attendance summary for a specific batch.
 */
batchesRouter.get('/:id/summary', requireRole('INSTITUTION'), async (c) => {
  const batchId = c.req.param('id')
  const user = c.get('user')!

  const batch = await db.query.batches.findFirst({
    where: and(eq(batches.id, batchId), eq(batches.institutionId, user.institutionId!)),
  })
  
  if (!batch) return forbidden(c, 'Batch not found or not in your institution.')

  // Raw SQL aggregation to find total sessions and per-student presence
  const summary = await db.execute(sql`
    SELECT 
      users.name AS student_name,
      users.email,
      COUNT(attendance.id) AS marked_sessions,
      SUM(CASE WHEN attendance.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count
    FROM batch_students
    JOIN users ON users.id = batch_students.student_id
    LEFT JOIN sessions ON sessions.batch_id = batch_students.batch_id
    LEFT JOIN attendance ON attendance.session_id = sessions.id AND attendance.student_id = users.id
    WHERE batch_students.batch_id = ${batchId}
    GROUP BY users.id
  `)

  return c.json({ batch, summary })
})
