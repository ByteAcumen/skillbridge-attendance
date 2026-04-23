'use client'

import { Building2, GraduationCap, Plus, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SelectField, TextField } from '@/components/ui/field'
import { Badge, Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import {
  ContextGrid,
  LoadingBlock,
  PeopleCount,
  ProgrammeOverview,
  SectionTitle,
  formatRate,
} from '@/components/dashboard/shared'
import { Modal } from '@/components/ui/modal'
import { useApiClient, useApiQuery } from '@/hooks/use-api'
import type { AppUser, Institution, InstitutionBatchSummary, ProgrammeSummary } from '@/lib/api'

type RolePanelProps = { user: AppUser }

export function ProgrammeManagerDashboard({ user }: RolePanelProps) {
  const request = useApiClient()
  const summary = useApiQuery<ProgrammeSummary>('/api/programme/summary')
  const institutions = useApiQuery<{ institutions: Institution[] }>('/api/institutions')
  const [institutionName, setInstitutionName] = useState('')
  const [region, setRegion] = useState('')
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('')
  const activeInstitutionId = selectedInstitutionId || institutions.data?.institutions[0]?.id || ''
  const institutionSummary = useApiQuery<{ institution: Institution; batches: InstitutionBatchSummary[] }>(
    activeInstitutionId ? `/api/institutions/${activeInstitutionId}/summary` : null,
  )
  const [message, setMessage] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)

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
      setIsModalOpen(false)
      setMessage('Institution created successfully.')
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
    <DashboardShell
      actions={
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsModalOpen(true)}>
          Add Institution
        </Button>
      }
      title="Programme command center"
      user={user}
    >
      <div className="grid gap-8">
        {message ? <Message tone={message.includes('Could not') ? 'danger' : 'good'}>{message}</Message> : null}
        {summary.isLoading ? <LoadingBlock /> : null}
        {summary.data ? <ProgrammeOverview summary={summary.data} /> : null}
        {summary.error ? <Message tone="danger">{summary.error}</Message> : null}

        <ContextGrid
          items={[
            {
              label: 'Programme scope',
              value: `${summary.data?.institutions.length ?? 0} institutions`,
              detail: 'Cross-institution attendance governance',
              icon: <Building2 className="h-5 w-5" />,
            },
            {
              label: 'Selected institution',
              value: institutionSummary.data?.institution.name ?? 'Select an institution',
              detail: institutionSummary.data?.institution.region ? `${institutionSummary.data.institution.region} region` : 'Review batch performance below',
              icon: <GraduationCap className="h-5 w-5" />,
            },
            {
              label: 'Current focus',
              value: `${institutionSummary.data?.batches.length ?? 0} batches`,
              detail: 'Use this view to spot low attendance batches',
              icon: <UsersRound className="h-5 w-5" />,
            },
          ]}
        />

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Institution">
          <form className="grid gap-4" onSubmit={createInstitution}>
            <TextField
              label="Name"
              onChange={(event) => setInstitutionName(event.target.value)}
              placeholder="e.g. Green Valley Institute"
              value={institutionName}
            />
            <TextField
              label="Region"
              onChange={(event) => setRegion(event.target.value)}
              placeholder="e.g. Central"
              value={region}
            />
            <div className="mt-4 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button icon={<Plus className="h-4 w-4" />} type="submit">Create institution</Button>
            </div>
          </form>
        </Modal>

        <section className="grid gap-4">

          <Card className="flex flex-col p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <SectionTitle eyebrow="Breakdown" title="Institution batches" />
              <SelectField
                label="Institution"
                onChange={(event) => setSelectedInstitutionId(event.target.value)}
                options={institutionOptions}
                value={activeInstitutionId}
              />
            </div>
            <div className="flex-1 divide-y divide-zinc-100 overflow-y-auto max-h-72">
              {institutionSummary.data?.batches.map((batch) => (
                <div className="flex items-center justify-between gap-3 px-5 py-4 text-sm hover:bg-zinc-50/50 transition-colors" key={batch.batch_id}>
                  <div>
                    <span className="block font-medium text-zinc-950">{batch.batch_name}</span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      <PeopleCount count={batch.student_count} label="students" />
                      <PeopleCount count={batch.session_count} label="sessions" />
                    </span>
                  </div>
                  <Badge tone={batch.attendance_rate >= 75 ? 'good' : 'warn'}>
                    {formatRate(batch.attendance_rate)}
                  </Badge>
                </div>
              ))}
              {activeInstitutionId && institutionSummary.data?.batches.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">No batches found.</div>
              ) : null}
              {!activeInstitutionId ? (
                <div className="p-8 text-center text-sm text-zinc-500">Select an institution to view its batches.</div>
              ) : null}
            </div>
          </Card>
        </section>
      </div>
    </DashboardShell>
  )
}
