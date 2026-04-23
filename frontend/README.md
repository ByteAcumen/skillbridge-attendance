# SkillBridge Frontend

Frontend application for the SkillBridge Attendance assignment. This app is built with Next.js App Router, React, Tailwind CSS, and Clerk. It provides the landing page, role-aware sign-in/sign-up, onboarding, and dashboards for all five assignment roles.

For live URLs, reviewer accounts, and Task 5 coverage, use the root [README.md](../README.md). This file is the frontend-specific companion.

## What The Frontend Does

- Shows a public landing page with role overview and reviewer account entry points.
- Uses Clerk for sign-in and sign-up.
- Routes a signed-in user through onboarding if the backend user row is not synced yet.
- Displays a different dashboard for Student, Trainer, Institution, Programme Manager, and Monitoring Officer.
- Calls the backend API with Clerk bearer tokens for protected data.
- Keeps Monitoring Officer screens read-only.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Clerk
- Lucide icons

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `frontend/.env.local` and set:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

3. Start the frontend:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

The frontend expects the backend API to be running locally on port `4000` unless `NEXT_PUBLIC_API_BASE_URL` points to a deployed backend.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and reviewer role entry points |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |
| `/onboarding` | Role selection and backend sync |
| `/dashboard` | Role-aware workspace |

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Notes

- Reviewer test accounts are documented in the root README.
- If you use real Clerk keys, keep frontend and backend on the same Clerk application.
- The frontend uses real backend data; it is not wired to hardcoded dashboard mock data.
