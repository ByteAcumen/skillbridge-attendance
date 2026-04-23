# SkillBridge Attendance

Full-stack attendance management prototype for a fictional state-level skilling programme. Students, Trainers, Institutions, Programme Managers, and Monitoring Officers sign in with Clerk, land in role-specific dashboards, and work with real API-backed PostgreSQL data.

## 1. Live URLs

| Service | URL |
| --- | --- |
| Frontend | https://skillbridge-attendance.vercel.app |
| Backend | https://skillbridge-attendance-production.up.railway.app |
| API base URL | https://skillbridge-attendance-production.up.railway.app |
| Health check | https://skillbridge-attendance-production.up.railway.app/health |

## 2. Test Accounts

All reviewer accounts use:

```text
Password: SkillBridge@2026!
Verification code (if Clerk asks): 424242
```

| Role | Direct sign-in | Email | Seeded data |
| --- | --- | --- | --- |
| Student | `/sign-in?role=student` | `student+clerk_test@skillbridge.dev` | Enrolled in the demo cohort with one active session |
| Trainer | `/sign-in?role=trainer` | `trainer+clerk_test@skillbridge.dev` | Manages the demo cohort and can create sessions/invites |
| Institution | `/sign-in?role=institution` | `institution+clerk_test@skillbridge.dev` | Scoped to State Polytechnic Institute |
| Programme Manager | `/sign-in?role=programme-manager` | `manager+clerk_test@skillbridge.dev` | Can view programme and institution summaries |
| Monitoring Officer | `/sign-in?role=monitoring-officer` | `monitor+clerk_test@skillbridge.dev` | Read-only programme and institution oversight |

Sign-in flow:

1. Open https://skillbridge-attendance.vercel.app/sign-in
2. Click the role you want to review - the email address auto-fills.
3. Enter the password above and click Continue.
4. Clerk may send a one-time code to the account inbox for new-device verification.
5. You will land on that role's live dashboard with real seeded data.


## 3. Local Setup

Prerequisites:

- Node.js 20+
- Docker Desktop
- Clerk dev/test keys

Install dependencies:

```bash
npm install --prefix frontend
npm install --prefix backend
```

Create environment files:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Frontend env:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

Backend env:

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

Start Postgres and seed local data:

```bash
docker compose -f backend/docker-compose.yml up -d
cd backend
npm run db:migrate
npm run db:seed
npm run accounts:seed
```

Run the apps:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Frontend: http://localhost:3000

Backend: http://localhost:4000

## 4. API Auth And Postman

Protected endpoints require:

```text
Authorization: Bearer <Clerk session JWT>
```

For deployed Railway API testing, sign in on the frontend, open browser DevTools, and copy the `Authorization` header from any API request to Postman. Production does not accept fake seed tokens.

For local development only (`NODE_ENV=development` or `test`), `npm run db:seed` creates dev backdoor tokens:

| Role | Local token |
| --- | --- |
| Student | `user_seed_student` |
| Trainer | `user_seed_trainer` |
| Institution | `user_seed_institution` |
| Programme Manager | `user_seed_manager` |
| Monitoring Officer | `user_seed_monitor` |

Example local Postman request:

```text
GET http://localhost:4000/api/sessions/active
Authorization: Bearer user_seed_student
```

Full endpoint reference: [docs/API.md](docs/API.md)

## 5. Schema Decisions

`users` stores Clerk's user id in `clerk_user_id`, plus the application role and optional `institution_id`. The backend looks up this row on every protected request, so authorization is enforced server-side instead of trusting the frontend.

`institutions` is a real table because batches, trainers, and institution users need a shared scope. Trainers and Institution users created through the prototype onboarding are linked to the demo institution so their dashboards work immediately.

`batch_trainers` and `batch_students` are join tables. This supports multiple trainers per batch and multiple batches per student without storing arrays in a single column.

`sessions` stores `date`, `start_time`, and `end_time` as simple programme-local values. The backend uses `PROGRAMME_TIME_ZONE` to decide whether a student can mark attendance for an active session.

`attendance` has a unique `(session_id, student_id)` constraint. Marking attendance upserts the row, which prevents double-counting and lets a student correct a mark during the live session window.

`batch_invites` stores reusable tokens for trainer-generated student onboarding links. The demo token is `skillbridge-demo`.

## 6. Stack Choices

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 App Router + React 19 | Vercel-native routing, Clerk App Router support, fast deployment |
| UI | Tailwind CSS v4 + Lucide icons | Clean reusable components with no extra UI runtime |
| Auth | Clerk | Hosted sign-in/sign-up, test mode, session JWTs |
| Backend | Hono + TypeScript | Small, fast REST API with typed middleware |
| ORM | Drizzle ORM | Typed SQL schema and readable migrations |
| Database | Neon PostgreSQL | Free-tier hosted Postgres, matches assignment recommendation |
| Deployment | Vercel + Railway | Frontend on Vercel, Dockerized API on Railway |
| CI/CD | GitHub Actions | Lint/typecheck/test/build/Docker verification on push |
| Validation | Zod | Request validation at API boundaries |

## 7. Deployment Notes

Frontend is deployed from `frontend/` on Vercel.

Backend is deployed from `backend/` on Railway with the Dockerfile builder. `backend/railway.json` points Railway to `./Dockerfile`, starts `node dist/index.js`, and health-checks `/health`.

To bootstrap demo accounts on Railway, add this backend environment variable before a redeploy:

```text
SEED_DEMO_DATA=true
```

That runs `node dist/db/test-accounts.js` before the server starts. After the first successful seed, you may set it back to `false` if you want reviewer actions to persist instead of being refreshed on every deploy.

Deployment guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 8. What Is Working

- Clerk sign-up and sign-in for all five roles.
- Role-specific sign-in/sign-up URLs with seeded demo credentials.
- Onboarding screen that syncs Clerk users into the backend database.
- Server-side JWT verification and role checks on protected API routes.
- Student active sessions, batch join, and attendance marking.
- Trainer batch creation, session creation, invite generation, and attendance review.
- Institution batch and attendance summaries.
- Programme Manager programme/institution summaries and deterministic insight card.
- Monitoring Officer read-only dashboard with no create/edit/delete actions.
- Role dashboards now show institution, batch, roster, active-session, and data-sync context.
- Dockerized backend, Railway health checks, and GitHub Actions CI.

Detailed assignment coverage: [docs/ASSIGNMENT_CHECKLIST.md](docs/ASSIGNMENT_CHECKLIST.md)

## 9. Partial Or Skipped

- Clerk user creation is synced by the onboarding form, not by a Clerk webhook yet.
- AI insights are deterministic and free-tier safe, not LLM-generated text.
- Invite links expose tokens in the UI instead of sending emails.
- No audit log table yet.
- No Playwright end-to-end suite yet; backend tests and manual role smoke tests are used.

## 10. What I Would Improve With More Time

I would add a Clerk `user.created` webhook so the backend user row is created immediately after sign-up. That would remove the only fragile onboarding step and make role setup feel instant.

## Project Structure

```text
skillbridge-attendance/
  frontend/           Next.js App Router frontend
  backend/            Hono + Drizzle REST API
  docs/               API reference, deployment notes, plan
  .github/workflows/  CI and CD pipelines
  CONTACT.txt
  README.md
```
