'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TextField } from '@/components/ui/field'
import { Message } from '@/components/ui/status'
import { useApiClient } from '@/hooks/use-api'
import type { AppUser } from '@/lib/api'
import { isRole, type Role, roleOptions } from '@/lib/roles'
import { cn } from '@/lib/utils'

export function OnboardingForm({ initialRole }: { initialRole?: Role }) {
  const router = useRouter()
  const request = useApiClient()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const defaultName = user?.fullName ?? user?.username ?? ''
  const metadataRole = isRole(user?.unsafeMetadata?.selectedRole)
    ? user.unsafeMetadata.selectedRole
    : null

  const [name, setName] = useState(defaultName)
  const [selectedRole, setSelectedRole] = useState<Role | null>(initialRole ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const profileName = name || defaultName
  const role = selectedRole ?? metadataRole ?? 'STUDENT'

  const canSubmit = useMemo(
    () => Boolean(profileName.trim() && email && role && isSignedIn),
    [email, isSignedIn, profileName, role],
  )

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return

    setError(null)
    setIsSubmitting(true)

    try {
      await request<{ ok: boolean; user: AppUser }>('/api/me/sync', {
        method: 'POST',
        body: JSON.stringify({
          name: profileName.trim(),
          email,
          role,
        }),
      })
      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete onboarding.')
      setIsSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <Card className="mx-auto grid min-h-72 max-w-lg place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
      </Card>
    )
  }

  if (!isSignedIn) {
    return (
      <Card className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold text-zinc-950">Sign in to continue</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Your workspace profile is created after Clerk confirms your identity.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-700"
          href="/sign-in"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    )
  }

  return (
    <form className="mx-auto grid max-w-4xl gap-6" onSubmit={onSubmit}>
      <div className="animate-fade-up">
        <p className="text-sm font-semibold text-emerald-700">Profile setup</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-zinc-950">
          Choose your SkillBridge role.
        </h1>
      </div>

      <Card className="animate-fade-up animate-delay-1">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Full name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            value={profileName}
          />
          <TextField disabled label="Email" value={email} />
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-5">
        {roleOptions.map((option, index) => {
          const Icon = option.icon
          const isSelected = role === option.value
          const delayClass = ['animate-delay-1', 'animate-delay-2', 'animate-delay-3'][
            Math.min(index, 2)
          ]

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                'interactive-card animate-fade-up rounded-lg border bg-white p-4 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600',
                delayClass,
                isSelected
                  ? 'border-emerald-500 shadow-emerald-950/10'
                  : 'border-zinc-200 shadow-zinc-950/[0.03]',
              )}
              key={option.value}
              onClick={() => setSelectedRole(option.value)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <Icon className="h-5 w-5 text-emerald-700" />
                {isSelected ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : null}
              </div>
              <p className="mt-4 font-semibold text-zinc-950">{option.label}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{option.description}</p>
            </button>
          )
        })}
      </div>

      {error ? <Message tone="danger">{error}</Message> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          disabled={!canSubmit || isSubmitting}
          icon={isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          type="submit"
        >
          Continue to dashboard
        </Button>
      </div>
    </form>
  )
}
