# SkillBridge Attendance Build Plan

## Assignment Interpretation

The assignment values a working deployed prototype over a polished product. The implementation should prove five things clearly:

- All five roles can sign up and log in.
- Each role sees an appropriate dashboard.
- Protected API routes verify the authenticated user and role server-side.
- Data shown in the UI comes from the backend and PostgreSQL.
- The README is clear enough for a teammate or reviewer to run and verify the system.

## Stack

| Layer | Tooling |
| --- | --- |
| Frontend | Vite, React, TypeScript, Tailwind CSS |
| Backend | Express, TypeScript, Zod, Prisma |
| Database | Neon PostgreSQL |
| Auth | Clerk |
| Frontend hosting | Vercel |
| Backend hosting | Railway first, Render fallback |
| CI/CD | GitHub Actions |

## MVP Scope

### Must Have

- Clerk-based authentication with role selection.
- Local `users` table linked to Clerk user IDs.
- Server-side role authorization for every protected route.
- Batch creation, trainer assignment, and student batch joining through invite links.
- Session creation by trainers.
- Attendance marking by enrolled students for active sessions.
- Attendance summaries for trainers, institutions, programme managers, and monitoring officers.
- Test accounts and seed data for the demo.

### Nice To Have

- AI Insights card that turns attendance aggregates into short recommendations.
- Optional LLM enhancement behind environment variables.
- Basic end-to-end browser checks after deployment.

### Out Of Scope For The 2-3 Day Window

- Advanced reporting exports.
- Complex institution approval workflows.
- Fine-grained audit logs.
- SMS or email invites.
- Mobile app.

## AI-First Enhancement

The app will include an AI Insights card on summary dashboards. The default version will be deterministic and free:

- Detect batches with low attendance.
- Highlight late attendance trends.
- Recommend follow-up actions.
- Explain the signal in plain English.

If an API key is available later, the backend can optionally polish the wording through an LLM. The feature must still work without paid AI services.

## Suggested Timeline

### Day 1

- Finalize schema and migrations.
- Add Clerk auth and role sync.
- Implement core protected API middleware.
- Seed demo data.

### Day 2

- Implement all required endpoints.
- Build role dashboards.
- Add frontend API integration.
- Add backend and frontend tests.

### Day 3

- Deploy frontend, backend, and database.
- Create Clerk test accounts.
- Run manual role-by-role demo.
- Finish README with live URLs, accounts, status, and limitations.

## Success Criteria

- A reviewer can open the live frontend URL and log in as each role.
- Wrong-role API calls return `403`.
- Monitoring Officer has no mutation UI.
- Student cannot access institution or programme summaries.
- The README honestly describes what works and what is incomplete.
