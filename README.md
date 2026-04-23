# SkillBridge Attendance

Full-stack attendance management prototype for a fictional state-level skilling programme called SkillBridge. Five roles — Student, Trainer, Institution, Programme Manager, Monitoring Officer — each log in with Clerk and see a focused dashboard backed by real API calls and PostgreSQL data.

Built as a 2–3 day take-home assignment. Priority is a working, honest, deployable MVP rather than a polished enterprise product.

---

## 1. Live URLs

| Service | URL |
| --- | --- |
| Frontend | https://skillbridge-attendance.vercel.app |
| Backend | https://skillbridge-attendance-production.up.railway.app |
| API base URL | https://skillbridge-attendance-production.up.railway.app |
| Health check | https://skillbridge-attendance-production.up.railway.app/health |

---

## 2. Test Accounts

All five accounts use the same password. Sign up at the live frontend and select the matching role on the onboarding screen.

**Password for all accounts:** `SkillBridge@2026!`

| Role | Email |
| --- | --- |
| Student | hemanth.kumar04hh+student@gmail.com |
| Trainer | hemanth.kumar04hh+trainer@gmail.com |
| Institution | hemanth.kumar04hh+institution@gmail.com |
| Programme Manager | hemanth.kumar04hh+manager@gmail.com |
| Monitoring Officer | hemanth.kumar04hh+monitor@gmail.com |

> Gmail `+alias` addresses all land in the same inbox (`hemanth.kumar04hh@gmail.com`), so Clerk verification emails are easy to access for all five accounts.

**Sign-up flow:**
1. Go to https://skillbridge-attendance.vercel.app/sign-up
2. Enter the email and password above
3. Verify the email code sent to `hemanth.kumar04hh@gmail.com`
4. On the onboarding screen, select the role matching the account (e.g. Student for the student email)
5. Click "Continue to dashboard" — you will see that role's live dashboard

**API testing via Postman (dev backdoor tokens):**

| Token | Role |
| --- | --- |
| `user_seed_student` | Student |
| `user_seed_trainer` | Trainer |
| `user_seed_institution` | Institution |
| `user_seed_manager` | Programme Manager |
| `user_seed_monitor` | Monitoring Officer |

```
Authorization: Bearer user_seed_student
```

---

## 3. Local Setup

**Prerequisites:** Node.js 20+, Docker (for local Postgres)

**Install dependencies:**
```bash
npm install --prefix frontend
npm install --prefix backend
```

**Create environment files:**
```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

**Fill in `.env.local` (frontend):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Fill in `.env` (backend):**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillbridge
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=4000
```

**Start local Postgres with Docker:**
```bash
docker compose -f backend/docker-compose.yml up -d
```

**Run migrations and seed data:**
```bash
cd backend
npm run db:migrate
npm run db:seed
npm run accounts:seed
```

**Run backend:**
```bash
cd backend
npm run dev
```

