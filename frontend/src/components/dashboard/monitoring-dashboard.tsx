'use client'

import { useMemo, useState } from 'react'
import { Building2, Eye, GraduationCap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { SelectField } from '@/components/ui/field'
import { Badge, Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import {
  ContextGrid,
  DataSyncBanner,
  EmptyState,
  LoadingBlock,
  PeopleCount,
  ProgressBar,
  ProgrammeOverview,
  SectionTitle,
  WorkflowSteps,
  formatRate,
} from '@/components/dashboard/shared'
import { useApiQuery } from '@/hooks/use-api'
import type { AppUser, Institution, InstitutionBatchSummary, ProgrammeSummary } from '@/lib/api'

type RolePanelProps = { user: AppUser }

export function MonitoringDashboard({ user }: RolePanelProps) {
  const summary = useApiQuery<ProgrammeSummary>('/api/programme/summary')
  const institutions = useApiQuery<{ institutions: Institution[] }>('/api/institutions')
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('')
  const activeInstitutionId = selectedInstitutionId || institutions.data?.institutions[0]?.id || ''
  const institutionSummary = useApiQuery<{ institution: Institution; batches: InstitutionBatchSummary[] }>(
    activeInstitutionId ? `/api/institutions/${activeInstitutionId}/summary` : null,
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
      <div className="dashboard-flow grid gap-8">
        <Message tone="warn">
          Monitoring Officer access is read-only. This dashboard has no create, edit, or delete actions.
        </Message>
        <DataSyncBanner
          detail="Monitoring users receive programme and institution summaries with write controls removed from the interface."
          error={summary.error ?? institutions.error ?? institutionSummary.error}
          isLoading={summary.isLoading || institutions.isLoading || institutionSummary.isLoading}
          label="Monitoring workspace sync"
        />

        <WorkflowSteps
          steps={[
            {
              label: 'Read-only',
              detail: 'No write actions exposed',
              state: 'complete',
            },
            {
              label: 'Programme',
              detail: `${summary.data?.institutions.length ?? 0} institutions`,
              state: summary.data ? 'complete' : 'waiting',
            },
            {
              label: 'Institution',
              detail: institutionSummary.data?.institution.name ?? 'Select one',
              state: activeInstitutionId ? 'active' : 'waiting',
            },
            {
              label: 'Review',
              detail: 'Use low rates for follow-up',
              state: institutionSummary.data ? 'complete' : 'waiting',
            },
          ]}
        />

        {summary.isLoading ? <LoadingBlock /> : null}
        {summary.data ? <ProgrammeOverview summary={summary.data} /> : null}
        {summary.error ? <Message tone="danger">{summary.error}</Message> : null}

        <ContextGrid
          items={[
            {
              label: 'Access level',
              value: 'Read-only',
              detail: 'No create, edit, or delete controls are shown',
              icon: <Eye className="h-5 w-5" />,
            },
            {
              label: 'Programme coverage',
              value: `${summary.data?.institutions.length ?? 0} institutions`,
              detail: 'Monitoring can inspect every institution',
              icon: <Building2 className="h-5 w-5" />,
            },
            {
              label: 'Selected institution',
              value: institutionSummary.data?.institution.name ?? 'Select an institution',
              detail: institutionSummary.data?.institution.region ? `${institutionSummary.data.institution.region} region` : 'Batch metrics appear below',
              icon: <GraduationCap className="h-5 w-5" />,
            },
          ]}
        />

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
            <SectionTitle eyebrow="Read-only" title="Institution detail" />
            <SelectField
              label="Institution"
              onChange={(event) => setSelectedInstitutionId(event.target.value)}
              options={institutionOptions}
              value={activeInstitutionId}
            />
          </div>
          <div className="divide-y divide-zinc-100">
            {institutionSummary.data?.batches.map((batch) => (
              <div className="grid gap-3 px-5 py-4 text-sm transition-colors hover:bg-zinc-50/50 sm:grid-cols-[1fr_180px_auto] sm:items-center" key={batch.batch_id}>
                <div>
                  <span className="block font-medium text-zinc-950">{batch.batch_name}</span>
                  <span className="mt-2 flex flex-wrap gap-2">
                    <PeopleCount count={batch.student_count} label="students" />
                    <PeopleCount count={batch.session_count} label="sessions" />
                  </span>
                </div>
                <ProgressBar value={batch.attendance_rate} />
                <Badge tone={batch.attendance_rate >= 75 ? 'good' : 'warn'}>
                  {formatRate(batch.attendance_rate)}
                </Badge>
              </div>
            ))}
            {activeInstitutionId && institutionSummary.data?.batches.length === 0 ? (
              <div className="p-8">
                <EmptyState detail="This institution has no batches yet." title="No batches" />
              </div>
            ) : null}
            {!activeInstitutionId ? (
              <div className="p-8 text-center text-sm text-zinc-500">Select an institution to view its detailed batch metrics.</div>
            ) : null}
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}
