# SkillBridge Backend

Backend API for the SkillBridge Attendance assignment. This service is built with Hono, TypeScript, Drizzle ORM, and PostgreSQL, and it is responsible for authentication verification, role-based authorization, attendance logic, and programme summaries.

The assignment-facing overview, live URLs, and reviewer accounts live in the root [README.md](../README.md). This file is the backend-focused companion.

## What The Backend Does

- Verifies Clerk bearer tokens on protected routes.
- Loads the synced local user from PostgreSQL.
- Enforces role permissions server-side.
- Stores institutions, users, batches, trainer/student batch membership, sessions, invite links, and attendance.
- Exposes the assignment-required REST endpoints under `/api`.
- Provides deterministic programme insight summaries without requiring paid AI credentials.
- Supports local seed tokens for Postman and local testing.
- Supports Docker/Railway deployment and demo account seeding.

## Main Commands

```powershell
npm install
npm run typecheck
npm test
npm run build
npm audit
npm run dev
npm run db:migrate
npm run db:seed
npm run accounts:seed
```

## Local Setup

1. Copy `.env.example` to `.env`.
2. Set:

```text
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillbridge
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
FRONTEND_URL=http://localhost:3000
PROGRAMME_TIME_ZONE=Asia/Kolkata
SEED_DEMO_DATA=false
TEST_ACCOUNT_PASSWORD=SkillBridge@2026!
```

3. Start the database:

```powershell
docker compose up --build -d
```

4. Run migrations and seed data:

```powershell
npm run db:migrate
npm run db:seed
npm run accounts:seed
```

5. Start the API:

```powershell
npm run dev
```

Health check:

```powershell
curl http://localhost:4000/health
```

## Authentication For Postman

Protected routes require:

```text
Authorization: Bearer <Clerk session JWT>
```

Production and Railway require a real Clerk JWT.

For local development only, these shortcut tokens are accepted:

```text
user_seed_student
user_seed_trainer
user_seed_institution
user_seed_manager
user_seed_monitor
```

Example:

```text
GET http://localhost:4000/api/programme/summary
Authorization: Bearer user_seed_manager
```

## Core API Areas

| Area | Example endpoints |
| --- | --- |
| User sync | `GET /api/me`, `POST /api/me/sync` |
| Batches | `GET /api/batches`, `POST /api/batches`, `POST /api/batches/:id/join` |
| Sessions | `GET /api/sessions`, `GET /api/sessions/active`, `POST /api/sessions` |
| Attendance | `POST /api/attendance/mark`, `POST /api/attendance/override` |
| Institutions | `GET /api/institutions`, `GET /api/institutions/:id/summary` |
| Programme | `GET /api/programme/summary` |

Full reference: [../docs/API.md](../docs/API.md)

## Deployment Notes

- Railway uses `backend/railway.json` and the backend Dockerfile.
- Health check endpoint: `/health`
- Demo reviewer accounts can be created at deploy time with:

```text
SEED_DEMO_DATA=true
```

Detailed deployment steps: [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)

## Verification

Verified locally and in CI:

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit`
- Docker image build in GitHub Actions
- Backend integration smoke tests in GitHub Actions
