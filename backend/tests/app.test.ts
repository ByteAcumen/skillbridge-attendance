import { describe, expect, it } from 'vitest'
import { app } from '../src/app.js'

describe('app shell', () => {
  it('returns public health metadata', async () => {
    const response = await app.request('/health')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ ok: true, environment: 'test' })
    expect(body.timestamp).toEqual(expect.any(String))
  })

  it('returns API metadata at the root', async () => {
    const response = await app.request('/')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      name: 'SkillBridge API',
      framework: 'Hono',
      status: 'running',
    })
  })

  it('rejects protected routes without a bearer token', async () => {
    const response = await app.request('/api/me')
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toMatchObject({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    })
  })
})
