import { createClerkClient } from '@clerk/backend'
import { inArray, or } from 'drizzle-orm'
import { db, sqlClient } from './client.js'
import * as schema from './schema.js'
import { env } from '../lib/env.js'
import { getProgrammeDateTime } from '../lib/time.js'

const password = process.env.TEST_ACCOUNT_PASSWORD ?? 'SkillBridge@2026!'

const institutionId = 'inst_demo_state_polytechnic'
const batchId = 'batch_test_frontend_accounts'
const activeSessionId = 'session_test_active_accounts'
const completedSessionId = 'session_test_completed_accounts'

const accounts = [
  {
    id: 'user_demo_student',
    email: 'student.skillbridge2026@gmail.com',
    firstName: 'Student',
    lastName: 'Demo',
    role: 'STUDENT' as const,
    institutionId: null,
  },
  {
    id: 'user_demo_trainer',
    email: 'trainer.skillbridge2026@gmail.com',
    firstName: 'Trainer',
    lastName: 'Demo',
    role: 'TRAINER' as const,
    institutionId,
  },
  {
    id: 'user_demo_institution',
    email: 'institution.skillbridge2026@gmail.com',
    firstName: 'Institution',
    lastName: 'Demo',
    role: 'INSTITUTION' as const,
    institutionId,
  },
  {
    id: 'user_demo_manager',
    email: 'manager.skillbridge2026@gmail.com',
    firstName: 'Programme',
    lastName: 'Manager',
    role: 'PROGRAMME_MANAGER' as const,
    institutionId: null,
  },
  {
    id: 'user_demo_monitor',
    email: 'monitor.skillbridge2026@gmail.com',
    firstName: 'Monitoring',
    lastName: 'Officer',
    role: 'MONITORING_OFFICER' as const,
    institutionId: null,
  },
]

const legacyEmails = [
  'student+clerk_test@example.com',
  'trainer+clerk_test@example.com',
  'institution+clerk_test@example.com',
  'manager+clerk_test@example.com',
  'monitor+clerk_test@example.com',
]

async function upsertClerkUser(account: (typeof accounts)[number]) {
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
  const existing = await clerk.users.getUserList({ emailAddress: [account.email], limit: 1 })
  const user = existing.data[0]

  const clerkUser = user
    ? await clerk.users.updateUser(user.id, {
        firstName: account.firstName,
        lastName: account.lastName,
        password,
        skipPasswordChecks: true,
        unsafeMetadata: { role: account.role, selectedRole: account.role },
      })
    : await clerk.users.createUser({
        emailAddress: [account.email],
        firstName: account.firstName,
        lastName: account.lastName,
        password,
        skipPasswordChecks: true,
        skipLegalChecks: true,
        legalAcceptedAt: new Date(),
        unsafeMetadata: { role: account.role, selectedRole: account.role },
      })

  const primaryEmail = clerkUser.emailAddresses.find(
    (emailAddress) => emailAddress.emailAddress === account.email,
  )

  if (primaryEmail) {
    await clerk.emailAddresses.updateEmailAddress(primaryEmail.id, {
      verified: true,
      primary: true,
    })
  }

  return clerkUser
}

async function main() {
  console.log('Creating Clerk demo accounts...')

  const clerkUsers = []
  for (const account of accounts) {
    const clerkUser = await upsertClerkUser(account)
    clerkUsers.push({ account, clerkUser })
    console.log(`  ${account.role.padEnd(18)} ${account.email}`)
  }

  await db
    .insert(schema.institutions)
    .values({
      id: institutionId,
      name: 'State Polytechnic Institute',
      region: 'North',
    })
    .onConflictDoUpdate({
      target: schema.institutions.id,
      set: {
        name: 'State Polytechnic Institute',
        region: 'North',
      },
    })

  const emails = [...accounts.map((account) => account.email), ...legacyEmails]
  const ids = accounts.map((account) => account.id)
  await db
    .delete(schema.users)
    .where(or(inArray(schema.users.email, emails), inArray(schema.users.id, ids)))

  await db.insert(schema.users).values(
    clerkUsers.map(({ account, clerkUser }) => ({
      id: account.id,
      clerkUserId: clerkUser.id,
      name: `${account.firstName} ${account.lastName}`,
      email: account.email,
      role: account.role,
      institutionId: account.institutionId,
    })),
  )

  await db
    .insert(schema.batches)
    .values({
      id: batchId,
      name: 'Frontend Test Account Cohort',
      institutionId,
    })
    .onConflictDoUpdate({
      target: schema.batches.id,
      set: { name: 'Frontend Test Account Cohort', institutionId },
    })

  await db
    .insert(schema.batchTrainers)
    .values({
      batchId,
      trainerId: 'user_demo_trainer',
    })
    .onConflictDoNothing()

  await db
    .insert(schema.batchStudents)
    .values({
      batchId,
      studentId: 'user_demo_student',
    })
    .onConflictDoNothing()

  const today = getProgrammeDateTime(env.PROGRAMME_TIME_ZONE).date
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  await db
    .insert(schema.sessions)
    .values({
      id: activeSessionId,
      batchId,
      trainerId: 'user_demo_trainer',
      title: 'Frontend Test Active Session',
      date: today,
      startTime: '00:00',
      endTime: '23:59',
    })
    .onConflictDoUpdate({
      target: schema.sessions.id,
      set: {
        title: 'Frontend Test Active Session',
        date: today,
        startTime: '00:00',
        endTime: '23:59',
      },
    })

  await db
    .insert(schema.sessions)
    .values({
      id: completedSessionId,
      batchId,
      trainerId: 'user_demo_trainer',
      title: 'Completed Attendance Review',
      date: yesterday,
      startTime: '10:00',
      endTime: '11:00',
    })
    .onConflictDoUpdate({
      target: schema.sessions.id,
      set: {
        title: 'Completed Attendance Review',
        date: yesterday,
        startTime: '10:00',
        endTime: '11:00',
      },
    })

  await db
    .insert(schema.attendance)
    .values({
      id: 'attendance_test_completed_student',
      sessionId: completedSessionId,
      studentId: 'user_demo_student',
      status: 'PRESENT',
    })
    .onConflictDoUpdate({
      target: [schema.attendance.sessionId, schema.attendance.studentId],
      set: { status: 'PRESENT' },
    })

  await db
    .insert(schema.batchInvites)
    .values({
      id: 'invite_test_accounts_reusable',
      batchId,
      token: 'skillbridge-demo',
      reusable: true,
      maxUses: 50,
      usesCount: 0,
      createdById: 'user_demo_trainer',
    })
    .onConflictDoUpdate({
      target: schema.batchInvites.token,
      set: {
        batchId,
        reusable: true,
        maxUses: 50,
        createdById: 'user_demo_trainer',
      },
    })

  console.log('')
  console.log('Demo account password:')
  console.log(`  ${password}`)
  console.log('')
  console.log('Seeded data:')
  console.log(`  Institution: ${institutionId}`)
  console.log(`  Batch      : ${batchId}`)
  console.log(`  Invite     : skillbridge-demo`)
  console.log(`  Active     : ${activeSessionId}`)
  console.log(`  Completed  : ${completedSessionId}`)
  console.log('')
  console.log('Done. Demo accounts are ready for the deployed frontend.')
}

main()
  .catch((error) => {
    console.error('Failed to create demo accounts:')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sqlClient.end()
  })
