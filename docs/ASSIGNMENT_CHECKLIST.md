# Assignment Checklist

This maps the PDF requirements to the current SkillBridge implementation.

## Submission Files

| Requirement | Status | Location |
| --- | --- | --- |
| `CONTACT.txt` with name, email, phone, GitHub, challenge note | Done | `CONTACT.txt` |
| Frontend source | Done | `frontend/` |
| Backend source | Done | `backend/` |
| Recruiter-friendly README | Done | `README.md` |
| Commit history | Done | GitHub repository |

## Task Coverage

| PDF task | Status | Notes |
| --- | --- | --- |
| Five roles can sign up and log in | Done | Clerk App Router sign-in/sign-up pages with role-aware onboarding |
| User selects role on sign-up | Done | `/onboarding` syncs role into the backend user row |
| Role-specific dashboards | Done | Student, Trainer, Institution, Programme Manager, Monitoring Officer |
| Backend verifies auth and role on protected calls | Done | `requireAuth` plus `requireRole` middleware on API routes |
| Trainer invite link for students | Done | `POST /api/batches/:id/invite`, student joins with batch ID plus token |
| Required data model | Done | Drizzle schema includes users, institutions, batches, join tables, sessions, attendance, invites |
| Required REST endpoints | Done | See `docs/API.md` assignment endpoint map |
| Student active sessions and attendance mark | Done | Student dashboard and `/api/sessions/active`, `/api/attendance/mark` |
| Trainer session creation and attendance review | Done | Trainer dashboard and `/api/sessions`, `/api/sessions/:id/attendance` |
| Institution batch and trainer/student view | Done | Institution dashboard loads scoped batches, trainers, students, summary rows |
| Programme Manager summary | Done | Programme dashboard and `/api/programme/summary` |
| Monitoring Officer read-only dashboard | Done | No create/edit/delete controls in monitoring UI |
| Public deployment | Done | Frontend on Vercel, backend on Railway, DB on Neon |
| Test accounts in README | Done | Five reviewer accounts and shared password documented |

## Verification

| Area | Command or check |
| --- | --- |
| Frontend lint | `npm run lint --prefix frontend` |
| Frontend typecheck | `npm run typecheck --prefix frontend` |
| Frontend build | `npm run build --prefix frontend` |
| Backend typecheck | `npm run typecheck --prefix backend` |
| Backend tests | `npm test --prefix backend` |
| Backend build | `npm run build --prefix backend` |
| CI | GitHub Actions `SkillBridge CI` |
| API health | `GET /health` |

## Honest Limitations

- Clerk user creation is synced through onboarding, not a webhook.
- AI insights are deterministic so the project remains free-tier safe.
- Invite links are copied manually instead of emailed.
- Playwright end-to-end tests are not committed yet.
