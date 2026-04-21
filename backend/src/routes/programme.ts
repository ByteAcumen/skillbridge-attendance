import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import type { AppEnv } from '../app.js'

export const programmeRouter = new Hono<AppEnv>()
programmeRouter.use('*', requireAuth)

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

function withAttendanceRate<T extends Record<string, unknown>>(row: T) {
  const totalPossible = toNumber(row.total_possible)
  const presentCount = toNumber(row.present_count)
  const lateCount = toNumber(row.late_count)
  const markedCount = toNumber(row.marked_count)

  return {
    ...row,
    total_possible: totalPossible,
    present_count: presentCount,
    late_count: lateCount,
    marked_count: markedCount,
    attendance_rate:
      totalPossible === 0 ? 0 : Math.round(((presentCount + lateCount) / totalPossible) * 100),
  }
}

function buildInsights(rows: Array<Record<string, unknown>>) {
  const ranked = rows
    .map(withAttendanceRate)
    .sort((a, b) => a.attendance_rate - b.attendance_rate)

  const lowest = ranked[0]
  const programmeAverage =
    ranked.length === 0
      ? 0
      : Math.round(ranked.reduce((sum, row) => sum + row.attendance_rate, 0) / ranked.length)

  const recommendations = []
  if (lowest && lowest.attendance_rate < 75) {
    recommendations.push(
      `${lowest.institution_name} needs follow-up: attendance is ${lowest.attendance_rate}%.`,
    )
  }
  if (programmeAverage >= 85) {
    recommendations.push('Programme attendance is healthy; keep monitoring late marks weekly.')
  } else if (programmeAverage > 0) {
    recommendations.push('Programme attendance needs intervention; review low-rate batches first.')
  }
  if (recommendations.length === 0) {
    recommendations.push('Not enough attendance data yet. Create sessions and collect marks first.')
  }

  return {
    programmeAverage,
    recommendations,
  }
}

async function getProgrammeSummary() {
  const summary = await db.execute(sql`
    WITH possible_attendance AS (
      SELECT
        batches.institution_id,
        COUNT(*) AS total_possible
      FROM sessions
      JOIN batch_students ON batch_students.batch_id = sessions.batch_id
      JOIN batches ON batches.id = sessions.batch_id
      GROUP BY batches.institution_id
    ),
    marked_attendance AS (
      SELECT
        batches.institution_id,
        COUNT(attendance.id) AS marked_count,
        SUM(CASE WHEN attendance.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN attendance.status = 'LATE' THEN 1 ELSE 0 END) AS late_count
      FROM attendance
      JOIN sessions ON sessions.id = attendance.session_id
      JOIN batches ON batches.id = sessions.batch_id
      GROUP BY batches.institution_id
    )
    SELECT
      institutions.id AS institution_id,
      institutions.name AS institution_name,
      COUNT(DISTINCT batches.id) AS batch_count,
      COUNT(DISTINCT batch_students.student_id) AS student_count,
      COUNT(DISTINCT sessions.id) AS session_count,
      COALESCE(possible_attendance.total_possible, 0) AS total_possible,
      COALESCE(marked_attendance.marked_count, 0) AS marked_count,
      COALESCE(marked_attendance.present_count, 0) AS present_count,
      COALESCE(marked_attendance.late_count, 0) AS late_count
    FROM institutions
    LEFT JOIN batches ON batches.institution_id = institutions.id
    LEFT JOIN batch_students ON batch_students.batch_id = batches.id
    LEFT JOIN sessions ON sessions.batch_id = batches.id
    LEFT JOIN possible_attendance ON possible_attendance.institution_id = institutions.id
    LEFT JOIN marked_attendance ON marked_attendance.institution_id = institutions.id
    GROUP BY
      institutions.id,
      institutions.name,
      possible_attendance.total_possible,
      marked_attendance.marked_count,
      marked_attendance.present_count,
      marked_attendance.late_count
    ORDER BY institutions.name ASC
  `)

  const institutions = summary.map(withAttendanceRate)
  return {
    institutions,
    insights: buildInsights(summary),
  }
}

/**
 * GET /programme/summary
 * Programme Managers and Monitoring Officers view programme-wide attendance.
 */
programmeRouter.get(
  '/summary',
  requireRole('PROGRAMME_MANAGER', 'MONITORING_OFFICER'),
  async (c) => c.json(await getProgrammeSummary()),
)

/**
 * Backward-compatible read-only monitoring endpoint.
 */
programmeRouter.get('/monitoring', requireRole('MONITORING_OFFICER'), async (c) => {
  const data = await getProgrammeSummary()
  return c.json({ ...data, alerts: data.insights.recommendations })
})

/**
 * Backward-compatible programme manager insights endpoint.
 */
programmeRouter.get('/manager-insights', requireRole('PROGRAMME_MANAGER'), async (c) =>
  c.json(await getProgrammeSummary()),
)
