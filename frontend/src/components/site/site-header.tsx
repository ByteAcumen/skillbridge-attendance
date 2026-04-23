'use client'

import { Show, useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { AuthNav } from './auth-nav'

export function SiteHeader() {
  const { isSignedIn } = useAuth()
  const brandHref = isSignedIn ? '/dashboard' : '/'

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" href={brandHref}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-950 text-sm font-bold text-white">
            SB
          </span>
          <span className="text-sm font-semibold tracking-normal text-zinc-950">
            SkillBridge Attendance
          </span>
        </Link>
        <Show when="signed-out">
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex">
            <Link className="transition hover:text-zinc-950" href="/#roles">
              Roles
            </Link>
            <Link className="transition hover:text-zinc-950" href="/#test-accounts">
              Test accounts
            </Link>
            <Link className="transition hover:text-zinc-950" href="/#workflow">
              Workflow
            </Link>
            <Link className="transition hover:text-zinc-950" href="/#insights">
              Insights
            </Link>
          </nav>
        </Show>
        <AuthNav />
      </div>
    </header>
  )
}
