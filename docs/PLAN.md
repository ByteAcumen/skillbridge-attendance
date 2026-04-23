# SkillBridge Build Plan

## Assignment Goal

Build a deployed end-to-end attendance prototype for five roles:

- Student
- Trainer
- Institution
- Programme Manager
- Monitoring Officer

The evaluator should be able to log in, switch roles using test accounts, and see real API-backed data.

## MVP Scope

### Implemented

- Clerk authentication.
- Role onboarding and local user sync.
- Server-side role checks on protected routes.
- PostgreSQL schema for users, institutions, batches, trainers, students, sessions, attendance, and invites.
- REST API for all required assignment endpoints.
- Next.js dashboards for all five roles.
- Monitoring Officer read-only experience.
- Deterministic AI insights from attendance aggregates.
- Seed data, Postman dev tokens, and Clerk test accounts.
- Role-specific sign-in/sign-up URLs for all five roles.
- Railway/Docker demo bootstrap through `SEED_DEMO_DATA=true`.
- Docker backend workflow.
- GitHub Actions CI.

### Intentionally Simple

- UI is professional and responsive, but not pixel-perfect.
- Invites expose tokens directly instead of sending emails.
- AI insights are deterministic so the app runs on free tiers.
- No audit-log table yet.

## Architecture

```text
Clerk Auth
   |
Next.js frontend
   |
Bearer token
   |
Hono API middleware
   |
Role guard
   |
Drizzle ORM
   |
PostgreSQL
```

## Role Rules

| Role | Access |
| --- | --- |
| Student | Active sessions, own attendance, batch join |
| Trainer | Managed batches, session creation, invite links, attendance view/override |
| Institution | Institution batches and summaries |
| Programme Manager | Programme summary, institution summary, institution creation |
| Monitoring Officer | Read-only programme and institution summaries |

## AI-First Feature

The programme summary returns an `insights` object:

```json
{
  "programmeAverage": 82,
  "recommendations": ["Review low-rate batches first."]
}
```

This behaves like an AI insights card while staying deterministic and free. With more time, this could be upgraded to optional LLM-generated text behind a feature flag.

## Verification Strategy

- Unit tests for backend auth, roles, health, and time logic.
- Manual API smoke tests using local dev bearer tokens.
- Browser smoke tests using Clerk demo test accounts.
- Docker build and Docker Compose checks.
- GitHub Actions for repeatable CI.

## More Time Improvements

- Playwright E2E suite for all five roles.
- Audit logs for every write.
- Better institution onboarding flows.
- Email delivery for invite links.
- Observability dashboards and production error monitoring.
