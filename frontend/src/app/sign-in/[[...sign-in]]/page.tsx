import { SignIn } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/auth-page-shell'

export default function SignInPage() {
  return (
    <AuthPageShell eyebrow="Welcome back" title="Open your SkillBridge workspace.">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
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
