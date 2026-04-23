# SkillBridge Attendance

SkillBridge Attendance is a deployed full-stack prototype for the fictional SkillBridge skilling programme. It supports five roles - Student, Trainer, Institution, Programme Manager, and Monitoring Officer - with Clerk authentication, role-specific dashboards, server-side authorization, and real PostgreSQL-backed attendance data.

This repository was built for the Sustainable Living Lab full-stack developer intern take-home assignment. Per the assignment brief, the scenario is fictional and the goal is to show product judgment, delivery quality, and clear communication rather than pretend this is a production system.

## 1. Live URLs

| Service | URL |
| --- | --- |
| Frontend | https://skillbridge-attendance.vercel.app |
| Backend | https://skillbridge-attendance-production.up.railway.app |
| API base URL | https://skillbridge-attendance-production.up.railway.app |
| Health check | https://skillbridge-attendance-production.up.railway.app/health |

## 2. Test Accounts

All seeded reviewer accounts use the same password:

```text
SkillBridge@2026!
```

If Clerk asks for a verification code during test-mode review, use:

```text
424242
```

| Role | Email | Password | Direct sign-in |
| --- | --- | --- | --- |
| Student | `student+clerk_test@skillbridge.dev` | `SkillBridge@2026!` | `/sign-in?role=student` |
| Trainer | `trainer+clerk_test@skillbridge.dev` | `SkillBridge@2026!` | `/sign-in?role=trainer` |
| Institution | `institution+clerk_test@skillbridge.dev` | `SkillBridge@2026!` | `/sign-in?role=institution` |
| Programme Manager | `manager+clerk_test@skillbridge.dev` | `SkillBridge@2026!` | `/sign-in?role=programme-manager` |
| Monitoring Officer | `monitor+clerk_test@skillbridge.dev` | `SkillBridge@2026!` | `/sign-in?role=monitoring-officer` |

Reviewer flow:

