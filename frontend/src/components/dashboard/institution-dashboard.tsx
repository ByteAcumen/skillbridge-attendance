'use client'

import { useMemo, useState } from 'react'
import { Building2, GraduationCap, UsersRound } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SelectField } from '@/components/ui/field'
import { MetricCard } from '@/components/ui/metric-card'
import { Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import {
  ContextGrid,
  DataSyncBanner,
  EmptyState,
  LoadingBlock,
  ProgressBar,
  SectionTitle,
  WorkflowSteps,
  formatRate,
  shortId,
  toNumber,
} from '@/components/dashboard/shared'
import { useApiQuery } from '@/hooks/use-api'
import type { AppUser, Batch, BatchDetail, BatchSummaryRow } from '@/lib/api'

type RolePanelProps = { user: AppUser }

export function InstitutionDashboard({ user }: RolePanelProps) {
  const batches = useApiQuery<{ batches: Batch[] }>('/api/batches')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const activeBatchId = selectedBatchId || batches.data?.batches[0]?.id || ''
  const summary = useApiQuery<{ batch: Batch; summary: BatchSummaryRow[] }>(
    activeBatchId ? `/api/batches/${activeBatchId}/summary` : null,
  )
  const details = useApiQuery<{ batch: BatchDetail }>(
    activeBatchId ? `/api/batches/${activeBatchId}` : null,
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
      <div className="dashboard-flow grid gap-8">
        <DataSyncBanner
          detail="Institution users see only their batches, assigned trainers, enrolled students, and batch attendance summaries."
          error={batches.error ?? summary.error ?? details.error}
          isLoading={batches.isLoading || summary.isLoading || details.isLoading}
          label="Institution workspace sync"
        />

        <WorkflowSteps
          steps={[
            {
              label: 'Institution',
              detail: user.institution?.name ?? 'Scoped account',
              state: user.institutionId ? 'complete' : 'waiting',
            },
            {
              label: 'Batch',
              detail: details.data?.batch.name ?? 'Choose a batch',
              state: activeBatchId ? 'active' : 'waiting',
            },
            {
              label: 'Roster',
              detail: `${details.data?.batch.students?.length ?? 0} students, ${details.data?.batch.trainers?.length ?? 0} trainers`,
              state: details.data ? 'complete' : 'waiting',
            },
            {
              label: 'Summary',
              detail: `${summary.data?.summary.length ?? 0} attendance rows`,
              state: summary.data ? 'complete' : 'waiting',
            },
          ]}
        />

        <ContextGrid
          items={[
            {
              label: 'Institution',
              value: user.institution?.name ?? details.data?.batch.institution?.name ?? 'Institution pending',
              detail: user.institution?.region ? `${user.institution.region} region` : 'Batches are scoped to this institution',
              icon: <Building2 className="h-5 w-5" />,
            },
            {
              label: 'Selected batch',
              value: details.data?.batch.name ?? 'Choose a batch',
              detail: details.data?.batch.id ? shortId(details.data.batch.id) : 'Summary loads after selection',
              icon: <GraduationCap className="h-5 w-5" />,
            },
            {
              label: 'Roster size',
              value: `${details.data?.batch.students?.length ?? 0} students`,
              detail: `${details.data?.batch.trainers?.length ?? 0} trainers assigned`,
              icon: <UsersRound className="h-5 w-5" />,
            },
          ]}
        />

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
            value={activeBatchId}
          />
        </Card>

        {summary.isLoading || details.isLoading ? <LoadingBlock /> : null}
        {activeBatchId && summary.error ? <Message tone="danger">{summary.error}</Message> : null}
        {activeBatchId && details.data ? (
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="p-0 overflow-hidden flex flex-col">
              <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
                <p className="font-semibold text-zinc-950">{details.data.batch.name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {details.data.batch.institution?.name ?? user.institution?.name ?? 'Institution unavailable'} -{' '}
                  <span className="font-mono">{details.data.batch.id}</span>
                </p>
              </div>
              <div className="px-5 py-4 flex-1">
                <p className="text-sm font-semibold text-zinc-950">Trainers</p>
                <div className="mt-3 grid gap-2">
                  {details.data.batch.trainers?.map(({ trainer }) => (
                    <div className="flex items-center gap-3" key={trainer.id}>
                      <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold uppercase">
                        {trainer.name.charAt(0)}
                      </div>
                      <p className="text-sm font-medium text-zinc-700">{trainer.name}</p>
                    </div>
                  ))}
                  {details.data.batch.trainers?.length === 0 ? (
                    <p className="text-sm text-zinc-500">No trainers assigned.</p>
                  ) : null}
                </div>
                <p className="mt-6 text-sm font-semibold text-zinc-950">Students</p>
                <div className="mt-3 grid gap-2">
                  {details.data.batch.students?.slice(0, 6).map(({ student }) => (
                    <div className="flex items-center gap-3" key={student.id}>
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-sky-100 text-xs font-bold uppercase text-sky-700">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-700">{student.name}</p>
                        <p className="text-xs text-zinc-500">{student.email ?? 'No email'}</p>
                      </div>
                    </div>
                  ))}
                  {(details.data.batch.students?.length ?? 0) > 6 ? (
                    <p className="text-xs font-medium text-zinc-500">
                      +{(details.data.batch.students?.length ?? 0) - 6} more students
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50/50 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:grid-cols-[1fr_180px_auto]">
                <span>Student</span>
                <span>Attendance rate</span>
                <span className="text-right">Marks</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {summary.data?.summary.map((row) => (
                  <div className="grid gap-3 px-5 py-3 text-sm transition-colors hover:bg-zinc-50 sm:grid-cols-[1fr_180px_auto] sm:items-center" key={`${row.student_name}-${row.email}`}>
                    <div>
                      <p className="font-medium text-zinc-950">{row.student_name}</p>
                      <p className="text-xs text-zinc-500">{row.email}</p>
                    </div>
                    <ProgressBar
                      label={`${row.marked_sessions} marked`}
                      value={
                        toNumber(row.marked_sessions) === 0
                          ? 0
                          : Math.round(
                              ((toNumber(row.present_count) + toNumber(row.late_count)) /
                                toNumber(row.marked_sessions)) *
                                100,
                            )
                      }
                    />
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                        {row.present_count} present
                      </span>
                      <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-700">
                        {row.late_count} late
                      </span>
                      <span className="rounded-md bg-zinc-100 px-2 py-1 font-medium text-zinc-600">
                        {formatRate(
                          toNumber(row.marked_sessions) === 0
                            ? 0
                            : ((toNumber(row.present_count) + toNumber(row.late_count)) /
                                toNumber(row.marked_sessions)) *
                                100,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {summary.data?.summary.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-500">No students found in this batch.</div>
                ) : null}
              </div>
            </Card>
          </div>
        ) : (
          !activeBatchId ? (
            <EmptyState detail="Choose a batch to inspect trainers, students, and attendance." title="Select a batch" />
          ) : null
        )}
      </div>
    </DashboardShell>
  )
}
