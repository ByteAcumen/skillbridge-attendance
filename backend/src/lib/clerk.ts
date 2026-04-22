/**
 * src/lib/clerk.ts
 *
 * Single source of truth for Clerk token resolution.
 * Used by both `requireAuth` middleware and `POST /me/sync`.
 *
 * In development, tokens that start with "user_seed_" are passed through
 * directly as fake Clerk user IDs so Postman testing works without real JWTs.
 * This shortcut is NEVER active in production.
 */
import { verifyToken } from '@clerk/backend'
import { env } from './env.js'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Resolves a raw Bearer token to a Clerk user ID.
 *
 * - Production: always verifies the JWT cryptographically.
 * - Development: passes "user_seed_*" tokens through as-is (dev shortcut).
 *
 * Throws `AuthError` on any failure so callers can convert to a 401 response.
 */
export async function resolveClerkUserId(token: string): Promise<string> {
  if (!token) {
    throw new AuthError('Missing bearer token')
  }

  // Dev-only backdoor — bypasses Clerk entirely for seeded test users.
  if (env.NODE_ENV !== 'production' && token.startsWith('user_seed_')) {
    return token
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      clockSkewInMs: 60_000,
    })
    return payload.sub
  } catch {
    throw new AuthError('Invalid or expired token')
  }
}
