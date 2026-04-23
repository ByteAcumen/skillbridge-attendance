'use client'

import { BarChart3, Building2, CalendarClock, Loader2, Sparkles, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { Badge } from '@/components/ui/status'
import type { ProgrammeSummary } from '@/lib/api'

export function toNumber(value: unknown) {
  return Number(value ?? 0)
}

export function formatRate(value: number | string | null | undefined) {
  return `${Math.round(Number(value ?? 0))}%`
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return 'Not scheduled'
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : value

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function shortId(value: string | null | undefined) {
  if (!value) return 'Not assigned'
  return value.length > 18 ? `${value.slice(0, 10)}...${value.slice(-4)}` : value
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
      <p className="font-semibold text-zinc-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{detail}</p>
    </div>
  )
}

export function SectionTitle({
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

export function LoadingBlock() {
  return (
    <div className="grid min-h-40 place-items-center rounded-lg border border-zinc-200 bg-white">
      <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
    </div>
  )
}

export function ContextGrid({
  items,
}: {
  items: Array<{
    label: string
    value: ReactNode
    detail?: ReactNode
    icon?: ReactNode
  }>
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((item) => (
        <Card className="min-h-28" key={item.label}>
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              {item.icon ?? <Building2 className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.label}</p>
              <div className="mt-1 break-words text-base font-semibold text-zinc-950">{item.value}</div>
              {item.detail ? <div className="mt-1 text-sm leading-5 text-zinc-500">{item.detail}</div> : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function SessionMeta({
  date,
  start,
  end,
}: {
  date?: string
  start?: string
  end?: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
      <CalendarClock className="h-4 w-4" />
      {formatDate(date)} {start && end ? `- ${start} to ${end}` : ''}
    </span>
  )
}

export function PeopleCount({ count, label }: { count: number | string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700">
      <UsersRound className="h-3.5 w-3.5" />
      {count} {label}
    </span>
  )
}

export function InsightsCard({ recommendations }: { recommendations: string[] }) {
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

export function ProgrammeOverview({ summary }: { summary: ProgrammeSummary }) {
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
