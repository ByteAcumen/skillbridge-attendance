'use client'

import {
  Building2,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Link2,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SelectField, TextField } from '@/components/ui/field'
import { MetricCard } from '@/components/ui/metric-card'
import { Message } from '@/components/ui/status'
import { Modal } from '@/components/ui/modal'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import {
  ContextGrid,
  DataSyncBanner,
  EmptyState,
  LoadingBlock,
  SectionTitle,
  SessionMeta,
  WorkflowSteps,
  shortId,
} from '@/components/dashboard/shared'
import { useApiClient, useApiQuery } from '@/hooks/use-api'
import type { AppUser, AttendanceRow, Batch, Invite, Session, TrainerSession } from '@/lib/api'
import { cn } from '@/lib/utils'

type RolePanelProps = { user: AppUser }

const today = new Date().toISOString().slice(0, 10)

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
  const firstBatchId = batches.data?.batches[0]?.id ?? ''
  const firstSessionId = sessions.data?.sessions[0]?.id ?? ''
  const effectiveSessionBatchId = sessionForm.batchId || firstBatchId
  const effectiveInviteBatchId = inviteBatchId || firstBatchId
  const effectiveAttendanceSessionId = attendanceSessionId || firstSessionId
  const attendance = useApiQuery<{ session: Session; attendance: AttendanceRow[] }>(
    effectiveAttendanceSessionId ? `/api/sessions/${effectiveAttendanceSessionId}/attendance` : null,
  )
  const [message, setMessage] = useState<string | null>(null)

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const sessionCountByBatch = useMemo(() => {
    const counts = new Map<string, number>()
    sessions.data?.sessions.forEach((session) => {
      counts.set(session.batchId, (counts.get(session.batchId) ?? 0) + 1)
    })
    return counts
  }, [sessions.data])

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
      setIsBatchModalOpen(false)
      setMessage('Batch created successfully.')
      void batches.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create batch.')
    }
  }

  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!effectiveSessionBatchId || !sessionForm.title.trim()) return

    setMessage(null)
    try {
      await request('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          ...sessionForm,
          batchId: effectiveSessionBatchId,
          title: sessionForm.title.trim(),
        }),
      })
      setSessionForm((current) => ({ ...current, title: '' }))
      setIsSessionModalOpen(false)
      setMessage('Session created successfully.')
      void sessions.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create session.')
    }
  }

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!effectiveInviteBatchId) return

    setMessage(null)
    try {
      const response = await request<{ invite: Invite }>(`/api/batches/${effectiveInviteBatchId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ reusable: true }),
      })
      setLatestInvite(response.invite)
      setMessage('Invite generated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create invite.')
    }
  }

  async function overrideAttendance(studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    setMessage(null)
    try {
      await request('/api/attendance/override', {
        method: 'POST',
        body: JSON.stringify({ sessionId: effectiveAttendanceSessionId, studentId, status }),
      })
      void attendance.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not override attendance.')
    }
  }

  return (
    <DashboardShell
      actions={
        <Button icon={<RefreshCw className="h-4 w-4" />} onClick={() => { void batches.reload(); void sessions.reload(); void attendance.reload() }} variant="secondary">
          Refresh
        </Button>
      }
      title="Trainer workspace"
      user={user}
    >
      <div className="dashboard-flow grid gap-8">
        {message ? <Message tone={message.includes('Could not') ? 'danger' : 'good'}>{message}</Message> : null}

        <DataSyncBanner
          detail="Managed batches, session timeline, invite generation, and attendance rows are all pulled from the API."
          error={batches.error ?? sessions.error ?? attendance.error}
          isLoading={batches.isLoading || sessions.isLoading || attendance.isLoading}
          label="Trainer workspace sync"
        />

        <WorkflowSteps
          steps={[
            {
              label: 'Batch roster',
              detail: `${batches.data?.batches.length ?? 0} managed`,
              state: batches.data?.batches.length ? 'complete' : 'active',
            },
            {
              label: 'Schedule',
              detail: `${sessions.data?.sessions.length ?? 0} sessions`,
              state: sessions.data?.sessions.length ? 'complete' : 'waiting',
            },
            {
              label: 'Invite',
              detail: latestInvite ? 'Token generated' : 'Ready for selected batch',
              state: latestInvite ? 'complete' : effectiveInviteBatchId ? 'active' : 'waiting',
            },
            {
              label: 'Attendance',
              detail: effectiveAttendanceSessionId ? 'Review roster marks' : 'Select a session',
              state: effectiveAttendanceSessionId ? 'active' : 'waiting',
            },
          ]}
        />

        <ContextGrid
          items={[
            {
              label: 'Institution',
              value: user.institution?.name ?? batches.data?.batches[0]?.institution?.name ?? 'Institution pending',
              detail: user.institution?.region ? `${user.institution.region} region` : 'Trainer batches are scoped here',
              icon: <Building2 className="h-5 w-5" />,
            },
            {
              label: 'Teaching load',
              value: `${sessions.data?.sessions.length ?? 0} sessions`,
              detail: `${batches.data?.batches.length ?? 0} managed batches`,
              icon: <CalendarPlus className="h-5 w-5" />,
            },
            {
              label: 'Invite workflow',
              value: latestInvite ? 'Invite ready' : 'Generate when needed',
              detail: 'Share batch ID plus invite token with students',
              icon: <Link2 className="h-5 w-5" />,
            },
          ]}
        />

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

        <section className="flex flex-col sm:flex-row gap-4">
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsBatchModalOpen(true)}>
            Create New Batch
          </Button>
          <Button icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setIsSessionModalOpen(true)} variant="secondary">
            Schedule Session
          </Button>
        </section>

        <section>
          <SectionTitle eyebrow="Batches" title="Managed batch roster" />
          {batches.isLoading ? <LoadingBlock /> : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {batches.data?.batches.map((batch) => (
              <Card className="interactive-card" key={batch.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-950">{batch.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {batch.institution?.name ?? user.institution?.name ?? 'Institution unavailable'}
                    </p>
                  </div>
                  <GraduationCap className="h-5 w-5 shrink-0 text-emerald-700" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-600">
                    {shortId(batch.id)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    {sessionCountByBatch.get(batch.id) ?? 0} sessions
                  </span>
                </div>
              </Card>
            ))}
          </div>
          {!batches.isLoading && batches.data?.batches.length === 0 ? (
            <EmptyState detail="Create a batch before scheduling sessions or inviting students." title="No managed batches" />
          ) : null}
        </section>

        <section>
          <SectionTitle eyebrow="Schedule" title="Session timeline" />
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {sessions.data?.sessions.slice(0, 6).map((session) => (
                <div className="grid gap-3 px-5 py-4 hover:bg-zinc-50 md:grid-cols-[1fr_auto]" key={session.id}>
                  <div>
                    <p className="font-medium text-zinc-950">{session.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {session.batch?.name ?? session.batchId} - {session.batch?.institution?.name ?? 'Institution unavailable'}
                    </p>
                  </div>
                  <SessionMeta date={session.date} start={session.startTime} end={session.endTime} />
                </div>
              ))}
              {!sessions.isLoading && sessions.data?.sessions.length === 0 ? (
                <div className="p-6 text-center text-sm text-zinc-500">No sessions scheduled yet.</div>
              ) : null}
            </div>
          </Card>
        </section>

        <Modal isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} title="Create New Batch">
          <form className="grid gap-4" onSubmit={createBatch}>
            <TextField
              label="Batch name"
              onChange={(event) => setBatchName(event.target.value)}
              placeholder="e.g. Frontend Cohort 1"
              value={batchName}
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsBatchModalOpen(false)}>Cancel</Button>
              <Button icon={<Plus className="h-4 w-4" />} type="submit">Create batch</Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isSessionModalOpen} onClose={() => setIsSessionModalOpen(false)} title="Schedule Session">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={createSession}>
            <SelectField
              label="Batch"
              onChange={(event) => setSessionForm((current) => ({ ...current, batchId: event.target.value }))}
              options={batchOptions}
              value={effectiveSessionBatchId}
            />
            <TextField
              label="Title"
              onChange={(event) => setSessionForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="e.g. React fundamentals"
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
            <div className="md:col-span-2 mt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsSessionModalOpen(false)}>Cancel</Button>
              <Button icon={<CalendarPlus className="h-4 w-4" />} type="submit">Create session</Button>
            </div>
          </form>
        </Modal>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="flex flex-col">
            <SectionTitle eyebrow="Invite" title="Generate batch link" />
            <form className="mt-auto grid gap-4" onSubmit={createInvite}>
              <SelectField
                label="Batch"
                onChange={(event) => setInviteBatchId(event.target.value)}
                options={batchOptions}
                value={effectiveInviteBatchId}
              />
              <Button icon={<Link2 className="h-4 w-4" />} type="submit">
                Generate invite
              </Button>
            </form>
            {latestInvite ? (
              <div className="mt-5 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">Batch ID</p>
                  <p className="mt-1 break-all font-mono text-sm text-emerald-800 bg-emerald-100/50 p-2 rounded border border-emerald-200/50 select-all">
                    {effectiveInviteBatchId}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">Invite Token</p>
                  <p className="mt-1 break-all font-mono text-sm text-emerald-800 bg-emerald-100/50 p-2 rounded border border-emerald-200/50 select-all">
                    {latestInvite.token}
                  </p>
                </div>
                <p className="text-xs text-emerald-700 mt-2">
                  Share both the Batch ID and the Token with your students.
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <SectionTitle eyebrow="Attendance" title="Review & Mark" />
              <SelectField
                label="Session"
                onChange={(event) => setAttendanceSessionId(event.target.value)}
                options={sessionOptions}
                value={effectiveAttendanceSessionId}
              />
            </div>
            <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto max-h-[400px]">
              {attendance.isLoading ? <div className="p-5"><LoadingBlock /></div> : null}
              {attendance.data?.attendance.map((row) => (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-zinc-50/50 transition-colors" key={row.student_id}>
                  <div>
                    <p className="font-medium text-zinc-950">{row.student_name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{row.email ?? 'No email'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      aria-pressed={row.status === 'PRESENT'}
                      className={cn(
                        'inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                        row.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                      )}
                      onClick={() => void overrideAttendance(row.student_id, 'PRESENT')}
                      type="button"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Present
                    </button>
                    <button
                      aria-pressed={row.status === 'LATE'}
                      className={cn(
                        'inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                        row.status === 'LATE'
                          ? 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                      )}
                      onClick={() => void overrideAttendance(row.student_id, 'LATE')}
                      type="button"
                    >
                      <Clock3 className="h-3.5 w-3.5" />
                      Late
                    </button>
                    <button
                      aria-pressed={row.status === 'ABSENT'}
                      className={cn(
                        'inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                        row.status === 'ABSENT'
                          ? 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-600/20'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                      )}
                      onClick={() => void overrideAttendance(row.student_id, 'ABSENT')}
                      type="button"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Absent
                    </button>
                  </div>
                </div>
              ))}
              {effectiveAttendanceSessionId && attendance.data?.attendance.length === 0 ? (
                <div className="p-8">
                  <EmptyState detail="No enrolled students were found for this session." title="No attendance rows" />
                </div>
              ) : null}
              {!effectiveAttendanceSessionId ? (
                <div className="p-8 text-center text-sm text-zinc-500">Select a session to view or mark attendance.</div>
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}
