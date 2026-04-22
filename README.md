# SkillBridge Attendance

SkillBridge Attendance is a full-stack prototype for a fictional state-level skilling programme. It supports five roles: Student, Trainer, Institution, Programme Manager, and Monitoring Officer. Each role signs in with Clerk, then sees a focused dashboard backed by real REST API calls and PostgreSQL data.

This project was built for a 2-3 day take-home assignment, so the priority is a working, honest, deployable MVP rather than a polished enterprise product.

## Live URLs

| Service | URL |
| --- | --- |
| Frontend | TBD |
| Backend | TBD |
| API base URL | TBD |

## Current Local URLs

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:4000` |
| Health check | `http://localhost:4000/health` |

## Test Accounts

These are Clerk development test accounts. If Clerk asks for an email verification or new-device code, use:

```text
424242
```

Password for all accounts:

```text
SkillBridge@2026!
```

| Role | Email |
| --- | --- |
| Student | `student+clerk_test@example.com` |
| Trainer | `trainer+clerk_test@example.com` |
| Institution | `institution+clerk_test@example.com` |
| Programme Manager | `manager+clerk_test@example.com` |
| Monitoring Officer | `monitor+clerk_test@example.com` |

Recreate or refresh these accounts:

```powershell
cd D:\skillbridge-attendance\backend
npm run accounts:seed
```

## Tech Stack

| Layer | Tooling | Why |
| --- | --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript | Vercel-ready UI with clean routing and modern React. |
| Styling | Tailwind CSS v4, Lucide icons, reusable components | Professional interface without heavy UI dependencies. |
| Auth | Clerk | Hosted sign-in/sign-up, JWTs, user management, test-mode accounts. |
| Backend | Hono, TypeScript, Zod | Fast REST API with simple route/middleware structure. |
| Database | PostgreSQL, Drizzle ORM | Real relational schema with typed queries and migrations. |
| Dev database | Docker Postgres | Local reproducible database. |
| Deployment | Vercel frontend, Railway/Render backend, Neon DB | Free-tier friendly assignment stack. |
| CI/CD | GitHub Actions | Frontend, backend, Docker build, and integration smoke checks. |
| AI feature | Deterministic insights card | AI-style recommendations without requiring paid LLM keys. |

## What Works

- Clerk sign-up and sign-in.
- Role onboarding through `POST /api/me/sync`.
- Server-side token verification and role authorization.
- Student active sessions and attendance marking.
- Trainer batch/session creation, invite generation, and attendance views.
- Institution batch summaries.
- Programme Manager programme and institution summaries.
- Monitoring Officer read-only analytics.
- Dev Postman tokens for quick API testing.
- Docker backend build and compose setup.
- GitHub Actions CI for frontend, backend, Docker, and integration checks.

## Project Structure

```text
skillbridge-attendance/
  frontend/             Next.js App Router frontend
  backend/              Hono + Drizzle REST API
  docs/                 Plan, API reference, deployment notes
  .github/workflows/    CI pipeline
  CONTACT.txt
  README.md
```

## Local Setup

Install dependencies:

```powershell
cd D:\skillbridge-attendance
npm install --prefix frontend
npm install --prefix backend
```

Create environment files:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
Copy-Item backend\.env.example backend\.env
```

Make sure frontend and backend use the same Clerk app:

```text
frontend/.env.local
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
  CLERK_SECRET_KEY=...
  NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

backend/.env
  CLERK_PUBLISHABLE_KEY=...
  CLERK_SECRET_KEY=...
  FRONTEND_URL=http://localhost:3000
```

Prepare the database:

```powershell
cd D:\skillbridge-attendance\backend
npm run db:migrate
npm run db:seed
npm run accounts:seed
```

Run backend:

```powershell
cd D:\skillbridge-attendance\backend
npm run dev
```

Run frontend:

```powershell
cd D:\skillbridge-attendance\frontend
npm run dev
```

## API Testing

For Postman, use:

```text
Authorization: Bearer user_seed_student
```

Dev tokens:

| Token | Role |
| --- | --- |
| `user_seed_student` | Student |
| `user_seed_trainer` | Trainer |
| `user_seed_institution` | Institution |
| `user_seed_manager` | Programme Manager |
| `user_seed_monitor` | Monitoring Officer |

Full API reference: [docs/API.md](docs/API.md).

## Verification

Frontend:

```powershell
cd D:\skillbridge-attendance\frontend
npm run lint
npm run typecheck
npm run build
```

Backend:

```powershell
cd D:\skillbridge-attendance\backend
npm run typecheck
npm test
npm run build
```

Docker backend:

```powershell
cd D:\skillbridge-attendance\backend
docker build -t skillbridge-api:local .
docker compose up --build
docker compose run --rm migrate sh -c "npm run db:seed"
docker compose run --rm migrate sh -c "npm run accounts:seed"
```

## Deployment

- Vercel: deploy `frontend/`.
- Railway: deploy `backend/` with Dockerfile or `npm run build && npm start`.
- Render fallback: deploy `backend/` as a Web Service.
- Neon: hosted PostgreSQL.
- Clerk: auth provider for frontend/backend.

Deployment checklist: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## What I Would Improve With More Time

- Add Playwright E2E tests for all five roles.
- Add audit logs for every mutation.
- Add institution/trainer invitation workflows.
- Add production observability and error tracking.
- Add optional LLM-generated insight summaries behind a feature flag.