1. Open [skillbridge-attendance.vercel.app/sign-in](https://skillbridge-attendance.vercel.app/sign-in).
2. Choose the role card you want to review so the seeded email auto-fills.
3. Enter the password for that account.
4. If Clerk asks for a code, use `424242`.
5. You should land on the dashboard for that exact role with seeded data.

## 3. Setup Instructions For Local Development

### Prerequisites

- Node.js 20+
- Docker Desktop
- A Clerk application or Clerk test keys

### Install Dependencies

```bash
npm install --prefix frontend
npm install --prefix backend
```

### Create Environment Files

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

Frontend environment:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

Backend environment:

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

### Start The Local Database And Seed Demo Data

```bash
docker compose -f backend/docker-compose.yml up -d
cd backend
npm run db:migrate
npm run db:seed
npm run accounts:seed
```

### Run The Backend

```bash
cd backend
npm run dev
```

### Run The Frontend

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

### Postman / API Authentication

Protected routes require:

```text
Authorization: Bearer <Clerk session JWT>
```

For deployed API testing, sign in on the frontend and copy the bearer token or `Authorization` header from the browser network tab.

For local development only, the backend seed creates dev shortcut tokens:

| Role | Local token |
| --- | --- |
| Student | `user_seed_student` |
| Trainer | `user_seed_trainer` |
| Institution | `user_seed_institution` |
| Programme Manager | `user_seed_manager` |
| Monitoring Officer | `user_seed_monitor` |

Example:

```text
GET http://localhost:4000/api/sessions/active
Authorization: Bearer user_seed_student
```

Detailed API docs: [docs/API.md](docs/API.md)

## 4. Schema Decisions

The backend keeps Clerk identity and application authorization separate. `users.clerk_user_id` stores the Clerk subject, while the local `role` and optional `institution_id` determine what that user is allowed to do inside SkillBridge. Every protected request resolves the local user row server-side before route logic runs.

`institutions` is its own table because Institution users, Trainers, Batches, and Programme summaries all need a shared scope. This makes institution-level reporting straightforward and keeps role boundaries clear.

`batch_trainers` and `batch_students` are join tables instead of array fields so the system can support many-to-many trainer assignment and student enrolment cleanly.

`sessions` stores `date`, `start_time`, and `end_time` in simple programme-local values. The backend then uses `PROGRAMME_TIME_ZONE` to decide whether attendance marking is currently allowed.

`attendance` enforces one row per `(session_id, student_id)` so the same student cannot create duplicate attendance records for the same session.

`batch_invites` stores trainer-generated join tokens so a student can be attached to the correct batch during onboarding or later self-enrolment.

## 5. Stack Choices

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 16 App Router + React 19 | Strong fit for Vercel, App Router Clerk support, clean routing/layouts |
| UI | Tailwind CSS v4 + Lucide icons | Fast to iterate, reusable design system, low dependency weight |
| Auth | Clerk | Hosted auth, email/password flow, role-aware onboarding support |
| Backend | Hono + TypeScript | Lightweight REST API, fast to develop, strong middleware ergonomics |
| ORM | Drizzle ORM | Typed schema, explicit SQL-friendly relationships, easy migrations |
| Database | Neon PostgreSQL | Hosted Postgres on free tier, matches assignment recommendations |
| Deployment | Vercel + Railway | Vercel for frontend, Railway for Dockerized backend |
| Validation | Zod | Strong request validation at API boundaries |
| CI/CD | GitHub Actions | Automated lint, typecheck, test, build, integration, and Docker verification |

This is close to the recommended stack in the PDF, with Hono + Drizzle used instead of Express + Prisma because the project was already shaped around a lighter typed API and SQL-first modeling style.

## 6. What Is Fully Working

- Clerk sign-up and sign-in flow for all five roles.
- Role selection during onboarding and backend user sync.
- Server-side JWT verification plus role checks on protected endpoints.
- Student batch join flow and active session attendance marking.
- Trainer batch creation, invite generation, session creation, and attendance review/override.
- Institution dashboard with scoped batches, trainers, students, and attendance summaries.
- Programme Manager dashboards for programme-wide and institution-level review.
- Monitoring Officer read-only workspace with no create/edit/delete actions.
- Seeded demo accounts and seeded attendance data for reviewer testing.
- Frontend deployed on Vercel and backend deployed on Railway.
- GitHub Actions CI covering frontend checks, backend checks, integration smoke tests, and Docker build verification.

Assignment-to-implementation map: [docs/ASSIGNMENT_CHECKLIST.md](docs/ASSIGNMENT_CHECKLIST.md)

## 7. What Is Partial Or Skipped

- Clerk user creation is finalized through the onboarding sync route rather than a Clerk webhook.
- Invite links are copied manually from the UI instead of being emailed.
- AI insights are deterministic summary recommendations, not live LLM-generated insights.
- No audit-log history table has been added yet.
- No full Playwright end-to-end suite is checked into the repo yet.

## 8. One Thing I Would Do Differently With More Time

I would add a proper Clerk webhook-based user provisioning flow so the local user row is created immediately when a Clerk account is created. That would remove the only mildly fragile part of onboarding and make the auth-to-dashboard handoff feel fully automatic.

## Submission Format

The assignment asks for a Google Drive folder with this structure:

```text
/submission
  CONTACT.txt
  /backend
  /frontend
  README.md
```

For your final handoff:

1. Create a folder named `submission`.
2. Copy these items into it:
   - `CONTACT.txt`
   - `backend/`
   - `frontend/`
   - `README.md`
3. Do not upload a zip inside another zip.
4. Do not submit a Notion page instead of the files.
5. Keep the GitHub repo live with commit history in case they review it alongside the Drive folder.

`CONTACT.txt` in this repo already includes:

- Full name
- Email
- Phone
- GitHub profile link
- One sentence about the hardest part of the build

## How To Submit

The assignment says:

- Role: Full Stack Developer Intern
- Time allowed: 3 days from receipt
- Submission: share a Google Drive folder link with `maria@sustainablelivinglab.org`

Recommended submission steps:

1. Create the `submission` folder using the exact structure above.
2. Upload it to Google Drive.
3. Set Drive sharing so the reviewer can open the folder.
4. Email the Drive link to `maria@sustainablelivinglab.org`.
5. Include your GitHub repository link in the email body as a backup reference.

Simple email template:

```text
Subject: SkillBridge Attendance Take-Home Submission - Hemanth Kumar

Hi Maria,

Please find my submission for the Full Stack Developer Intern take-home assignment here:
[Google Drive folder link]

GitHub repository:
https://github.com/ByteAcumen/skillbridge-attendance

The Drive folder includes CONTACT.txt, backend, frontend, and README.md as requested.

Best,
Hemanth Kumar
```

## Project Structure

```text
skillbridge-attendance/
  backend/            Hono + Drizzle REST API
  frontend/           Next.js App Router frontend
  docs/               API, deployment, planning, and assignment notes
  .github/workflows/  CI/CD workflows
  CONTACT.txt
  README.md
```
