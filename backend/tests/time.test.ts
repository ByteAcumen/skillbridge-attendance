import { describe, expect, it } from 'vitest'
import { getProgrammeDateTime, isSessionActive } from '../src/lib/time.js'

describe('programme time helpers', () => {
  it('formats date and time in the configured timezone', () => {
    const result = getProgrammeDateTime('Asia/Kolkata', new Date('2026-04-21T06:30:00.000Z'))

    expect(result).toEqual({ date: '2026-04-21', time: '12:00' })
  })

  it('detects active sessions by date and time', () => {
    const session = {
      date: '2026-04-21',
      startTime: '11:00',
      endTime: '13:00',
    }

    expect(isSessionActive(session, 'Asia/Kolkata', new Date('2026-04-21T06:30:00.000Z'))).toBe(
      true,
    )
    expect(isSessionActive(session, 'Asia/Kolkata', new Date('2026-04-21T08:30:00.000Z'))).toBe(
      false,
    )
  })
})
