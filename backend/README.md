# SkillBridge Backend

Hono + TypeScript REST API for the SkillBridge Attendance assignment.

## What This Backend Does

- Verifies Clerk bearer tokens on protected routes.
- Loads the local SkillBridge user from PostgreSQL after token verification.
- Enforces role permissions server-side.
- Stores institutions, users, batches, trainer/student batch membership, sessions, invite links, and attendance.
- Exposes assignment-required REST endpoints under `/api`.
- Provides deterministic attendance insights without requiring paid AI API credentials.
- Runs locally with Docker Compose or against Neon PostgreSQL.

## Commands

```powershell
npm install
npm run typecheck
npm test
npm run build
npm audit
npm run dev
```

## Local Docker Database

Start Postgres, run migrations, and start the API:

```powershell
docker compose up --build -d
```

Seed demo data:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skillbridge"
$env:CLERK_SECRET_KEY="sk_test_dummy_key_for_seed"
$env:CLERK_PUBLISHABLE_KEY="pk_test_dummy_key_for_seed"
$env:FRONTEND_URL="http://localhost:3000"
npm run db:seed
```

Check health:

```powershell
curl http://localhost:4000/health
```

Stop the stack:

```powershell
docker compose down
```

## Authentication For Postman

Protected routes require:

```text
Authorization: Bearer <clerk-session-token>
```

How to get the token once the frontend has Clerk login:

1. Log in through the frontend.
2. Open browser DevTools Console.
3. Run:

```javascript
await window.Clerk.session.getToken()
```

4. Copy the returned token into Postman.
5. In Postman, set `Authorization` type to `Bearer Token`, then paste the token.

If the token is valid but `/api/me` returns `User not synced with database`, call `POST /api/me/sync` first.

## Core API

Base URL:

```text
http://localhost:4000
```

### Public

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | API metadata. |
| GET | `/health` | Health check for Docker, Railway, and uptime checks. |

### User Sync

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/me` | Any synced user | Current user profile. |
| POST | `/api/me/sync` | Any signed-in Clerk user | Create/update local app user. |

`POST /api/me/sync` body:

```json
{
  "name": "Alice Student",
  "email": "student@example.com",
  "role": "STUDENT"
}
```

### Batches

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/batches` | Student, Trainer, Institution | Role-aware batch list. |
| POST | `/api/batches` | Trainer, Institution | Create batch. |
| POST | `/api/batches/:id/invite` | Trainer | Create reusable or limited invite token. |
| POST | `/api/batches/:id/join` | Student | Join batch with invite token. |
| GET | `/api/batches/:id/summary` | Institution | Batch attendance summary. |

Create batch body:

```json
{
  "name": "Frontend Engineering Cohort 1"
}
```

Create invite body:

```json
{
  "reusable": true,
  "maxUses": 30,
  "expiresAt": "2026-05-01T18:30:00.000Z"
}
```

Join batch body:

```json
{
  "token": "invite_token_here"
}
```

### Sessions

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/sessions/active` | Student | Active sessions for enrolled batches. |
| POST | `/api/sessions` | Trainer | Create session. |
| GET | `/api/sessions/:id` | Trainer | Session details. |
| GET | `/api/sessions/:id/attendance` | Trainer | Full attendance list with absent students inferred. |

Create session body:

```json
{
  "batchId": "batch_id_here",
  "title": "Intro to React",
  "date": "2026-04-21",
  "startTime": "10:00",
  "endTime": "12:00"
}
```

### Attendance

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/attendance/mark` | Student | Mark own attendance for an active enrolled session. |
| POST | `/api/attendance/override` | Trainer | Override a student's attendance for trainer-owned session. |

Mark attendance body:

```json
{
  "sessionId": "session_id_here",
  "status": "PRESENT"
}
```

### Programme Summaries

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/institutions/:id/summary` | Programme Manager | Institution-level summary. |
| GET | `/api/programme/summary` | Programme Manager, Monitoring Officer | Programme-wide summary and insights. |
| GET | `/api/programme/monitoring` | Monitoring Officer | Read-only monitoring alias. |
| GET | `/api/programme/manager-insights` | Programme Manager | Insights alias. |

## Expected Auth Errors

| Status | Meaning |
| --- | --- |
| 401 | Missing, invalid, expired, or unsynced Clerk token. |
| 403 | Authenticated user has the wrong role or does not own the resource. |
| 404 | Resource does not exist. |
| 409 | Duplicate attendance mark. |

## Verified

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit`
- `docker build -t skillbridge-api:local .`
- `docker compose up --build -d`
- `npm run db:seed`
- `GET /health`
- Local database row counts after seed
