'use client'

import { AlertTriangle } from 'lucide-react'
import { Message } from '@/components/ui/status'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import type { AppUser } from '@/lib/api'

type RolePanelProps = { user: AppUser }

export function DashboardProblem({ user }: RolePanelProps) {
  return (
    <DashboardShell title="Workspace unavailable" user={user}>
      <Message tone="danger">
        <span className="inline-flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          This role is not mapped to a dashboard.
        </span>
      </Message>
    </DashboardShell>
  )
}
