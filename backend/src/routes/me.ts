import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { verifyToken } from '@clerk/backend'
import { env } from '../lib/env.js'
import { badRequest, unauthorized } from '../lib/errors.js'
import type { AppEnv } from '../app.js'

export const meRouter = new Hono<AppEnv>()

/**
 * GET /me
 * Returns the currently authenticated user's profile from the database.
 */
meRouter.get('/', requireAuth, async (c) => {
  const user = c.get('user')!
  const profile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    with: { institution: true },
  })
  return c.json({ user: profile })
})

const SyncSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['STUDENT', 'TRAINER', 'INSTITUTION', 'PROGRAMME_MANAGER', 'MONITORING_OFFICER']),
})

/**
 * POST /me/sync
 * Called by the frontend ONCE after a user completes Clerk sign-up.
 * We can't use `requireAuth` here because `requireAuth` expects the user 
 * to ALREADY be in the database. Instead, we manually verify the token,
 * then insert/update the user row.
 */
meRouter.post('/sync', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(c, 'Missing token')
  }

  let clerkUserId: string
  try {
    const token = authHeader.slice('Bearer '.length).trim()
    if (!token) {
      return unauthorized(c, 'Missing token')
    }

    const decoded = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    })
    clerkUserId = decoded.sub
  } catch (error) {
    return unauthorized(c, 'Invalid token')
  }

  const bodyData = await c.req.json().catch(() => ({}))
  const parsed = SyncSchema.safeParse(bodyData)
  
  if (!parsed.success) {
    return badRequest(c, 'Invalid payload: name, email, and role are required.')
  }

  const { name, email, role } = parsed.data

  // Upsert the user — if they already exist, just update their details
  const [syncedUser] = await db
    .insert(users)
    .values({ clerkUserId, name, email, role })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { name, email, role },
    })
    .returning()

  return c.json({ ok: true, user: syncedUser }, 201)
})
