import type { ReactNode } from 'react'
import { Card } from './card'

export function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string | number
  detail?: string
  icon?: ReactNode
}) {
  return (
    <Card className="interactive-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">{value}</p>
          {detail ? <p className="mt-2 text-sm text-zinc-500">{detail}</p> : null}
        </div>
        {icon ? <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{icon}</div> : null}
      </div>
    </Card>
  )
}
