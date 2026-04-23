import { SignIn } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { SelectedRolePanel } from '@/components/auth/selected-role-panel'
import { demoAccounts } from '@/lib/demo-accounts'
import { redirectSignedInUser } from '@/lib/auth-redirect'
import { roleFromSlug } from '@/lib/roles'

type AuthSearchParams = Promise<{ role?: string }>

export default async function SignInPage({ searchParams }: { searchParams: AuthSearchParams }) {
  await redirectSignedInUser()
  const params = await searchParams
  const selectedRole = roleFromSlug(params.role)
  const selectedAccount = selectedRole ? demoAccounts[selectedRole.value] : null
  const signUpUrl = selectedRole ? `/sign-up?role=${selectedRole.slug}` : '/sign-up'

  return (
    <AuthPageShell
      aside={<SelectedRolePanel mode="sign-in" role={selectedRole} />}
      detail="Use one of the seeded accounts for review, or sign in with any Clerk user that has completed onboarding."
      eyebrow="Welcome back"
      title={selectedRole ? `${selectedRole.label} sign in.` : 'Open your SkillBridge workspace.'}
    >
      <SignIn
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        initialValues={selectedAccount ? { emailAddress: selectedAccount.email } : undefined}
        routing="path"
        path="/sign-in"
        signUpUrl={signUpUrl}
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
