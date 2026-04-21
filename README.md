# SkillBridge Attendance

SkillBridge Attendance is a deployed full-stack prototype for the Full Stack Developer Intern take-home assignment. It models a fictional state-level skilling programme where Students, Trainers, Institutions, Programme Managers, and Monitoring Officers interact with real attendance data through role-specific dashboards.

The goal is a practical MVP: secure authentication, server-side role checks, real PostgreSQL-backed data, clear deployment steps, and honest documentation.

## Live URLs

| Service | URL |
| --- | --- |
| Frontend | TBD |
| Backend | TBD |
| API base URL | TBD |

## Test Accounts

These accounts will be created after Clerk and the seed script are configured.

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@skillbridge.test` | TBD |
| Trainer | `trainer@skillbridge.test` | TBD |
| Institution | `institution@skillbridge.test` | TBD |
| Programme Manager | `manager@skillbridge.test` | TBD |
| Monitoring Officer | `monitor@skillbridge.test` | TBD |

## Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React, Vite, TypeScript | Fast local development, clean deployment to Vercel, strong typing for role-specific UI. |
| UI | Tailwind CSS, lucide-react, reusable components | Professional interface without heavy design-system overhead. |
| Backend | Node.js, Hono, TypeScript | Small, fast REST API that maps directly to the assignment endpoints. |
| Database | Neon/PostgreSQL, Drizzle ORM | Hosted Postgres free tier, local Docker Postgres support, typed schema, migrations, and seed data. |
| Auth | Clerk | Signup/login, hosted auth UI support, and backend token verification. |
| Deployment | Vercel frontend, Railway backend, Render fallback | Matches the recommended stack and stays free-tier friendly for a prototype. |
| CI/CD | GitHub Actions | Lint, typecheck, test, and build checks before deployment. |
| AI-first addition | Deterministic AI Insights card with optional LLM polishing | Shows AI judgment while keeping the app deployable without paid API credits. |

## Core Features Planned

- Role-based signup and login for all five roles.
- Backend verification of Clerk tokens and local user roles on every protected API route.
- Student dashboard for active sessions and self-marking attendance.
- Trainer dashboard for batch management, invite links, session creation, and attendance views.
- Institution dashboard for trainers, batches, and attendance summaries.
- Programme Manager dashboard for cross-institution summaries.
- Monitoring Officer dashboard with read-only programme-wide attendance rates.
- AI Insights card that summarizes attendance risks and recommendations from real data.

## Project Structure

```text
skillbridge-attendance/
  backend/             Express API, Prisma schema, tests
  frontend/            Vite React app
  docs/                Planning, API, and deployment notes
  .github/workflows/   CI pipeline
  CONTACT.txt          Submission contact details placeholder
  README.md
```

## Local Setup

Prerequisites:

- Node.js 22.12 or newer
- npm
- Git
- Clerk account
- Neon PostgreSQL database

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

Run the frontend:

```powershell
npm run dev:frontend
```

Run the backend:

```powershell
npm run dev:backend
```

Run checks:

```powershell
npm run typecheck
npm test
npm run build
```

## Deployment Plan

- Vercel deploys `/frontend`.
- Railway deploys `/backend`.
- Render can deploy `/backend` if Railway credits are unavailable.
- Neon hosts PostgreSQL.
- Clerk manages authentication.
- GitHub Actions runs checks on push and pull requests.

Environment variables are documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Schema Decisions

The assignment's required entities are preserved: users, batches, batch trainers, batch students, sessions, and attendance. Two support tables are planned:

- `institutions`: makes institution ownership explicit instead of overloading user records.
- `batch_invites`: stores reusable or one-time invite tokens for student onboarding.

Prisma models use camelCase in TypeScript and map to snake_case database columns where useful, keeping code readable while matching the assignment vocabulary.

## Current Status

Working:

- Repository scaffold.
- React/Vite frontend setup.
- Hono/TypeScript backend setup with health endpoint.
- Drizzle schema and migrations for the assignment data model.
- README, planning docs, deployment checklist, and CI workflow.

Next:

- Clerk signup/login and role sync.
- Protected REST API routes.
- Role dashboards and real data flows.
- Seed data and test accounts.
- Vercel, Railway/Render, Neon, and Clerk production configuration.

Skipped for now:

- Pixel-perfect UI.
- Enterprise-grade audit logging.
- Paid AI API dependency.

## What I Would Improve With More Time

I would add institution onboarding workflows, richer attendance anomaly detection, audit logs for all mutations, and Playwright end-to-end tests covering the complete deployed demo flow.
