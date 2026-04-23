# SkillBridge Attendance

Full-stack attendance management prototype for a fictional state-level skilling programme. Five roles — Student, Trainer, Institution, Programme Manager, Monitoring Officer — each sign in with Clerk and see a focused dashboard backed by a real REST API and PostgreSQL data.

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

All accounts use the same password: `SkillBridge@2026!`

| Role | Email |
| --- | --- |
| Student | student.skillbridge2026@gmail.com |
| Trainer | trainer.skillbridge2026@gmail.com |
| Institution | institution.skillbridge2026@gmail.com |
| Programme Manager | manager.skillbridge2026@gmail.com |
| Monitoring Officer | monitor.skillbridge2026@gmail.com |

**Sign-in flow:**
1. Go to https://skillbridge-attendance.vercel.app/sign-in
2. Enter the email and password above
3. You will land directly on that role's live dashboard

**API testing via Postman (dev backdoor tokens):**

| Token | Role |
| --- | --- |
| `user_seed_student` | Student |
| `user_seed_trainer` | Trainer |
| `user_seed_institution` | Institution |
| `user_seed_manager` | Programme Manager |
| `user_seed_monitor` | Monitoring Officer |

Example:
```
GET https://skillbridge-attendance-production.up.railway.app/api/sessions/active
Authorization: Bearer user_seed_student
```

---

## 3. Local Setup

**Prerequisites:** Node.js 20+, Docker

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

**Fill in `frontend/.env.local`:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Fill in `backend/.env`:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillbridge
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=4000
```

**Start local Postgres:**
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

**Run frontend (separate terminal):**
```bash
cd frontend
npm run dev
```

Frontend: http://localhost:3000 | Backend: http://localhost:4000

---

## 4. Schema Decisions

**`users`** stores a `clerk_user_id` (the Clerk JWT subject) alongside our own `id`, `role`, and an optional `institution_id`. The role lives in the database so the backend can enforce it with a single lookup on every request — no extra Clerk API call required.

**`institutions`** is a first-class table so trainers and students are scoped to an institution without adding extra columns to `users`. `institution_id` on `users` is nullable so Programme Managers and Monitoring Officers, who span all institutions, do not need a dummy value.

**`batch_trainers` and `batch_students`** are explicit join tables (many-to-many). A batch can have multiple trainers and a student can be in multiple batches. This keeps the core tables clean and avoids JSON arrays in columns.

**`invites`** has a `token` (UUID), `reusable` boolean, `max_uses`, `uses_count`, and optional `expires_at`. This lets a trainer generate a single link for a whole cohort (`reusable: true`) or a one-time link for an individual student.

**`sessions`** stores `date`, `start_time`, and `end_time` as plain strings (`YYYY-MM-DD` and `HH:MM`). The configured `PROGRAMME_TIME_ZONE` env var is applied server-side when checking whether a session is currently active for a student, avoiding timezone arithmetic in SQL.

**`attendance`** has a unique constraint on `(session_id, student_id)`. The mark-attendance route uses `ON CONFLICT DO UPDATE` so a student can correct a wrong status without a separate PATCH endpoint.

---

## 5. Stack Choices

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 App Router + React 19 | Vercel-native, built-in routing, clean Clerk middleware integration |
| Styling | Tailwind CSS v4 + Lucide icons | Zero runtime CSS, utility classes co-located with components |
| Auth | Clerk | Hosted sign-up/sign-in, JWT issuance, email verification, test-mode support |
| Backend | Hono + TypeScript | Lightweight, typed, middleware-first REST framework |
| ORM | Drizzle + drizzle-kit | Fully typed SQL queries, plain SQL migrations easy to inspect and version |
| Database | Neon (hosted PostgreSQL) | Free tier, HTTP-compatible driver, matches assignment recommendation |
| Deployment | Vercel (frontend) + Railway (backend) | Free tier, automatic GitHub deploys, env var management via dashboards |
| CI | GitHub Actions | Type-check, lint, unit tests, Docker build, and integration smoke test on every push |
| Validation | Zod | Single source of truth for request body shapes on both frontend and backend |

---

## 6. What Is Working

- Clerk sign-up and sign-in for all five roles
- Onboarding screen — user picks a role, backend syncs the user record
- Server-side JWT verification and role enforcement on every protected endpoint (403 on wrong role)
- **Student:** views active sessions, marks attendance
- **Trainer:** creates sessions, views session attendance, generates and shares batch invite links
- **Institution:** views all batches and attendance summary per batch
- **Programme Manager:** programme-wide summary across all institutions with deterministic insights
- **Monitoring Officer:** read-only analytics dashboard — no create/edit/delete controls anywhere in the UI
- Invite link flow: Trainer generates token → Student joins batch via link
- GitHub Actions CI (typecheck, lint, tests, Docker build, smoke test)
- Railway deployment with Dockerfile and `/health` healthcheck
- Vercel deployment with automatic redeploys on push to `main`

---

## 7. What I Would Do Differently With More Time

Replace the manual `POST /api/me/sync` onboarding step with a **Clerk webhook** (`user.created` event). Currently the user must complete the onboarding form before any protected route works. With a webhook, the backend creates the user row the moment Clerk confirms sign-up — the onboarding screen becomes purely a role-selection UI, and the "User not synced" error path disappears entirely. It is the cleanest fix for the most friction-heavy part of the current flow.

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

Full API reference: [docs/API.md](docs/API.md)  
Deployment checklist: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
