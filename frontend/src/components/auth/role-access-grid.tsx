import { ArrowRight, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/status'
import { demoAccounts, demoPassword } from '@/lib/demo-accounts'
import { roleOptions } from '@/lib/roles'

export function RoleAccessGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {roleOptions.map((role, index) => {
        const Icon = role.icon
        const account = demoAccounts[role.value]
        const delayClass = ['', 'animate-delay-1', 'animate-delay-2', 'animate-delay-3'][
          Math.min(index, 3)
        ]

        return (
          <Card className={`interactive-card animate-fade-up ${delayClass}`} key={role.value}>
            <div className="flex items-start justify-between gap-3">
              <Icon className="h-6 w-6 text-emerald-700" />
              <Badge tone="info">Demo ready</Badge>
            </div>
            <h3 className="mt-4 font-semibold text-zinc-950">{role.label}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{role.description}</p>
            <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <p className="break-all font-mono text-xs text-zinc-700">{account.email}</p>
              <p className="mt-2 flex items-center gap-2 font-mono text-xs text-zinc-500">
                <KeyRound className="h-3.5 w-3.5" />
                {demoPassword}
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-700"
                href={`/sign-in?role=${role.slug}`}
              >
                Sign in as {role.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
                href={`/sign-up?role=${role.slug}`}
              >
                Create {role.label} account
              </Link>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
