/**
 * src/middleware/auth.ts
 *
 * Middleware: requireAuth
 *
 * Extracts the Bearer token from the Authorization header, resolves it to a
 * Clerk user ID via `resolveClerkUserId`, then loads the matching user row
 * from our database and attaches it to `c.get('user')`.
 *
 * If anything fails (missing header, bad token, user not synced) it returns
 * a 401 immediately and the route handler never runs.
 */
import { eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import type { AppEnv } from '../app.js'
import { AuthError, resolveClerkUserId } from '../lib/clerk.js'
import { unauthorized } from '../lib/errors.js'

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(c, 'Missing or invalid Authorization header')
  }

  const token = authHeader.slice('Bearer '.length).trim()

  try {
    const clerkUserId = await resolveClerkUserId(token)

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
      columns: { id: true, clerkUserId: true, role: true, institutionId: true },
    })

    if (!user) {
      return unauthorized(
        c,
        'User not synced with database. Call POST /api/me/sync after signing up.',
      )
    }

    c.set('user', user)
    await next()
  } catch (err) {
    if (err instanceof AuthError) {
      return unauthorized(c, err.message)
    }
    // Unexpected DB error — let the global error handler deal with it
    throw err
  }
})
