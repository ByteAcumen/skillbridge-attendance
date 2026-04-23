import {
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  Landmark,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export type Role =
  | 'STUDENT'
  | 'TRAINER'
  | 'INSTITUTION'
  | 'PROGRAMME_MANAGER'
  | 'MONITORING_OFFICER'

export type RoleOption = {
  value: Role
  slug: string
  label: string
  description: string
  icon: LucideIcon
}

export const roleOptions: RoleOption[] = [
  {
    value: 'STUDENT',
    slug: 'student',
    label: 'Student',
    description: 'Join batches, view active sessions, and mark attendance.',
    icon: GraduationCap,
  },
  {
    value: 'TRAINER',
    slug: 'trainer',
    label: 'Trainer',
    description: 'Create batches, sessions, invite links, and review attendance.',
    icon: BookOpenCheck,
  },
  {
    value: 'INSTITUTION',
    slug: 'institution',
    label: 'Institution',
    description: 'Track batches and attendance summaries for one institution.',
    icon: Landmark,
  },
  {
    value: 'PROGRAMME_MANAGER',
    slug: 'programme-manager',
    label: 'Programme Manager',
    description: 'Review programme-wide and institution-level performance.',
    icon: BarChart3,
  },
  {
    value: 'MONITORING_OFFICER',
    slug: 'monitoring-officer',
    label: 'Monitoring Officer',
    description: 'Read-only oversight across the programme.',
    icon: ShieldCheck,
  },
]

export const roleLabel: Record<Role, string> = Object.fromEntries(
  roleOptions.map((role) => [role.value, role.label]),
) as Record<Role, string>

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && roleOptions.some((role) => role.value === value)
}

export function roleFromSlug(value: unknown) {
  if (typeof value !== 'string') return null

  return roleOptions.find((role) => role.slug === value || role.value === value) ?? null
}

export function getRoleOption(role: Role) {
  return roleOptions.find((option) => option.value === role) ?? roleOptions[0]
}
