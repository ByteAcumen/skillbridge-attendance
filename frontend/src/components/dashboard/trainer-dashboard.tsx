'use client'

import { CalendarPlus, Link2, Plus, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SelectField, TextField } from '@/components/ui/field'
import { MetricCard } from '@/components/ui/metric-card'
import { Badge, Message } from '@/components/ui/status'
import { Modal } from '@/components/ui/modal'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { EmptyState, LoadingBlock, SectionTitle } from '@/components/dashboard/shared'
import { useApiClient, useApiQuery } from '@/hooks/use-api'
import type { AppUser, AttendanceRow, Batch, Invite, Session, TrainerSession } from '@/lib/api'

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
  const attendance = useApiQuery<{ session: Session; attendance: AttendanceRow[] }>(
    attendanceSessionId ? `/api/sessions/${attendanceSessionId}/attendance` : null,
  )
  const [message, setMessage] = useState<string | null>(null)

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)

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
    if (!sessionForm.batchId || !sessionForm.title.trim()) return

    setMessage(null)
    try {
      await request('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ ...sessionForm, title: sessionForm.title.trim() }),
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
    if (!inviteBatchId) return

    setMessage(null)
    try {
      const response = await request<{ invite: Invite }>(`/api/batches/${inviteBatchId}/invite`, {
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
        body: JSON.stringify({ sessionId: attendanceSessionId, studentId, status }),
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

        <section className="flex flex-col sm:flex-row gap-4">
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsBatchModalOpen(true)}>
            Create New Batch
          </Button>
          <Button icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setIsSessionModalOpen(true)} variant="secondary">
            Schedule Session
          </Button>
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
              value={sessionForm.batchId}
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
                value={inviteBatchId}
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
                    {inviteBatchId}
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
                value={attendanceSessionId}
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
                      type="button"
                      onClick={() => void overrideAttendance(row.student_id, 'PRESENT')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${row.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => void overrideAttendance(row.student_id, 'LATE')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${row.status === 'LATE' ? 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => void overrideAttendance(row.student_id, 'ABSENT')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${row.status === 'ABSENT' ? 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-600/20' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                    >
                      A
                    </button>
                  </div>
                </div>
              ))}
              {attendanceSessionId && attendance.data?.attendance.length === 0 ? (
                <div className="p-8">
                  <EmptyState detail="No enrolled students were found for this session." title="No attendance rows" />
                </div>
              ) : null}
              {!attendanceSessionId ? (
                <div className="p-8 text-center text-sm text-zinc-500">Select a session to view or mark attendance.</div>
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}
