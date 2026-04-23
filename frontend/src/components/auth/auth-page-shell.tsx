import type { ReactNode } from 'react'
import { SignedInRedirect } from '@/components/auth/signed-in-redirect'
import { Badge } from '@/components/ui/status'

export function AuthPageShell({
  title,
  eyebrow,
  detail,
  aside,
  children,
}: {
  title: string
  eyebrow: string
  detail?: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
      <SignedInRedirect />
      <section className="animate-fade-up">
        <Badge tone="info">{eyebrow}</Badge>
        <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
          {title}
        </h1>
        {detail ? <p className="mt-4 max-w-lg text-base leading-7 text-zinc-600">{detail}</p> : null}
        <div className="mt-8 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
          {['Server-side role checks', 'Real attendance records', 'Five focused dashboards', 'Deployment-ready stack'].map(
            (item) => (
              <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm" key={item}>
                {item}
              </div>
            ),
          )}
        </div>
        {aside}
      </section>
      <section className="animate-fade-up animate-delay-1 flex justify-center lg:justify-end">
        {children}
      </section>
    </main>
  )
}
