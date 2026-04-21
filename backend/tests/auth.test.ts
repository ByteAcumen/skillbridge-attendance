import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppEnv } from '../src/app.js'

const verifyTokenMock = vi.fn()
const findUserMock = vi.fn()

vi.mock('@clerk/backend', () => ({
  verifyToken: verifyTokenMock,
}))

vi.mock('../src/db/client.js', () => ({
  db: {
    query: {
      users: {
        findFirst: findUserMock,
      },
    },
  },
}))

const { requireAuth } = await import('../src/middleware/auth.js')

function createProtectedApp() {
  const app = new Hono<AppEnv>()
  app.get('/protected', requireAuth, (c) => c.json({ user: c.get('user') }))
  return app
}

describe('requireAuth middleware', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset()
    findUserMock.mockReset()
  })

  it('rejects missing Authorization headers', async () => {
    const response = await createProtectedApp().request('/protected')
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.message).toBe('Missing or invalid Authorization header')
  })

  it('attaches a synced database user for a valid Clerk token', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'clerk_user_1' })
    findUserMock.mockResolvedValue({
      id: 'user_1',
      clerkUserId: 'clerk_user_1',
      role: 'TRAINER',
      institutionId: 'inst_1',
    })

    const response = await createProtectedApp().request('/protected', {
      headers: { Authorization: 'Bearer test-token' },
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.user).toMatchObject({
      id: 'user_1',
      role: 'TRAINER',
      institutionId: 'inst_1',
    })
  })

  it('rejects valid Clerk users that are not synced locally yet', async () => {
    verifyTokenMock.mockResolvedValue({ sub: 'clerk_user_1' })
    findUserMock.mockResolvedValue(undefined)

    const response = await createProtectedApp().request('/protected', {
      headers: { Authorization: 'Bearer test-token' },
    })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.message).toContain('User not synced')
  })
})
