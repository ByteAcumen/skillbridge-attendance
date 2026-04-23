'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function SignedInRedirect({ to = '/dashboard' }: { to?: string }) {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(to)
    }
  }, [isLoaded, isSignedIn, router, to])

  return null
}
