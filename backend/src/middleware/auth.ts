import { verifyToken } from '@clerk/backend'
import { eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import type { AppEnv } from '../app.js'
import { env } from '../lib/env.js'
import { unauthorized } from '../lib/errors.js'

/**
 * Middleware: requireAuth
 *
 * Checks for a valid Clerk Bearer token in the Authorization header.
 * If valid, it looks up the corresponding user in our database.
 * If found, it attaches the user object to `c.get('user')` for the route.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(c, 'Missing or invalid Authorization header')
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) {
    return unauthorized(c, 'Missing bearer token')
  }

  try {
    // 1. Verify the JWT cryptographically using Clerk's secret key
    const decodedPayload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    })

    const clerkUserId = decodedPayload.sub

    // 2. Load the application user from our database so we know their role
    // We only select the fields we need downstream to keep it fast
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
      columns: {
        id: true,
        clerkUserId: true,
        role: true,
        institutionId: true,
      },
    })

    if (!user) {
      // The token is valid, but the user hasn't hit /me/sync after signing up yet
      return unauthorized(c, 'User not synced with database. Call POST /me/sync first.')
    }

    // 3. Attach user to context
    c.set('user', user)
    await next()
  } catch (error) {
    console.error('Token verification failed:', error)
    return unauthorized(c, 'Invalid or expired token')
  }
})
