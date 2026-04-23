'use client'

import { Show } from '@clerk/nextjs'
import { ArrowRight, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { SignedInRedirect } from '@/components/auth/signed-in-redirect'

const primary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-700'

const secondary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50'

export function HomeActions() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Show when="signed-out">
        <Link className={primary} href="/sign-up">
          Create account
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link className={secondary} href="/sign-in">
          Sign in
        </Link>
      </Show>
      <Show when="signed-in">
        <SignedInRedirect />
        <Link className={primary} href="/dashboard">
          Open dashboard
          <LayoutDashboard className="h-4 w-4" />
        </Link>
      </Show>
    </div>
  )
}
