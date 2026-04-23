import { SignUp } from '@clerk/nextjs'
import { AuthPageShell } from '@/components/auth/auth-page-shell'
import { SelectedRolePanel } from '@/components/auth/selected-role-panel'
import { redirectSignedInUser } from '@/lib/auth-redirect'
import { roleFromSlug } from '@/lib/roles'

type AuthSearchParams = Promise<{ role?: string }>

export default async function SignUpPage({ searchParams }: { searchParams: AuthSearchParams }) {
  await redirectSignedInUser()
  const params = await searchParams
  const selectedRole = roleFromSlug(params.role)
  const onboardingUrl = selectedRole ? `/onboarding?role=${selectedRole.slug}` : '/onboarding'
  const signInUrl = selectedRole ? `/sign-in?role=${selectedRole.slug}` : '/sign-in'

  return (
    <AuthPageShell
      aside={<SelectedRolePanel mode="sign-up" role={selectedRole} />}
      detail="Select the role before account creation so onboarding and the backend profile stay aligned."
      eyebrow="Create account"
      title={selectedRole ? `Create a ${selectedRole.label} account.` : 'Start with identity, then choose a role.'}
    >
      <SignUp
        fallbackRedirectUrl={onboardingUrl}
        forceRedirectUrl={onboardingUrl}
        routing="path"
        path="/sign-up"
        signInUrl={signInUrl}
        unsafeMetadata={selectedRole ? { selectedRole: selectedRole.value } : undefined}
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
