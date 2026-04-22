# SkillBridge Attendance Frontend

Modern Next.js App Router frontend for the SkillBridge attendance prototype. It provides a polished landing page, Clerk-powered auth screens, role onboarding, and API-backed dashboards for Student, Trainer, Institution, Programme Manager, and Monitoring Officer users.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Clerk for authentication
- Lucide React icons
- Backend API: `NEXT_PUBLIC_API_BASE_URL` or `http://localhost:4000`

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Clerk keyless mode works when no Clerk keys are present in `.env.local`. If you add real Clerk keys later, make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` come from the same Clerk application.

## Routes

- `/` - landing page
- `/sign-in` - Clerk sign-in
- `/sign-up` - Clerk sign-up
- `/onboarding` - role selection and backend user sync
- `/dashboard` - role-aware workspace

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

The dashboard fetches real data from the backend and depends on the backend server running locally or through a deployed API URL.
