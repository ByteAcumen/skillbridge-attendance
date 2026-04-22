# SkillBridge Attendance

SkillBridge Attendance is a full-stack prototype for a fictional state-level skilling programme. It supports five roles: Student, Trainer, Institution, Programme Manager, and Monitoring Officer. Each role signs in with Clerk, then sees a focused dashboard backed by real REST API calls and PostgreSQL data.

This project was built for a 2-3 day take-home assignment, so the priority is a working, honest, deployable MVP rather than a polished enterprise product.

## Live URLs

| Service | URL |
| --- | --- |
| Frontend | TBD - deploy `frontend/` to Vercel |
| Backend | TBD - deploy `backend/` to Railway or Render |
| API base URL | TBD - local default is `http://localhost:4000` |

The app is deployment-ready, but the final public URLs should be filled in after Vercel/Railway deployment.

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

## Seeded Demo Data

The seed scripts create enough real data to test every role immediately.

| Item | ID / Value | Used by |
| --- | --- | --- |
| Institution | `inst_demo_state_polytechnic` | Institution, Programme Manager, Monitoring Officer |
| Demo batch | `batch_demo_frontend_1` | Student, Trainer, Institution |
| Active demo session | `session_demo_active_react` | Student attendance marking |
| Clerk test batch | `batch_test_frontend_accounts` | Frontend login test accounts |
| Clerk test session | `session_test_active_accounts` | Frontend student dashboard |

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

## Assignment Alignment

| Requirement | Status | Notes |
| --- | --- | --- |
| Five roles can sign up and log in | Done | Clerk auth plus `/onboarding` role selection. |
| Role-specific dashboard routing | Done | `/dashboard` renders Student, Trainer, Institution, Programme Manager, or Monitoring Officer views. |
| Backend verifies auth and role | Done | Every protected route checks the bearer token and local role server-side. |
| Trainer batch invite links | Done | Trainers generate reusable invite tokens; students join batches with token + batch ID. |
| Required data model | Done | Users, batches, batch trainers, batch students, sessions, attendance, plus institutions and invites. |
| Required REST endpoints | Done | Implemented under a conventional `/api` prefix. Example: assignment `/batches` is `/api/batches`. |
| Real API-backed frontend data | Done | Dashboards call the backend; core role data is not hardcoded. |
| Monitoring Officer read-only access | Done | UI has no mutation controls and backend returns `403` for writes. |
| Deployment documentation | Done | Vercel, Railway, Render, Neon, and Clerk checklist included in `docs/DEPLOYMENT.md`. |
| CI/CD and Docker | Done | CI runs frontend/backend checks and Docker build; CD workflow is manual for Railway secrets. |

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

For real Clerk login testing, sign in with the test account email/password above. In the browser, Clerk issues a session token automatically; the frontend attaches it to API calls.

Dev tokens:

| Token | Role |
| --- | --- |
| `user_seed_student` | Student |
| `user_seed_trainer` | Trainer |
| `user_seed_institution` | Institution |
| `user_seed_manager` | Programme Manager |
| `user_seed_monitor` | Monitoring Officer |

Full API reference: [docs/API.md](docs/API.md).

Quick Postman examples:

| Goal | Method and URL | Token |
| --- | --- | --- |
| Current student profile | `GET http://localhost:4000/api/me` | `user_seed_student` |
| Student active sessions | `GET http://localhost:4000/api/sessions/active` | `user_seed_student` |
| Trainer batches | `GET http://localhost:4000/api/batches` | `user_seed_trainer` |
| Institution batch summary | `GET http://localhost:4000/api/batches/batch_demo_frontend_1/summary` | `user_seed_institution` |
| Programme summary | `GET http://localhost:4000/api/programme/summary` | `user_seed_manager` or `user_seed_monitor` |

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
- GitHub Actions: CI runs automatically; Railway CD can be triggered manually after adding repository secrets.

Deployment checklist: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Submission Notes

- Update the Live URLs section after deployment.
- Update `CONTACT.txt` with final personal contact details before uploading the Google Drive submission folder.
- Keep `.env`, `.env.local`, and hosted secrets out of GitHub.

## What I Would Improve With More Time

- Add Playwright E2E tests for all five roles.
- Add audit logs for every mutation.
- Add institution/trainer invitation workflows.
- Add production observability and error tracking.
- Add optional LLM-generated insight summaries behind a feature flag.
