import { db, sqlClient } from './client.js'
import * as schema from './schema.js'

async function seed() {
  console.log('Starting database seed...')

  const [institution] = await db
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
    .returning()

  const demoUsers = [
    {
      id: 'user_demo_student',
      clerkUserId: 'user_seed_student',
      name: 'Alice Student',
      email: 'student@skillbridge.test',
      role: 'STUDENT' as const,
      institutionId: null,
    },
    {
      id: 'user_demo_trainer',
      clerkUserId: 'user_seed_trainer',
      name: 'Bob Trainer',
      email: 'trainer@skillbridge.test',
      role: 'TRAINER' as const,
      institutionId: institution.id,
    },
    {
      id: 'user_demo_institution',
      clerkUserId: 'user_seed_institution',
      name: 'Carol Admin',
      email: 'institution@skillbridge.test',
      role: 'INSTITUTION' as const,
      institutionId: institution.id,
    },
    {
      id: 'user_demo_manager',
      clerkUserId: 'user_seed_manager',
      name: 'Dave Manager',
      email: 'manager@skillbridge.test',
      role: 'PROGRAMME_MANAGER' as const,
      institutionId: null,
    },
    {
      id: 'user_demo_monitor',
      clerkUserId: 'user_seed_monitor',
      name: 'Eve Monitor',
      email: 'monitor@skillbridge.test',
      role: 'MONITORING_OFFICER' as const,
      institutionId: null,
    },
  ]

  for (const user of demoUsers) {
    await db
      .insert(schema.users)
      .values(user)
      .onConflictDoUpdate({
        target: schema.users.id,
        set: {
          clerkUserId: user.clerkUserId,
          name: user.name,
          email: user.email,
          role: user.role,
          institutionId: user.institutionId,
        },
      })
  }

  const [batch] = await db
    .insert(schema.batches)
    .values({
      id: 'batch_demo_frontend_1',
      name: 'Frontend Engineering Cohort 1',
      institutionId: institution.id,
    })
    .onConflictDoUpdate({
      target: schema.batches.id,
      set: {
        name: 'Frontend Engineering Cohort 1',
        institutionId: institution.id,
      },
    })
    .returning()

  await db
    .insert(schema.batchTrainers)
    .values({ batchId: batch.id, trainerId: 'user_demo_trainer' })
    .onConflictDoNothing()

  await db
    .insert(schema.batchStudents)
    .values({ batchId: batch.id, studentId: 'user_demo_student' })
    .onConflictDoNothing()

  const todayDate = new Date().toISOString().split('T')[0]

  await db
    .insert(schema.sessions)
    .values({
      id: 'session_demo_active_react',
      batchId: batch.id,
      trainerId: 'user_demo_trainer',
      title: 'Intro to React',
      date: todayDate,
      startTime: '00:00',
      endTime: '23:59',
    })
    .onConflictDoUpdate({
      target: schema.sessions.id,
      set: {
        title: 'Intro to React',
        date: todayDate,
        startTime: '00:00',
        endTime: '23:59',
      },
    })

  console.log('Seed complete.')
}

seed()
  .catch((error) => {
    console.error('Seeding failed:')
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sqlClient.end()
  })
