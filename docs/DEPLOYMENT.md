# Deployment Checklist

## Providers

| Layer | Provider | Notes |
| --- | --- | --- |
| Frontend | Vercel | Deploy from `/frontend`. |
| Backend | Railway | Deploy from `/backend`. |
| Backend fallback | Render | Use if Railway credits or deployment are unavailable. |
| Database | Neon PostgreSQL | Use pooled connection string for serverless-style deployments if needed. |
| Auth | Clerk | Configure allowed origins and redirect URLs. |

## Frontend Environment

Create these variables in Vercel:

```text
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_BASE_URL=
```

Local file:

```text
frontend/.env.local
```

## Backend Environment

Create these variables in Railway or Render:

```text
NODE_ENV=production
PORT=4000
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_JWT_KEY=
FRONTEND_URL=
AI_PROVIDER=deterministic
OPENAI_API_KEY=
```

Local file:

```text
backend/.env
```

`OPENAI_API_KEY` is optional and should not be required for the app to run.

## Neon

1. Create a Neon project.
2. Copy the PostgreSQL connection string.
3. Set `DATABASE_URL` in `backend/.env` and the backend hosting provider.
4. Run Prisma migrations from the backend folder.
5. Run the seed script when it exists.

## Clerk

1. Create a Clerk application.
2. Enable email/password auth for reviewer-friendly test accounts.
3. Add frontend local and production URLs to allowed origins.
4. Copy publishable and secret keys.
5. Configure signup to capture the selected SkillBridge role.

## Vercel

1. Import the GitHub repository.
2. Set root directory to `frontend`.
3. Add frontend environment variables.
4. Deploy.

## Railway

1. Create a new Railway project from GitHub.
2. Set root directory to `backend`.
3. Add backend environment variables.
4. Use build command:

```text
npm install && npm run build
```

5. Use start command:

```text
npm start
```

6. Verify:

```text
GET /health
```

## Render Fallback

If Railway is unavailable:

1. Create a new Web Service from GitHub.
2. Set root directory to `backend`.
3. Build command:

```text
npm install && npm run build
```

4. Start command:

```text
npm start
```

Render free services can sleep after inactivity, so the first request may be slow.

## Final Submission Checklist

- Frontend live URL works.
- Backend `/health` returns JSON.
- All five test accounts are listed in README.
- Each role can log in and see the correct dashboard.
- Monitoring Officer has no mutation UI.
- README documents what is complete, partial, and skipped.
