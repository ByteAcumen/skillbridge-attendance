import {
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

function App() {
  const roleCards = [
    {
      icon: GraduationCap,
      title: 'Student',
      text: 'View active sessions and mark attendance for enrolled batches.',
    },
    {
      icon: BookOpenCheck,
      title: 'Trainer',
      text: 'Create sessions, generate invite links, and review attendance.',
    },
    {
      icon: Users,
      title: 'Institution',
      text: 'Manage batches and understand attendance across trainers.',
    },
    {
      icon: BarChart3,
      title: 'Programme Manager',
      text: 'Monitor attendance summaries across institutions and regions.',
    },
    {
      icon: ShieldCheck,
      title: 'Monitoring Officer',
      text: 'Read-only programme visibility without mutation actions.',
    },
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <div className="mb-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Assignment scaffold ready for implementation
          </div>
          <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            SkillBridge Attendance
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            A full-stack role-based attendance management prototype for a
            fictional state-level skilling programme. The implementation plan
            focuses on real auth, server-side role checks, PostgreSQL data, and
            deployable frontend/backend services.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roleCards.map((role) => {
            const Icon = role.icon

            return (
              <article
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                key={role.title}
              >
                <Icon className="mb-4 h-6 w-6 text-emerald-700" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-950">{role.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{role.text}</p>
              </article>
            )
          })}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Next build milestone</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add Clerk signup/login, sync users into PostgreSQL, and protect
              each required REST endpoint with backend role authorization.
            </p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">AI-first enhancement</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Summary dashboards will include deterministic attendance insights
              with optional LLM wording later, keeping the free-tier deployment
              reliable.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
