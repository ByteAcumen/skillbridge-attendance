/**
 * src/db/schema.ts
 *
 * The single source of truth for the entire database schema.
 *
 * Written with Drizzle ORM — a TypeScript-first ORM that stays close to SQL.
 * Every table, enum, column, and relation is defined here and inferred by the
 * TypeScript compiler, so you get full type-safety from DB → API → frontend
 * without manual type definitions.
 *
 * Column names use snake_case in the DB (Postgres convention) and are mapped
 * to camelCase in TypeScript (JS convention) via the column declaration helpers.
 *
 * Design decisions (see README §Schema):
 *  - institutions is a separate table (not just a user field) so batches can
 *    be owned by an institution independently of any single user account.
 *  - batch_invites stores reusable tokens so a trainer can share one link
 *    with a whole cohort without regenerating it every time.
 *  - attendance has a UNIQUE(session_id, student_id) constraint — a student
 *    can only mark attendance once per session (prevents double-counting).
 */
import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'

// ── Enums ─────────────────────────────────────────────────────────────────────

/** The five roles from the assignment spec — stored as a Postgres enum. */
export const roleEnum = pgEnum('role', [
  'STUDENT',
  'TRAINER',
  'INSTITUTION',
  'PROGRAMME_MANAGER',
  'MONITORING_OFFICER',
])

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'PRESENT',
  'ABSENT',
  'LATE',
])

// ── Tables ────────────────────────────────────────────────────────────────────

/**
 * institutions
 * Represents a training institution in the programme.
 * Trainers and batches belong to an institution.
 */
export const institutions = pgTable('institutions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  region: text('region'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * users
 * One row per user, created/updated via POST /me/sync after Clerk login.
 * clerk_user_id is the link between our DB and Clerk's auth system.
 * institution_id is nullable: students and monitoring officers don't belong
 * to a specific institution.
 */
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  name: text('name').notNull(),
  email: text('email').unique(),
  role: roleEnum('role').notNull(),
  institutionId: text('institution_id').references(() => institutions.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * batches
 * A cohort of students trained together under one institution.
 * Multiple trainers can manage the same batch (via batch_trainers).
 */
export const batches = pgTable('batches', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text('name').notNull(),
  institutionId: text('institution_id')
    .notNull()
    .references(() => institutions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * batch_trainers
 * Many-to-many join: one batch can have multiple trainers; one trainer can
 * manage multiple batches. Composite primary key (batch_id, trainer_id).
 */
export const batchTrainers = pgTable(
  'batch_trainers',
  {
    batchId: text('batch_id')
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    trainerId: text('trainer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.batchId, t.trainerId] })],
)

/**
 * batch_students
 * Many-to-many join: a student joins a batch (usually via invite link).
 * Composite primary key prevents a student joining the same batch twice.
 */
export const batchStudents = pgTable(
  'batch_students',
  {
    batchId: text('batch_id')
      .notNull()
      .references(() => batches.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.batchId, t.studentId] })],
)

/**
 * sessions
 * An individual class session within a batch.
 * date is stored as a DATE string "YYYY-MM-DD".
 * start_time / end_time are "HH:MM" strings — simple, timezone-naive,
 * sufficient for a prototype where all sessions are in one region.
 */
export const sessions = pgTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  batchId: text('batch_id')
    .notNull()
    .references(() => batches.id, { onDelete: 'cascade' }),
  trainerId: text('trainer_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  date: date('date').notNull(), // stored as "YYYY-MM-DD"
  startTime: text('start_time').notNull(), // stored as "HH:MM"
  endTime: text('end_time').notNull(), // stored as "HH:MM"
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * attendance
 * One row per (session, student) pair.
 * UNIQUE(session_id, student_id) prevents a student from marking twice.
 * status: PRESENT | ABSENT | LATE (students only mark PRESENT or LATE;
 * ABSENT is inferred server-side for enrolled students with no record).
 */
export const attendance = pgTable(
  'attendance',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    studentId: text('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull(),
    markedAt: timestamp('marked_at').defaultNow().notNull(),
  },
  (t) => [unique('attendance_unique').on(t.sessionId, t.studentId)],
)

/**
 * batch_invites
 * Stores invite tokens that Trainers generate for students to join a batch.
 * reusable=true  → multiple students can use the same link (default).
 * reusable=false → one-time link, disabled after first use.
 * max_uses=null  → no cap; max_uses=N → disabled after N uses.
 * expires_at     → optional expiry timestamp.
 */
export const batchInvites = pgTable('batch_invites', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  batchId: text('batch_id')
    .notNull()
    .references(() => batches.id, { onDelete: 'cascade' }),
  token: text('token').unique().notNull(),
  reusable: boolean('reusable').default(true).notNull(),
  maxUses: integer('max_uses'), // null = unlimited
  usesCount: integer('uses_count').default(0).notNull(),
  expiresAt: timestamp('expires_at'), // null = never
  createdById: text('created_by_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Relations ─────────────────────────────────────────────────────────────────
// These power the db.query.* relational API (automatic JOINs, nested selects).

export const institutionsRelations = relations(institutions, ({ many }) => ({
  users: many(users),
  batches: many(batches),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [users.institutionId],
    references: [institutions.id],
  }),
  trainedBatches: many(batchTrainers),
  enrolledBatches: many(batchStudents),
  createdSessions: many(sessions),
  attendanceRecords: many(attendance),
  createdInvites: many(batchInvites),
}))

export const batchesRelations = relations(batches, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [batches.institutionId],
    references: [institutions.id],
  }),
  trainers: many(batchTrainers),
  students: many(batchStudents),
  sessions: many(sessions),
  invites: many(batchInvites),
}))

export const batchTrainersRelations = relations(batchTrainers, ({ one }) => ({
  batch: one(batches, { fields: [batchTrainers.batchId], references: [batches.id] }),
  trainer: one(users, { fields: [batchTrainers.trainerId], references: [users.id] }),
}))

export const batchStudentsRelations = relations(batchStudents, ({ one }) => ({
  batch: one(batches, { fields: [batchStudents.batchId], references: [batches.id] }),
  student: one(users, { fields: [batchStudents.studentId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  batch: one(batches, { fields: [sessions.batchId], references: [batches.id] }),
  trainer: one(users, { fields: [sessions.trainerId], references: [users.id] }),
  attendanceRecords: many(attendance),
}))

export const attendanceRelations = relations(attendance, ({ one }) => ({
  session: one(sessions, { fields: [attendance.sessionId], references: [sessions.id] }),
  student: one(users, { fields: [attendance.studentId], references: [users.id] }),
}))

export const batchInvitesRelations = relations(batchInvites, ({ one }) => ({
  batch: one(batches, { fields: [batchInvites.batchId], references: [batches.id] }),
  createdBy: one(users, { fields: [batchInvites.createdById], references: [users.id] }),
}))

// ── Inferred Types ────────────────────────────────────────────────────────────
// These are the TypeScript types for rows returned from the DB.
// Use these instead of hand-writing interface definitions.

export type Institution = typeof institutions.$inferSelect
export type NewInstitution = typeof institutions.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Batch = typeof batches.$inferSelect
export type NewBatch = typeof batches.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert

export type Attendance = typeof attendance.$inferSelect
export type NewAttendance = typeof attendance.$inferInsert

export type BatchInvite = typeof batchInvites.$inferSelect
export type NewBatchInvite = typeof batchInvites.$inferInsert
