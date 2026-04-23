import { OnboardingForm } from '@/components/onboarding/onboarding-form'
import { roleFromSlug } from '@/lib/roles'

type OnboardingSearchParams = Promise<{ role?: string }>

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: OnboardingSearchParams
}) {
  const params = await searchParams
  const selectedRole = roleFromSlug(params.role)

  return (
    <main className="min-h-[calc(100svh-4rem)] px-4 py-10 sm:px-6 lg:px-8">
      <OnboardingForm initialRole={selectedRole?.value} />
    </main>
  )
}
