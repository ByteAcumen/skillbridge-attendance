'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { SelectField } from '@/components/ui/field'
import { MetricCard } from '@/components/ui/metric-card'
import { Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { EmptyState, LoadingBlock, SectionTitle } from '@/components/dashboard/shared'
import { useApiQuery } from '@/hooks/use-api'
import type { AppUser, Batch, BatchDetail, BatchSummaryRow } from '@/lib/api'

type RolePanelProps = { user: AppUser }

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
            <Card className="p-0 overflow-hidden flex flex-col">
              <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
                <p className="font-semibold text-zinc-950">{details.data.batch.name}</p>
                <p className="mt-1 font-mono text-xs text-zinc-500">{details.data.batch.id}</p>
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
              </div>
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-zinc-200 bg-zinc-50/50 px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Student</span>
                <span className="text-center">Total</span>
                <span className="text-emerald-700 text-center">Present</span>
                <span className="text-amber-700 text-center">Late</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {summary.data?.summary.map((row) => (
                  <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-5 py-3 text-sm hover:bg-zinc-50 transition-colors" key={`${row.student_name}-${row.email}`}>
                    <div>
                      <p className="font-medium text-zinc-950">{row.student_name}</p>
                      <p className="text-xs text-zinc-500">{row.email}</p>
                    </div>
                    <span className="text-zinc-600 font-medium w-12 text-center bg-zinc-100 rounded py-1">{row.marked_sessions}</span>
                    <span className="text-emerald-700 font-medium w-16 text-center bg-emerald-50 rounded py-1">{row.present_count}</span>
                    <span className="text-amber-700 font-medium w-16 text-center bg-amber-50 rounded py-1">{row.late_count}</span>
                  </div>
                ))}
                {summary.data?.summary.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-500">No students found in this batch.</div>
                ) : null}
              </div>
            </Card>
          </div>
        ) : (
          !selectedBatchId ? (
            <EmptyState detail="Choose a batch to inspect trainers, students, and attendance." title="Select a batch" />
          ) : null
        )}
      </div>
    </DashboardShell>
  )
}
