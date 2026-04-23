import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/status'
import { demoAccounts, demoPassword, demoVerificationCode } from '@/lib/demo-accounts'
import type { RoleOption } from '@/lib/roles'

type SelectedRolePanelProps = {
  role: RoleOption | null
  mode: 'sign-in' | 'sign-up'
}

export function SelectedRolePanel({ role, mode }: SelectedRolePanelProps) {
  if (!role) {
    return (
      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="font-semibold text-zinc-950">Choose a role-specific path</p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Use the role cards on the landing page for prefilled demo credentials and
          the correct onboarding role.
        </p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          href="/#test-accounts"
        >
          View role cards
        </Link>
      </div>
    )
  }

  const account = demoAccounts[role.value]
  const Icon = role.icon

  return (
    <div className="mt-8 rounded-lg border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-950/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-zinc-950">{role.label}</p>
            <p className="text-sm text-zinc-500">
              {mode === 'sign-in' ? 'Demo sign-in selected' : 'New account role selected'}
            </p>
          </div>
        </div>
        <Badge tone="good">Selected</Badge>
      </div>

      <div className="mt-5 grid gap-3 text-sm">
        <p className="flex items-start gap-2 text-zinc-600">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          {account.dataHint}
        </p>
        <p className="flex items-start gap-2 text-zinc-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          The backend still verifies this role on every protected API call.
        </p>
      </div>

      {mode === 'sign-in' ? (
        <div className="mt-5 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
          <p className="break-all font-mono text-xs text-zinc-800">{account.email}</p>
          <p className="mt-2 flex items-center gap-2 font-mono text-xs text-zinc-500">
            <KeyRound className="h-3.5 w-3.5" />
            {demoPassword}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Verification code if Clerk asks: {demoVerificationCode}
          </p>
        </div>
      ) : null}
    </div>
  )
}
