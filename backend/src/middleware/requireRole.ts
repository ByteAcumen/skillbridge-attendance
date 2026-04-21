import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../app.js'
import { forbidden, unauthorized } from '../lib/errors.js'

type Role = 'STUDENT' | 'TRAINER' | 'INSTITUTION' | 'PROGRAMME_MANAGER' | 'MONITORING_OFFICER'

/**
 * Middleware factory: requireRole
 *
 * Ensures the authenticated user has one of the allowed roles.
 * Must be used AFTER `requireAuth` middleware!
 *
 * Usage:
 *   app.post('/sessions', requireAuth, requireRole('TRAINER'), async (c) => ...)
 */
export function requireRole(...allowedRoles: Role[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return unauthorized(c, 'Authentication required to access this resource.')
    }

    if (!allowedRoles.includes(user.role)) {
      return forbidden(c, `Role ${user.role} is not permitted to perform this action.`)
    }

    await next()
  })
}
