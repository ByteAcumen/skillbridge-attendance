import type { Role } from './roles'

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export type Institution = {
  id: string
  name: string
  region: string | null
}

export type AppUser = {
  id: string
  clerkUserId: string
  name: string
  email: string | null
  role: Role
  institutionId: string | null
  institution?: Institution | null
}

export type Batch = {
  id: string
  name: string
  institutionId: string
  createdAt: string
  institution?: Institution | null
}

export type BatchMember = {
  id: string
  name: string
  email: string | null
}

export type BatchDetail = Batch & {
  trainers?: Array<{ trainerId: string; trainer: BatchMember }>
  students?: Array<{ studentId: string; student: BatchMember }>
}

export type Session = {
  id: string
  batchId: string
  trainerId: string
  title: string
  date: string
  startTime: string
  endTime: string
  createdAt?: string
}

export type TrainerSession = Session & {
  batch?: {
    id: string
    name: string
    institutionId?: string
    institution?: Institution | null
  }
}

export type ActiveSession = {
  id: string
  title: string
  date: string
  start_time: string
  end_time: string
  batch_id: string
  batch_name: string
  institution_id?: string
  institution_name?: string
}

export type Invite = {
  id: string
  batchId: string
  token: string
  reusable: boolean
  maxUses: number | null
  usesCount: number
  expiresAt: string | null
}

export type ProgrammeInstitution = {
  institution_id: string
  institution_name: string
  batch_count: number
  student_count: number
  session_count: number
  total_possible: number
  marked_count: number
  present_count: number
  late_count: number
  attendance_rate: number
}

export type ProgrammeSummary = {
  institutions: ProgrammeInstitution[]
  insights: {
    programmeAverage: number
    recommendations: string[]
  }
}

export type AttendanceRow = {
  student_id: string
  student_name: string
  email: string | null
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  marked_at: string | null
}

export type BatchSummaryRow = {
  student_name: string
  email: string | null
  marked_sessions: number | string
  present_count: number | string
  late_count: number | string
}

export type InstitutionBatchSummary = {
  batch_id: string
  batch_name: string
  student_count: number
  session_count: number
  total_possible: number
  marked_count: number
  present_count: number
  late_count: number
  attendance_rate: number
}

type ApiOptions = RequestInit & {
  token?: string | null
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}) {
  const { token, headers, ...init } = options
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `Request failed with ${response.status}`

    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}
