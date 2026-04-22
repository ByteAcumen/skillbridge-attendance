# Backend Reference

## Overview

The backend is a Hono REST API running on Node.js 22. It verifies Clerk tokens, loads the synced local user from PostgreSQL, checks the user role, then runs the route logic through Drizzle ORM.

```text
Request
  -> Hono app middleware
  -> Clerk token verification
  -> DB user lookup
  -> role guard
  -> route handler
  -> Drizzle/PostgreSQL
```

## Main Files

| File | Purpose |
| --- | --- |
| `src/index.ts` | Starts server, verifies DB, graceful shutdown |
| `src/app.ts` | Hono app, middleware, route mounting |
| `src/lib/env.ts` | Zod environment validation |
| `src/lib/clerk.ts` | Clerk token resolution and dev token support |
| `src/middleware/auth.ts` | Requires valid auth and synced DB user |
| `src/middleware/requireRole.ts` | Role authorization guard |
| `src/db/schema.ts` | Drizzle schema and relationships |
| `src/db/seed.ts` | Resets DB and inserts Postman demo data |
| `src/db/test-accounts.ts` | Creates Clerk UI test accounts and DB mappings |

## Auth Flow

1. Frontend signs the user in with Clerk.
2. Frontend sends `Authorization: Bearer <Clerk session token>`.
3. Backend verifies the token with `CLERK_SECRET_KEY`.
4. Backend finds `users.clerk_user_id = token.sub`.
5. Route-level `requireRole(...)` checks permissions.

Development also supports seed tokens:

```text
Authorization: Bearer user_seed_student
```

This shortcut is disabled when `NODE_ENV=production`.

## Database

Core tables:

- `institutions`
- `users`
- `batches`
- `batch_trainers`
- `batch_students`
- `batch_invites`
- `sessions`
- `attendance`

Important constraints:

- One attendance row per `(session_id, student_id)`.
- One user row per Clerk user ID.
- Trainers can only operate on batches they manage.
- Institution users can only see their own institution.

## Commands

```bash
npm run dev
npm run build
npm start
npm run typecheck
npm test
npm run test:coverage
npm run db:migrate
npm run db:seed
npm run accounts:seed
```

## Local Smoke Test

```bash
curl http://localhost:4000/health
curl -H "Authorization: Bearer user_seed_student" http://localhost:4000/api/me
curl -H "Authorization: Bearer user_seed_manager" http://localhost:4000/api/programme/summary
```

## Docker

```bash
docker build -t skillbridge-api:local .
docker compose up --build
docker compose run --rm migrate sh -c "npm run db:seed"
docker compose run --rm migrate sh -c "npm run accounts:seed"
curl http://localhost:4000/health
```

## Common Issues

### `Invalid or expired token`

Most common causes:

- Frontend and backend are using keys from different Clerk apps.
- System clock is out of sync.
- User exists in Clerk but has not been synced into the local `users` table.

The backend allows a 60-second clock skew when verifying Clerk tokens to make local development less brittle.

### `User not synced with database`

Run onboarding or use a seeded test account created by:

```bash
npm run accounts:seed
```

### Port 4000 busy

Windows:

```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess -Force
```
