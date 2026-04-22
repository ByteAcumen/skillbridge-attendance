import { SignUp } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/auth-page-shell'

export default function SignUpPage() {
  return (
    <AuthPageShell eyebrow="Create account" title="Start with identity, then choose a role.">
      <SignUp
        fallbackRedirectUrl="/onboarding"
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            cardBox: 'shadow-2xl shadow-zinc-950/10 rounded-lg',
            card: 'rounded-lg',
            formButtonPrimary:
              'bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold',
          },
        }}
      />
    </AuthPageShell>
  )
}
