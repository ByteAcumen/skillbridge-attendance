'use client'

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export function AuthNav() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-transparent px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="redirect">
          <button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-700">
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          href="/dashboard"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <UserButton />
      </Show>
    </div>
  )
}
