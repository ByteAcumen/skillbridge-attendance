import { Hono } from 'hono'
import { eq, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { institutions } from '../db/schema.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { notFound } from '../lib/errors.js'
import type { AppEnv } from '../app.js'

export const institutionsRouter = new Hono<AppEnv>()
institutionsRouter.use('*', requireAuth)

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

/**
 * GET /institutions/:id/summary
 * Programme Managers view summary across all batches in an institution.
 */
institutionsRouter.get('/:id/summary', requireRole('PROGRAMME_MANAGER'), async (c) => {
  const institutionId = c.req.param('id')
  const institution = await db.query.institutions.findFirst({
    where: eq(institutions.id, institutionId),
  })

  if (!institution) {
    return notFound(c, 'Institution not found.')
  }

  const batches = await db.execute(sql`
    WITH possible_attendance AS (
      SELECT
        sessions.batch_id,
        COUNT(*) AS total_possible
      FROM sessions
      JOIN batch_students ON batch_students.batch_id = sessions.batch_id
      GROUP BY sessions.batch_id
    ),
    marked_attendance AS (
      SELECT
        sessions.batch_id,
        COUNT(attendance.id) AS marked_count,
        SUM(CASE WHEN attendance.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN attendance.status = 'LATE' THEN 1 ELSE 0 END) AS late_count
      FROM attendance
      JOIN sessions ON sessions.id = attendance.session_id
      GROUP BY sessions.batch_id
    )
    SELECT
      batches.id AS batch_id,
      batches.name AS batch_name,
      COUNT(DISTINCT batch_students.student_id) AS student_count,
      COUNT(DISTINCT sessions.id) AS session_count,
      COALESCE(possible_attendance.total_possible, 0) AS total_possible,
      COALESCE(marked_attendance.marked_count, 0) AS marked_count,
      COALESCE(marked_attendance.present_count, 0) AS present_count,
      COALESCE(marked_attendance.late_count, 0) AS late_count
    FROM batches
    LEFT JOIN batch_students ON batch_students.batch_id = batches.id
    LEFT JOIN sessions ON sessions.batch_id = batches.id
    LEFT JOIN possible_attendance ON possible_attendance.batch_id = batches.id
    LEFT JOIN marked_attendance ON marked_attendance.batch_id = batches.id
    WHERE batches.institution_id = ${institutionId}
    GROUP BY
      batches.id,
      batches.name,
      possible_attendance.total_possible,
      marked_attendance.marked_count,
      marked_attendance.present_count,
      marked_attendance.late_count
    ORDER BY batches.name ASC
  `)

  return c.json({
    institution,
    batches: batches.map((row: Record<string, unknown>) => {
      const totalPossible = toNumber(row.total_possible)
      const presentCount = toNumber(row.present_count)
      const lateCount = toNumber(row.late_count)

      return {
        ...row,
        student_count: toNumber(row.student_count),
        session_count: toNumber(row.session_count),
        total_possible: totalPossible,
        marked_count: toNumber(row.marked_count),
        present_count: presentCount,
        late_count: lateCount,
        attendance_rate:
          totalPossible === 0
            ? 0
            : Math.round(((presentCount + lateCount) / totalPossible) * 100),
      }
    }),
  })
})
