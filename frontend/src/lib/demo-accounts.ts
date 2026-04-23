import type { Role } from './roles'

export const demoPassword = 'SkillBridge@2026!'
export const demoVerificationCode = '424242'

export type DemoAccount = {
  role: Role
  name: string
  email: string
  dataHint: string
}

export const demoAccounts: Record<Role, DemoAccount> = {
  STUDENT: {
    role: 'STUDENT',
    name: 'Student Demo',
    email: 'student+clerk_test@skillbridge.dev',
    dataHint: 'Enrolled in the Frontend Test Account Cohort with one active session.',
  },
  TRAINER: {
    role: 'TRAINER',
    name: 'Trainer Demo',
    email: 'trainer+clerk_test@skillbridge.dev',
    dataHint: 'Owns the demo cohort, can create sessions, and can issue invite links.',
  },
  INSTITUTION: {
    role: 'INSTITUTION',
    name: 'Institution Demo',
    email: 'institution+clerk_test@skillbridge.dev',
    dataHint: 'Scoped to State Polytechnic Institute with seeded batch summaries.',
  },
  PROGRAMME_MANAGER: {
    role: 'PROGRAMME_MANAGER',
    name: 'Programme Manager Demo',
    email: 'manager+clerk_test@skillbridge.dev',
    dataHint: 'Can review programme-wide and institution-level attendance summaries.',
  },
  MONITORING_OFFICER: {
    role: 'MONITORING_OFFICER',
    name: 'Monitoring Officer Demo',
    email: 'monitor+clerk_test@skillbridge.dev',
    dataHint: 'Read-only access to programme and institution dashboards.',
  },
}
