'use client'

import { ClipboardCheck, Link2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TextField } from '@/components/ui/field'
import { MetricCard } from '@/components/ui/metric-card'
import { Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { EmptyState, LoadingBlock, SectionTitle } from '@/components/dashboard/shared'
import { Modal } from '@/components/ui/modal'
import { useApiClient, useApiQuery } from '@/hooks/use-api'
import type { ActiveSession, AppUser, Batch } from '@/lib/api'

type RolePanelProps = { user: AppUser }

export function StudentDashboard({ user }: RolePanelProps) {
  const request = useApiClient()
  const batches = useApiQuery<{ batches: Batch[] }>('/api/batches')
  const activeSessions = useApiQuery<{ sessions: ActiveSession[] }>('/api/sessions/active')
  const [joinBatchId, setJoinBatchId] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setIsModalOpen(false)
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
    <DashboardShell
      actions={
        <Button icon={<Link2 className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
          Join a Batch
        </Button>
      }
      title="Student attendance"
      user={user}
    >
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

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Join a Batch">
          <form className="grid gap-4" onSubmit={joinBatch}>
            <TextField
              label="Batch ID"
              onChange={(event) => setJoinBatchId(event.target.value)}
              placeholder="e.g. batch_..."
              value={joinBatchId}
            />
            <TextField
              label="Invite token"
              onChange={(event) => setInviteToken(event.target.value)}
              placeholder="Paste trainer invite token"
              value={inviteToken}
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button disabled={isSubmitting} icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} type="submit">
                Join batch
              </Button>
            </div>
          </form>
        </Modal>

        <section>
          <SectionTitle eyebrow="Now" title="Active sessions" />
          {activeSessions.isLoading ? <LoadingBlock /> : null}
          {!activeSessions.isLoading && activeSessions.data?.sessions.length === 0 ? (
            <EmptyState detail="No enrolled session is active at the current programme time." title="No active session" />
          ) : null}
          <div className="grid gap-3">
            {activeSessions.data?.sessions.map((session) => (
              <Card className="interactive-card border-emerald-200 bg-emerald-50/50 shadow-sm shadow-emerald-900/5 transition-all hover:shadow-md hover:shadow-emerald-900/10" key={session.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-emerald-950">{session.title}</p>
                    <p className="mt-1 text-sm font-medium text-emerald-800/80">
                      {session.batch_name} &middot; {session.start_time} to {session.end_time}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => void markAttendance(session.id, 'PRESENT')}>
                      Mark Present
                    </Button>
                    <Button variant="secondary" className="border-emerald-200 text-emerald-800 hover:bg-emerald-100" onClick={() => void markAttendance(session.id, 'LATE')}>
                      Mark Late
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
              <p className="font-semibold text-zinc-950">My batches</p>
            </div>
            <div className="divide-y divide-zinc-100 flex-1 overflow-y-auto max-h-72">
              {batches.isLoading ? <div className="p-5"><LoadingBlock /></div> : null}
              {batches.data?.batches.map((batch) => (
                <div className="px-5 py-4 text-sm hover:bg-zinc-50 transition-colors" key={batch.id}>
                  <p className="font-medium text-zinc-950">{batch.name}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">{batch.id}</p>
                </div>
              ))}
              {!batches.isLoading && batches.data?.batches.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">You haven't joined any batches yet.</div>
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}
