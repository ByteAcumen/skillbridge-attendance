function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? ''
}

export function getProgrammeDateTime(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  return {
    date: `${getPart(parts, 'year')}-${getPart(parts, 'month')}-${getPart(parts, 'day')}`,
    time: `${getPart(parts, 'hour')}:${getPart(parts, 'minute')}`,
  }
}

export function normalizeSessionDate(value: Date | string) {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  return value.toISOString().slice(0, 10)
}

export function isSessionActive(
  session: { date: Date | string; startTime: string; endTime: string },
  timeZone: string,
  now = new Date(),
) {
  const current = getProgrammeDateTime(timeZone, now)
  const sessionDate = normalizeSessionDate(session.date)

  return (
    sessionDate === current.date &&
    session.startTime <= current.time &&
    session.endTime >= current.time
  )
}
