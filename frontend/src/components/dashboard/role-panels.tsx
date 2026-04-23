'use client'

import {
  AlertTriangle,
  BarChart3,
  CalendarPlus,
  ClipboardCheck,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TextField, SelectField } from '@/components/ui/field'
import { MetricCard } from '@/components/ui/metric-card'
import { Badge, Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { useApiClient, useApiQuery } from '@/hooks/use-api'
import type {
  ActiveSession,
  AppUser,
  AttendanceRow,
  Batch,
  BatchDetail,
  BatchSummaryRow,
  Institution,
  InstitutionBatchSummary,
  Invite,
  ProgrammeSummary,
  Session,
  TrainerSession,
} from '@/lib/api'

type RolePanelProps = {
  user: AppUser
}

const today = new Date().toISOString().slice(0, 10)

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

function formatRate(value: number | string | null | undefined) {
  return `${Math.round(Number(value ?? 0))}%`
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
      <p className="font-semibold text-zinc-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </div>
  )
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-emerald-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal text-zinc-950">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function LoadingBlock() {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-zinc-200 bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
    </div>
  )
}

function InsightsCard({ recommendations }: { recommendations: string[] }) {
  return (
    <Card className="motion-sheen border-emerald-200 bg-emerald-50">
      <div className="relative flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
        <div>
          <p className="font-semibold text-emerald-950">AI insights</p>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-emerald-900">
            {recommendations.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function ProgrammeOverview({ summary }: { summary: ProgrammeSummary }) {
  const totals = summary.institutions.reduce(
    (acc, institution) => ({
      batches: acc.batches + toNumber(institution.batch_count),
      students: acc.students + toNumber(institution.student_count),
      sessions: acc.sessions + toNumber(institution.session_count),
    }),
    { batches: 0, students: 0, sessions: 0 },
  )

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          detail="Across all institutions"
          icon={<BarChart3 className="h-5 w-5" />}
          label="Attendance"
          value={formatRate(summary.insights.programmeAverage)}
        />
        <MetricCard label="Institutions" value={summary.institutions.length} />
        <MetricCard label="Batches" value={totals.batches} />
        <MetricCard label="Students" value={totals.students} detail={`${totals.sessions} sessions`} />
      </div>

      <InsightsCard recommendations={summary.insights.recommendations} />

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <span>Institution</span>
          <span>Batches</span>
          <span>Students</span>
          <span>Rate</span>
        </div>
        {summary.institutions.map((institution) => (
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0"
            key={institution.institution_id}
          >
            <span className="font-medium text-zinc-900">{institution.institution_name}</span>
            <span className="text-zinc-600">{institution.batch_count}</span>
            <span className="text-zinc-600">{institution.student_count}</span>
            <Badge tone={institution.attendance_rate >= 75 ? 'good' : 'warn'}>
              {formatRate(institution.attendance_rate)}
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  )
}

export function StudentDashboard({ user }: RolePanelProps) {
  const request = useApiClient()
  const batches = useApiQuery<{ batches: Batch[] }>('/api/batches')
  const activeSessions = useApiQuery<{ sessions: ActiveSession[] }>('/api/sessions/active')
  const [joinBatchId, setJoinBatchId] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function joinBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!joinBatchId.trim() || !inviteToken.trim()) return

    setMessage(null)
    setIsSubmitting(true)
    try {
      await request<{ ok: boolean; message: string }>(`/api/batches/${joinBatchId.trim()}/join`, {
        method: 'POST',
        body: JSON.stringify({ token: inviteToken.trim() }),
      })
      setInviteToken('')
      setJoinBatchId('')
      setMessage('Joined batch successfully.')
      void batches.reload()
      void activeSessions.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not join batch.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function markAttendance(sessionId: string, status: 'PRESENT' | 'LATE') {
    setMessage(null)
    try {
      await request('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({ sessionId, status }),
      })
      setMessage(`Marked ${status.toLowerCase()} for this session.`)
      void activeSessions.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not mark attendance.')
    }
  }

  return (
    <DashboardShell title="Student attendance" user={user}>
      <div className="grid gap-8">
        {message ? <Message tone={message.includes('Could not') ? 'danger' : 'good'}>{message}</Message> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="My batches" value={batches.data?.batches.length ?? 0} />
          <MetricCard
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Active sessions"
            value={activeSessions.data?.sessions.length ?? 0}
          />
          <MetricCard label="Status" value="Ready" detail="Attendance opens only during live sessions" />
        </div>

        <section>
          <SectionTitle eyebrow="Now" title="Active sessions" />
          {activeSessions.isLoading ? <LoadingBlock /> : null}
          {!activeSessions.isLoading && activeSessions.data?.sessions.length === 0 ? (
            <EmptyState detail="No enrolled session is active at the current programme time." title="No active session" />
          ) : null}
          <div className="grid gap-3">
            {activeSessions.data?.sessions.map((session) => (
              <Card className="interactive-card" key={session.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-zinc-950">{session.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {session.batch_name} - {session.start_time} to {session.end_time}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void markAttendance(session.id, 'PRESENT')}>
                      Present
                    </Button>
                    <Button variant="secondary" onClick={() => void markAttendance(session.id, 'LATE')}>
                      Late
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <SectionTitle eyebrow="Enrollment" title="Join a batch" />
            <form className="grid gap-4" onSubmit={joinBatch}>
              <TextField
                label="Batch ID"
                onChange={(event) => setJoinBatchId(event.target.value)}
                placeholder="batch_..."
                value={joinBatchId}
              />
              <TextField
                label="Invite token"
                onChange={(event) => setInviteToken(event.target.value)}
                placeholder="Paste trainer invite token"
                value={inviteToken}
              />
              <Button disabled={isSubmitting} icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} type="submit">
                Join batch
              </Button>
            </form>
          </Card>

          <Card className="p-0">
            <div className="border-b border-zinc-100 px-5 py-4">
              <p className="font-semibold text-zinc-950">My batches</p>
            </div>
            {batches.isLoading ? <div className="p-5"><LoadingBlock /></div> : null}
            {batches.data?.batches.map((batch) => (
              <div className="border-b border-zinc-100 px-5 py-4 text-sm last:border-b-0" key={batch.id}>
                <p className="font-medium text-zinc-950">{batch.name}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">{batch.id}</p>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}

export function TrainerDashboard({ user }: RolePanelProps) {
  const request = useApiClient()
  const batches = useApiQuery<{ batches: Batch[] }>('/api/batches')
  const sessions = useApiQuery<{ sessions: TrainerSession[] }>('/api/sessions')
  const [batchName, setBatchName] = useState('')
  const [sessionForm, setSessionForm] = useState({
    batchId: '',
    title: '',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
  })
  const [inviteBatchId, setInviteBatchId] = useState('')
  const [latestInvite, setLatestInvite] = useState<Invite | null>(null)
  const [attendanceSessionId, setAttendanceSessionId] = useState('')
  const attendance = useApiQuery<{ session: Session; attendance: AttendanceRow[] }>(
    attendanceSessionId ? `/api/sessions/${attendanceSessionId}/attendance` : null,
  )
  const [message, setMessage] = useState<string | null>(null)

  const batchOptions = useMemo(
    () => [
      { value: '', label: 'Select batch' },
      ...(batches.data?.batches.map((batch) => ({ value: batch.id, label: batch.name })) ?? []),
    ],
    [batches.data],
  )

  const sessionOptions = useMemo(
    () => [
      { value: '', label: 'Select session' },
      ...(sessions.data?.sessions.map((session) => ({
        value: session.id,
        label: `${session.title} - ${session.batch?.name ?? session.batchId}`,
      })) ?? []),
    ],
    [sessions.data],
  )

  async function createBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!batchName.trim()) return

    setMessage(null)
    try {
      await request('/api/batches', {
        method: 'POST',
        body: JSON.stringify({ name: batchName.trim() }),
      })
      setBatchName('')
      setMessage('Batch created.')
      void batches.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create batch.')
    }
  }

  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionForm.batchId || !sessionForm.title.trim()) return

    setMessage(null)
    try {
      await request('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ ...sessionForm, title: sessionForm.title.trim() }),
      })
      setSessionForm((current) => ({ ...current, title: '' }))
      setMessage('Session created.')
      void sessions.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create session.')
    }
  }

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!inviteBatchId) return

    setMessage(null)
    try {
      const response = await request<{ invite: Invite }>(`/api/batches/${inviteBatchId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ reusable: true }),
      })
      setLatestInvite(response.invite)
      setMessage('Invite generated.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create invite.')
    }
  }

  return (
    <DashboardShell
      actions={
        <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => { void batches.reload(); void sessions.reload() }} variant="secondary">
          Refresh
        </Button>
      }
      title="Trainer workspace"
      user={user}
    >
      <div className="grid gap-8">
        {message ? <Message tone={message.includes('Could not') ? 'danger' : 'good'}>{message}</Message> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Managed batches" value={batches.data?.batches.length ?? 0} />
          <MetricCard label="Sessions" value={sessions.data?.sessions.length ?? 0} />
          <MetricCard
            detail="Reusable student onboarding token"
            icon={<Link2 className="h-5 w-5" />}
            label="Invite mode"
            value="Open"
          />
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card>
            <SectionTitle eyebrow="Batch" title="Create batch" />
            <form className="grid gap-4" onSubmit={createBatch}>
              <TextField
                label="Batch name"
                onChange={(event) => setBatchName(event.target.value)}
                placeholder="Frontend Cohort"
                value={batchName}
              />
              <Button icon={<Plus className="h-4 w-4" />} type="submit">
                Create batch
              </Button>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <SectionTitle eyebrow="Session" title="Create session" />
            <form className="grid gap-4 md:grid-cols-2" onSubmit={createSession}>
              <SelectField
                label="Batch"
                onChange={(event) => setSessionForm((current) => ({ ...current, batchId: event.target.value }))}
                options={batchOptions}
                value={sessionForm.batchId}
              />
              <TextField
                label="Title"
                onChange={(event) => setSessionForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="React fundamentals"
                value={sessionForm.title}
              />
              <TextField
                label="Date"
                onChange={(event) => setSessionForm((current) => ({ ...current, date: event.target.value }))}
                type="date"
                value={sessionForm.date}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Start"
                  onChange={(event) => setSessionForm((current) => ({ ...current, startTime: event.target.value }))}
                  type="time"
                  value={sessionForm.startTime}
                />
                <TextField
                  label="End"
                  onChange={(event) => setSessionForm((current) => ({ ...current, endTime: event.target.value }))}
                  type="time"
                  value={sessionForm.endTime}
                />
              </div>
              <Button className="md:col-span-2" icon={<CalendarPlus className="h-4 w-4" />} type="submit">
                Create session
              </Button>
            </form>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <SectionTitle eyebrow="Invite" title="Generate batch link" />
            <form className="grid gap-4" onSubmit={createInvite}>
              <SelectField
                label="Batch"
                onChange={(event) => setInviteBatchId(event.target.value)}
                options={batchOptions}
                value={inviteBatchId}
              />
              <Button icon={<Link2 className="h-4 w-4" />} type="submit">
                Generate invite
              </Button>
            </form>
            {latestInvite ? (
              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-950">Invite token</p>
                <p className="mt-2 break-all font-mono text-sm text-emerald-900">{latestInvite.token}</p>
              </div>
            ) : null}
          </Card>

          <Card>
            <SectionTitle eyebrow="Attendance" title="Review session marks" />
            <div className="grid gap-4">
              <SelectField
                label="Session"
                onChange={(event) => setAttendanceSessionId(event.target.value)}
                options={sessionOptions}
                value={attendanceSessionId}
              />
              {attendance.isLoading ? <LoadingBlock /> : null}
              {attendance.data?.attendance.map((row) => (
                <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-100 py-3 text-sm last:border-b-0" key={row.student_id}>
                  <div>
                    <p className="font-medium text-zinc-950">{row.student_name}</p>
                    <p className="text-zinc-500">{row.email ?? 'No email'}</p>
                  </div>
                  <Badge tone={row.status === 'ABSENT' ? 'warn' : 'good'}>{row.status}</Badge>
                </div>
              ))}
              {attendanceSessionId && attendance.data?.attendance.length === 0 ? (
                <EmptyState detail="No enrolled students were found for this session." title="No attendance rows" />
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}

export function InstitutionDashboard({ user }: RolePanelProps) {
  const batches = useApiQuery<{ batches: Batch[] }>('/api/batches')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const summary = useApiQuery<{ batch: Batch; summary: BatchSummaryRow[] }>(
    selectedBatchId ? `/api/batches/${selectedBatchId}/summary` : null,
  )
  const details = useApiQuery<{ batch: BatchDetail }>(
    selectedBatchId ? `/api/batches/${selectedBatchId}` : null,
  )

  const batchOptions = useMemo(
    () => [
      { value: '', label: 'Select batch' },
      ...(batches.data?.batches.map((batch) => ({ value: batch.id, label: batch.name })) ?? []),
    ],
    [batches.data],
  )

  return (
    <DashboardShell title="Institution overview" user={user}>
      <div className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Batches" value={batches.data?.batches.length ?? 0} />
          <MetricCard label="Trainers" value={details.data?.batch.trainers?.length ?? 0} />
          <MetricCard label="Students" value={details.data?.batch.students?.length ?? 0} />
        </div>

        <Card>
          <SectionTitle eyebrow="Batch" title="Attendance summary" />
          <SelectField
            label="Batch"
            onChange={(event) => setSelectedBatchId(event.target.value)}
            options={batchOptions}
            value={selectedBatchId}
          />
        </Card>

        {summary.isLoading || details.isLoading ? <LoadingBlock /> : null}
        {selectedBatchId && summary.error ? <Message tone="danger">{summary.error}</Message> : null}
        {selectedBatchId && details.data ? (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="p-0">
              <div className="border-b border-zinc-100 px-5 py-4">
                <p className="font-semibold text-zinc-950">{details.data.batch.name}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">{details.data.batch.id}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm font-semibold text-zinc-950">Trainers</p>
                <div className="mt-3 grid gap-2">
                  {details.data.batch.trainers?.map(({ trainer }) => (
                    <p className="text-sm text-zinc-600" key={trainer.id}>{trainer.name}</p>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-0">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>Student</span>
                <span>Marked</span>
                <span>Present</span>
                <span>Late</span>
              </div>
              {summary.data?.summary.map((row) => (
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0" key={`${row.student_name}-${row.email}`}>
                  <span className="font-medium text-zinc-950">{row.student_name}</span>
                  <span className="text-zinc-600">{row.marked_sessions}</span>
                  <span className="text-zinc-600">{row.present_count}</span>
                  <span className="text-zinc-600">{row.late_count}</span>
                </div>
              ))}
            </Card>
          </div>
        ) : (
          <EmptyState detail="Choose a batch to inspect trainers, students, and attendance." title="Select a batch" />
        )}
      </div>
    </DashboardShell>
  )
}

export function ProgrammeManagerDashboard({ user }: RolePanelProps) {
  const request = useApiClient()
  const summary = useApiQuery<ProgrammeSummary>('/api/programme/summary')
  const institutions = useApiQuery<{ institutions: Institution[] }>('/api/institutions')
  const [institutionName, setInstitutionName] = useState('')
  const [region, setRegion] = useState('')
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('')
  const institutionSummary = useApiQuery<{ institution: Institution; batches: InstitutionBatchSummary[] }>(
    selectedInstitutionId ? `/api/institutions/${selectedInstitutionId}/summary` : null,
  )
  const [message, setMessage] = useState<string | null>(null)

  async function createInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!institutionName.trim()) return

    setMessage(null)
    try {
      await request('/api/institutions', {
        method: 'POST',
        body: JSON.stringify({ name: institutionName.trim(), region: region.trim() || undefined }),
      })
      setInstitutionName('')
      setRegion('')
      setMessage('Institution created.')
      void institutions.reload()
      void summary.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create institution.')
    }
  }

  const institutionOptions = useMemo(
    () => [
      { value: '', label: 'Select institution' },
      ...(institutions.data?.institutions.map((institution) => ({
        value: institution.id,
        label: institution.name,
      })) ?? []),
    ],
    [institutions.data],
  )

  return (
    <DashboardShell title="Programme command center" user={user}>
      <div className="grid gap-8">
        {message ? <Message tone={message.includes('Could not') ? 'danger' : 'good'}>{message}</Message> : null}
        {summary.isLoading ? <LoadingBlock /> : null}
        {summary.data ? <ProgrammeOverview summary={summary.data} /> : null}
        {summary.error ? <Message tone="danger">{summary.error}</Message> : null}

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <SectionTitle eyebrow="Institution" title="Add institution" />
            <form className="grid gap-4" onSubmit={createInstitution}>
              <TextField
                label="Name"
                onChange={(event) => setInstitutionName(event.target.value)}
                placeholder="Green Valley Institute"
                value={institutionName}
              />
              <TextField
                label="Region"
                onChange={(event) => setRegion(event.target.value)}
                placeholder="Central"
                value={region}
              />
              <Button icon={<Plus className="h-4 w-4" />} type="submit">
                Create institution
              </Button>
            </form>
          </Card>

          <Card>
            <SectionTitle eyebrow="Breakdown" title="Institution batches" />
            <SelectField
              label="Institution"
              onChange={(event) => setSelectedInstitutionId(event.target.value)}
              options={institutionOptions}
              value={selectedInstitutionId}
            />
            <div className="mt-5 grid gap-3">
              {institutionSummary.data?.batches.map((batch) => (
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-zinc-100 py-3 text-sm last:border-b-0" key={batch.batch_id}>
                  <span className="font-medium text-zinc-950">{batch.batch_name}</span>
                  <span className="text-zinc-600">{batch.student_count} students</span>
                  <Badge tone={batch.attendance_rate >= 75 ? 'good' : 'warn'}>
                    {formatRate(batch.attendance_rate)}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}

export function MonitoringDashboard({ user }: RolePanelProps) {
  const summary = useApiQuery<ProgrammeSummary>('/api/programme/summary')
  const institutions = useApiQuery<{ institutions: Institution[] }>('/api/institutions')
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('')
  const institutionSummary = useApiQuery<{ institution: Institution; batches: InstitutionBatchSummary[] }>(
    selectedInstitutionId ? `/api/institutions/${selectedInstitutionId}/summary` : null,
  )

  const institutionOptions = useMemo(
    () => [
      { value: '', label: 'Select institution' },
      ...(institutions.data?.institutions.map((institution) => ({
        value: institution.id,
        label: institution.name,
      })) ?? []),
    ],
    [institutions.data],
  )

  return (
    <DashboardShell title="Monitoring view" user={user}>
      <div className="grid gap-8">
        <Message tone="warn">
          Monitoring Officer access is read-only. This dashboard has no create, edit, or delete actions.
        </Message>
        {summary.isLoading ? <LoadingBlock /> : null}
        {summary.data ? <ProgrammeOverview summary={summary.data} /> : null}
        {summary.error ? <Message tone="danger">{summary.error}</Message> : null}

        <Card>
          <SectionTitle eyebrow="Read-only" title="Institution detail" />
          <SelectField
            label="Institution"
            onChange={(event) => setSelectedInstitutionId(event.target.value)}
            options={institutionOptions}
            value={selectedInstitutionId}
          />
          <div className="mt-5 grid gap-3">
            {institutionSummary.data?.batches.map((batch) => (
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-zinc-100 py-3 text-sm last:border-b-0" key={batch.batch_id}>
                <span className="font-medium text-zinc-950">{batch.batch_name}</span>
                <span className="text-zinc-600">{batch.session_count} sessions</span>
                <Badge tone={batch.attendance_rate >= 75 ? 'good' : 'warn'}>
                  {formatRate(batch.attendance_rate)}
                </Badge>
              </div>
            ))}
            {selectedInstitutionId && institutionSummary.data?.batches.length === 0 ? (
              <EmptyState detail="This institution has no batches yet." title="No batches" />
            ) : null}
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}

export function DashboardProblem({ user }: RolePanelProps) {
  return (
    <DashboardShell title="Workspace unavailable" user={user}>
      <Message tone="danger">
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          This role is not mapped to a dashboard.
        </span>
      </Message>
    </DashboardShell>
  )
}
