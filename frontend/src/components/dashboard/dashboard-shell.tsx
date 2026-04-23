import type { ReactNode } from 'react'
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
  return (
    <main className="min-h-[calc(100svh-4rem)]">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <Badge tone="info">{roleLabel[user.role]}</Badge>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
              {title}
            </h1>
            <p className="mt-3 text-sm text-zinc-600">
              {user.name}
              {user.institution?.name ? ` - ${user.institution.name}` : ''}
            </p>
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
