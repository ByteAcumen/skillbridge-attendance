'use client'

import { useAuth } from '@clerk/nextjs'
import { ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Message } from '@/components/ui/status'
import { useApiQuery } from '@/hooks/use-api'
import type { AppUser } from '@/lib/api'
import {
  DashboardProblem,
  InstitutionDashboard,
  MonitoringDashboard,
  ProgrammeManagerDashboard,
  StudentDashboard,
  TrainerDashboard,
} from './role-panels'

function LoadingWorkspace() {
  return (
    <main className="grid min-h-[calc(100svh-4rem)] place-items-center px-4">
      <Card className="grid min-h-52 w-full max-w-md place-items-center text-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
        <p className="text-sm font-medium text-zinc-600">Loading workspace</p>
      </Card>
    </main>
  )
}

function SignedOutWorkspace() {
  return (
    <main className="grid min-h-[calc(100svh-4rem)] place-items-center px-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-semibold text-zinc-950">Sign in required</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          SkillBridge dashboards are tied to your Clerk identity and backend role.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-700"
          href="/sign-in"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </main>
  )
}

function OnboardingRequired({ error }: { error?: string | null }) {
  return (
    <main className="grid min-h-[calc(100svh-4rem)] place-items-center px-4">
      <Card className="max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-950">Finish profile setup</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          The backend needs a SkillBridge role before it can open the correct dashboard.
        </p>
        {error ? <Message tone="warn"><span>{error}</span></Message> : null}
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-700"
          href="/onboarding"
        >
          Continue setup
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </main>
  )
}

export function DashboardRouter() {
  const { isLoaded, isSignedIn } = useAuth()
  const profile = useApiQuery<{ user: AppUser | null }>(
    isLoaded && isSignedIn ? '/api/me' : null,
  )

  if (!isLoaded) return <LoadingWorkspace />
  if (!isSignedIn) return <SignedOutWorkspace />
  if (profile.isLoading) return <LoadingWorkspace />
  if (profile.error || !profile.data?.user) return <OnboardingRequired error={profile.error} />

  const { user } = profile.data

  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard user={user} />
    case 'TRAINER':
      return <TrainerDashboard user={user} />
    case 'INSTITUTION':
      return <InstitutionDashboard user={user} />
    case 'PROGRAMME_MANAGER':
      return <ProgrammeManagerDashboard user={user} />
    case 'MONITORING_OFFICER':
      return <MonitoringDashboard user={user} />
    default:
      return <DashboardProblem user={user} />
  }
}