**Run frontend (in a second terminal):**
```bash
cd frontend
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:4000  
Health: http://localhost:4000/health

---

## 4. Schema Decisions

**`users`** stores a `clerk_user_id` (the Clerk JWT subject) alongside our own `id`, `role`, and an optional `institution_id`. The role lives here rather than in Clerk metadata so the backend can enforce it with a single DB lookup — no Clerk API call needed on every request.

**`institutions`** is a first-class table so trainers and students can be scoped to an institution without adding columns to `users`. An `institution_id` on `users` is nullable so Programme Managers and Monitoring Officers, who span all institutions, don't need a fake value.

**`batch_trainers` and `batch_students`** are explicit join tables (many-to-many). A batch can have multiple trainers, and a student can be in multiple batches. The join table pattern keeps the core tables clean and avoids JSON arrays in columns.

**`invites`** has a `token` (UUID), `reusable` boolean, `max_uses`, `uses_count`, and an optional `expires_at`. This lets a trainer generate a single link for a whole cohort (`reusable: true`) or a one-time link for a single student.

**`sessions`** stores `date`, `start_time`, and `end_time` as plain strings (`YYYY-MM-DD` and `HH:MM`). No timestamp with timezone arithmetic — the configured `PROGRAMME_TIME_ZONE` env var is applied server-side when checking whether a session is "active right now" for a student.

**`attendance`** has a unique constraint on `(session_id, student_id)` so a student can only have one record per session. `ON CONFLICT DO UPDATE` in the mark-attendance route lets students correct a wrong status without a separate PATCH endpoint.

---

## 5. Stack Choices

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 App Router + React 19 | Assignment recommends Vercel; App Router gives server components, built-in routing, and easy Clerk middleware integration. |
| Styling | Tailwind CSS v4 + Lucide icons | Ships zero runtime CSS. Utility classes keep all styling co-located with components. |
| Auth | Clerk | Hosted sign-up/sign-in, email verification, JWT issuance, and a test-mode that works with `+alias` emails. No auth infrastructure to maintain. |
| Backend | Hono + TypeScript | Lightweight, typed, middleware-first framework. Zero-overhead request routing; works with Node or edge runtimes. |
| ORM | Drizzle + drizzle-kit | Fully typed SQL queries. Migrations are plain SQL files — easy to inspect and version. No magic. |
| Database | Neon (hosted PostgreSQL) | Free tier, HTTP-compatible driver, instant branching. Matches the assignment recommendation exactly. |
| Deployment | Vercel (frontend) + Railway (backend) | Both have free tiers, automatic GitHub deploys, and environment variable management through their dashboards. |
| CI | GitHub Actions | Runs type-check, lint, unit tests, Docker build, and an integration smoke test on every push to `main`. |
| Validation | Zod | Used on both backend (request body parsing) and frontend (form inputs). Single source of truth for shapes. |

---

## 6. What Works, What Is Partial, What Was Skipped

### Fully working
- Clerk sign-up and sign-in for all five roles
- Onboarding screen (`/onboarding`) — user picks a role, `POST /api/me/sync` creates the DB record
- Server-side JWT verification and role enforcement on every protected endpoint (403 on wrong role)
- **Student**: views active sessions, marks attendance (`POST /api/attendance/mark`)
- **Trainer**: creates sessions, views session attendance, generates and shares invite links
- **Institution**: views all batches and their attendance summary
- **Programme Manager**: programme-wide summary across all institutions
- **Monitoring Officer**: read-only programme analytics — no create/edit/delete controls anywhere in the UI
- Invite link flow: Trainer generates token → Student visits `/batches/:id/join?token=...` → joins batch
- GitHub Actions CI (typecheck, lint, tests, Docker build, smoke test)
- Railway deployment with Dockerfile and healthcheck at `/health`
- Vercel deployment with automatic redeploys on push to `main`

### Partially working
- Student attendance marking only works for sessions active at the current server time in `Asia/Kolkata`. If no session is active when the evaluator tests, the student dashboard will show an empty session list (the data is correct, the timing just has to align).
- The "Insights" card on the Programme Manager and Monitoring Officer dashboards uses deterministic rules (attendance rate thresholds) rather than a live LLM. The logic is real; the text is rule-generated.

### Skipped
- Playwright end-to-end tests (unit and integration tests are present)
- Audit log for mutations
- Institution-to-trainer invitation workflow (trainers are currently added to institutions via seed data or direct DB insert)
- Production observability / error tracking (Sentry or similar)

---

## 7. What I Would Do Differently With More Time

I would replace the manual `POST /api/me/sync` onboarding step with a **Clerk webhook** (`user.created` event). Right now, the user must complete the onboarding form before any protected route works. With a webhook, the backend creates the user row the moment Clerk confirms the sign-up — the onboarding screen becomes purely a role-selection UI, and the "User not synced" error path disappears entirely. It is the cleanest fix for the most friction-heavy part of the current flow.

---

## Project Structure

```
skillbridge-attendance/
  frontend/           Next.js App Router frontend
  backend/            Hono + Drizzle REST API
  docs/               API reference, deployment notes, schema plan
  .github/workflows/  CI and CD pipelines
  CONTACT.txt
  README.md
```

## Full API Reference

See [docs/API.md](docs/API.md) for all endpoints with example requests and responses.

## Deployment Checklist

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step Railway, Vercel, Neon, and Clerk setup.
