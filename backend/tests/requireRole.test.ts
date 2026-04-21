import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import type { AppEnv } from '../src/app.js'
import { requireRole } from '../src/middleware/requireRole.js'

function appWithRole(role: NonNullable<AppEnv['Variables']['user']>['role']) {
  const app = new Hono<AppEnv>()

  app.use('*', async (c, next) => {
    c.set('user', {
      id: 'user_1',
      clerkUserId: 'clerk_1',
      role,
      institutionId: null,
    })
    await next()
  })

  app.get('/trainer-only', requireRole('TRAINER'), (c) => c.json({ ok: true }))

  return app
}

describe('requireRole middleware', () => {
  it('allows an allowed role', async () => {
    const response = await appWithRole('TRAINER').request('/trainer-only')

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('blocks a wrong role with 403', async () => {
    const response = await appWithRole('STUDENT').request('/trainer-only')
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })
})
