'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { SelectField } from '@/components/ui/field'
import { Badge, Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { EmptyState, LoadingBlock, ProgrammeOverview, SectionTitle, formatRate } from '@/components/dashboard/shared'
import { useApiQuery } from '@/hooks/use-api'
import type { AppUser, Institution, InstitutionBatchSummary, ProgrammeSummary } from '@/lib/api'

type RolePanelProps = { user: AppUser }

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

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <SectionTitle eyebrow="Read-only" title="Institution detail" />
            <SelectField
              label="Institution"
              onChange={(event) => setSelectedInstitutionId(event.target.value)}
              options={institutionOptions}
              value={selectedInstitutionId}
            />
          </div>
          <div className="divide-y divide-zinc-100">
            {institutionSummary.data?.batches.map((batch) => (
              <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-zinc-50/50 transition-colors" key={batch.batch_id}>
                <div>
                  <span className="block font-medium text-zinc-950">{batch.batch_name}</span>
                  <span className="block text-xs text-zinc-500 mt-0.5">{batch.session_count} sessions</span>
                </div>
                <Badge tone={batch.attendance_rate >= 75 ? 'good' : 'warn'}>
                  {formatRate(batch.attendance_rate)}
                </Badge>
              </div>
            ))}
            {selectedInstitutionId && institutionSummary.data?.batches.length === 0 ? (
              <div className="p-8">
                <EmptyState detail="This institution has no batches yet." title="No batches" />
              </div>
            ) : null}
            {!selectedInstitutionId ? (
              <div className="p-8 text-center text-sm text-zinc-500">Select an institution to view its detailed batch metrics.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
