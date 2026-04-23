/**
 * src/routes/me.ts
 *
 * Routes:
 *   GET  /api/me        — Returns the current user's full profile.
 *   POST /api/me/sync   — Called once after Clerk sign-up to create/update
 *                         the user row in our database.
 *
 * Why /sync is separate from /me:
 *   `requireAuth` looks up the user in our DB. But on first login the user
 *   doesn't exist yet, so we can't use `requireAuth` for /sync — we verify
 *   the Clerk token directly, then upsert the user row.
 */
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client.js'
import { institutions, users } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { AuthError, resolveClerkUserId } from '../lib/clerk.js'
import { badRequest, unauthorized } from '../lib/errors.js'
import type { AppEnv } from '../app.js'

export const meRouter = new Hono<AppEnv>()

/**
 * GET /api/me
 * Returns the currently authenticated user's profile (with their institution).
 */
meRouter.get('/', requireAuth, async (c) => {
  const { id } = c.get('user')!
  const profile = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { institution: true },
  })
  return c.json({ user: profile })
})

// ── Sync schema ────────────────────────────────────────────────────────────────

const SyncSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Must be a valid email'),
  role: z.enum(
    ['STUDENT', 'TRAINER', 'INSTITUTION', 'PROGRAMME_MANAGER', 'MONITORING_OFFICER'],
    { errorMap: () => ({ message: 'Invalid role' }) },
  ),
})

async function ensureDemoInstitution() {
  await db
    .insert(institutions)
    .values({
      id: 'inst_demo_state_polytechnic',
      name: 'State Polytechnic Institute',
      region: 'North',
    })
    .onConflictDoUpdate({
      target: institutions.id,
      set: {
        name: 'State Polytechnic Institute',
        region: 'North',
      },
    })
}

function defaultInstitutionForRole(role: z.infer<typeof SyncSchema>['role']) {
  return role === 'TRAINER' || role === 'INSTITUTION'
    ? 'inst_demo_state_polytechnic'
    : null
}

/**
 * POST /api/me/sync
 *
 * Called by the frontend ONCE after a user completes Clerk sign-up.
 * We manually verify the Clerk JWT (without requireAuth), then upsert the user.
 *
 * Supports the dev backdoor: "user_seed_*" tokens work here too, so Postman
 * testing doesn't require a real Clerk account.
 */
meRouter.post('/sync', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(c, 'Missing Authorization header. Format: Bearer <token>')
  }

  const token = authHeader.slice('Bearer '.length).trim()

  let clerkUserId: string
  try {
    clerkUserId = await resolveClerkUserId(token)
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(c, err.message)
    }
    throw err
  }

  const body = await c.req.json().catch(() => ({}))
  const parsed = SyncSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ')
    return badRequest(c, message)
  }

  const { name, email, role } = parsed.data
  const institutionId = defaultInstitutionForRole(role)

  if (institutionId) {
    await ensureDemoInstitution()
  }

  const [syncedUser] = await db
    .insert(users)
    .values({ clerkUserId, name, email, role, institutionId })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { name, email, role, institutionId },
    })
    .returning()

  return c.json({ ok: true, user: syncedUser }, 201)
})
