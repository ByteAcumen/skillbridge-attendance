import type { ReactNode } from 'react'
import { Building2, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/status'
import type { AppUser } from '@/lib/api'
import { roleLabel } from '@/lib/roles'

export function DashboardShell({
  user,
  title,
  children,
  actions,
}: {
  user: AppUser
  title: string
  children: ReactNode
  actions?: ReactNode
}) {
  const scope =
    user.institution?.name ??
    (user.role === 'PROGRAMME_MANAGER' || user.role === 'MONITORING_OFFICER'
      ? 'Programme-wide access'
      : 'Batch assignment pending')

  return (
    <main className="min-h-[calc(100svh-4rem)]">
      <section className="border-b border-zinc-200 bg-white/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{roleLabel[user.role]}</Badge>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Server verified
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
              {title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-600">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <UserRound className="h-4 w-4 text-zinc-500" />
                {user.name}
              </span>
              {user.email ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2">
                  <Mail className="h-4 w-4 text-zinc-500" />
                  {user.email}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2">
                <Building2 className="h-4 w-4 text-zinc-500" />
                {scope}
              </span>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </section>
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </section>
    </main>
  )
}
