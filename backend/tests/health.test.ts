import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('health endpoint', () => {
  it('returns service health metadata', async () => {
    const response = await request(createApp()).get('/health').expect(200)

    expect(response.body).toMatchObject({
      ok: true,
      service: 'skillbridge-attendance-api',
    })
    expect(response.body.timestamp).toEqual(expect.any(String))
  })
})
