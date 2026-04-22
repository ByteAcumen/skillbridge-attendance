import { createClerkClient } from '@clerk/backend'
import { inArray } from 'drizzle-orm'
import { db, sqlClient } from './client.js'
import * as schema from './schema.js'
import { env } from '../lib/env.js'

const password = process.env.TEST_ACCOUNT_PASSWORD ?? 'SkillBridge@2026!'

const accounts = [
  {
    email: 'student+clerk_test@example.com',
    firstName: 'Student',
    lastName: 'Demo',
    role: 'STUDENT' as const,
    institutionId: null,
  },
  {
    email: 'trainer+clerk_test@example.com',
    firstName: 'Trainer',
    lastName: 'Demo',
    role: 'TRAINER' as const,
    institutionId: 'inst_demo_state_polytechnic',
  },
  {
    email: 'institution+clerk_test@example.com',
    firstName: 'Institution',
    lastName: 'Demo',
    role: 'INSTITUTION' as const,
    institutionId: 'inst_demo_state_polytechnic',
  },
  {
    email: 'manager+clerk_test@example.com',
    firstName: 'Manager',
    lastName: 'Demo',
    role: 'PROGRAMME_MANAGER' as const,
    institutionId: null,
  },
  {
    email: 'monitor+clerk_test@example.com',
    firstName: 'Monitor',
    lastName: 'Demo',
    role: 'MONITORING_OFFICER' as const,
    institutionId: null,
  },
]

async function upsertClerkUser(account: (typeof accounts)[number]) {
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
  const existing = await clerk.users.getUserList({ emailAddress: [account.email], limit: 1 })
  const user = existing.data[0]

  if (user) {
    return clerk.users.updateUser(user.id, {
      firstName: account.firstName,
      lastName: account.lastName,
      password,
      skipPasswordChecks: true,
      signOutOfOtherSessions: true,
      unsafeMetadata: { role: account.role },
    })
  }

  return clerk.users.createUser({
    emailAddress: [account.email],
    firstName: account.firstName,
    lastName: account.lastName,
    password,
    skipPasswordChecks: true,
    skipLegalChecks: true,
    legalAcceptedAt: new Date(),
    unsafeMetadata: { role: account.role },
  })
}

async function main() {
  console.log('Creating Clerk test accounts...')

  const clerkUsers = []
  for (const account of accounts) {
    const clerkUser = await upsertClerkUser(account)
    clerkUsers.push({ account, clerkUser })
    console.log(`  ${account.role.padEnd(18)} ${account.email}`)
  }

  await db
    .insert(schema.institutions)
    .values({
      id: 'inst_demo_state_polytechnic',
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

  const emails = accounts.map((account) => account.email)
  await db.delete(schema.users).where(inArray(schema.users.email, emails))

  await db.insert(schema.users).values(
    clerkUsers.map(({ account, clerkUser }) => ({
      clerkUserId: clerkUser.id,
      name: `${account.firstName} ${account.lastName}`,
      email: account.email,
      role: account.role,
      institutionId: account.institutionId,
    })),
  )

  const trainer = clerkUsers.find(({ account }) => account.role === 'TRAINER')!
  const student = clerkUsers.find(({ account }) => account.role === 'STUDENT')!

  const [trainerUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(inArray(schema.users.email, [trainer.account.email]))

  const [studentUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(inArray(schema.users.email, [student.account.email]))

  await db
    .insert(schema.batches)
    .values({
      id: 'batch_test_frontend_accounts',
      name: 'Frontend Test Account Cohort',
      institutionId: 'inst_demo_state_polytechnic',
    })
    .onConflictDoUpdate({
      target: schema.batches.id,
      set: { name: 'Frontend Test Account Cohort' },
    })

  await db
    .insert(schema.batchTrainers)
    .values({
      batchId: 'batch_test_frontend_accounts',
      trainerId: trainerUser.id,
    })
    .onConflictDoNothing()

  await db
    .insert(schema.batchStudents)
    .values({
      batchId: 'batch_test_frontend_accounts',
      studentId: studentUser.id,
    })
    .onConflictDoNothing()

  await db
    .insert(schema.sessions)
    .values({
      id: 'session_test_active_accounts',
      batchId: 'batch_test_frontend_accounts',
      trainerId: trainerUser.id,
      title: 'Frontend Test Active Session',
      date: new Date().toISOString().slice(0, 10),
      startTime: '00:00',
      endTime: '23:59',
    })
    .onConflictDoUpdate({
      target: schema.sessions.id,
      set: {
        date: new Date().toISOString().slice(0, 10),
        startTime: '00:00',
        endTime: '23:59',
      },
    })

  console.log('')
  console.log('Test account password:')
  console.log(`  ${password}`)
  console.log('')
  console.log('Done. These accounts are ready for the frontend login flow.')
}

main()
  .catch((error) => {
    console.error('Failed to create test accounts:')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sqlClient.end()
  })
