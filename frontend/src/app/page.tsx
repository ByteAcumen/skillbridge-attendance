import {
  BarChart3,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { HomeActions } from '@/components/site/home-actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/status'
import { redirectSignedInUser } from '@/lib/auth-redirect'
import { roleOptions } from '@/lib/roles'

function ProductPreview() {
  const rows = [
    ['Frontend Cohort 1', '92%', 'Healthy'],
    ['Data Skills Batch', '78%', 'Watch'],
    ['AI Foundations', '86%', 'Stable'],
  ]

  return (
    <div
      className="animate-fade-up animate-delay-2 rounded-lg border border-zinc-200 bg-white p-4 shadow-2xl shadow-emerald-950/10"
      id="insights"
    >
      <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-4">
        <div>
          <p className="text-sm font-semibold text-zinc-950">Programme summary</p>
          <p className="text-xs text-zinc-500">Live attendance signal</p>
        </div>
        <Badge tone="good">Active</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Institutions', '12'],
          ['Students', '1,248'],
          ['Attendance', '88%'],
        ].map(([label, value]) => (
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4" key={label}>
            <p className="text-xs font-medium text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-100">
        {rows.map(([batch, rate, status]) => (
          <div
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0"
            key={batch}
          >
            <span className="font-medium text-zinc-800">{batch}</span>
            <span className="text-zinc-500">{rate}</span>
            <Badge tone={status === 'Watch' ? 'warn' : 'good'}>{status}</Badge>
          </div>
        ))}
      </div>
      <div className="motion-sheen mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
        <div className="relative flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-emerald-700" />
          <p className="text-sm leading-6 text-emerald-900">
            Data Skills Batch needs follow-up this week. Two students missed the
            last active session.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function Home() {
  await redirectSignedInUser()

  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="animate-fade-up">
          <Badge tone="info">Full-stack attendance prototype</Badge>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-normal text-zinc-950 sm:text-6xl">
            Clean attendance control for every SkillBridge role.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            Students mark attendance, trainers manage sessions, institutions
            track batches, and programme teams monitor the whole system through
            real API-backed dashboards.
          </p>
          <HomeActions />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Server checked roles', Icon: ShieldCheck },
              { label: 'Active session marking', Icon: Clock3 },
              { label: 'Programme insights', Icon: BarChart3 },
            ].map(({ label, Icon }) => (
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-600" key={label}>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <Icon className="h-4 w-4 text-zinc-500" />
                {label}
              </div>
            ))}
          </div>
        </div>
        <ProductPreview />
      </section>

      <section className="border-y border-zinc-200 bg-white py-16" id="roles">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-emerald-700">Role-aware by design</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-zinc-950">
              One product, five focused workspaces.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {roleOptions.map((role, index) => {
              const Icon = role.icon
              const delayClass = ['', 'animate-delay-1', 'animate-delay-2', 'animate-delay-3'][
                Math.min(index, 3)
              ]
              return (
                <Card className={`interactive-card animate-fade-up ${delayClass}`} key={role.value}>
                  <Icon className="h-6 w-6 text-emerald-700" />
                  <h3 className="mt-4 font-semibold text-zinc-950">{role.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{role.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8" id="workflow">
        {[
          { title: 'Authenticate', copy: 'Clerk handles identity while the backend owns role authorization.', Icon: UsersRound },
          { title: 'Operate', copy: 'Each role sees only the sessions, batches, and summaries it needs.', Icon: GraduationCap },
          { title: 'Monitor', copy: 'Programme-level views surface rates, risk, and recommendations.', Icon: ShieldCheck },
        ].map(({ title, copy, Icon }) => (
          <Card className="interactive-card" key={title}>
            <Icon className="h-6 w-6 text-sky-700" />
            <h3 className="mt-4 text-lg font-semibold text-zinc-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{copy}</p>
          </Card>
        ))}
      </section>
    </main>
  )
}
