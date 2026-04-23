'use client'

import { useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
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
        <p className="text-sm font-medium text-zinc-600">Loading workspace…</p>
      </Card>
    </main>
  )
}

export function DashboardRouter() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const profile = useApiQuery<{ user: AppUser | null }>(
    isLoaded && isSignedIn ? '/api/me' : null,
  )

  // Not signed in → middleware handles redirect, but belt-and-suspenders
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  // Profile fetch failed or user not synced → go to onboarding automatically
  useEffect(() => {
    if (!profile.isLoading && (profile.error || (profile.data && !profile.data.user))) {
      router.replace('/onboarding')
    }
  }, [profile.isLoading, profile.error, profile.data, router])

  if (!isLoaded || profile.isLoading) return <LoadingWorkspace />
  if (!isSignedIn) return <LoadingWorkspace />
  if (profile.error || !profile.data?.user) return <LoadingWorkspace />

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
