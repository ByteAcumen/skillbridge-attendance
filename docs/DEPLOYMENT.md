# Deployment Guide

## Recommended Free-Tier Stack

| Layer | Provider |
| --- | --- |
| Frontend | Vercel |
| Backend | Railway |
| Backend fallback | Render |
| Database | Neon PostgreSQL |
| Auth | Clerk |
| CI/CD | GitHub Actions |

## Environment Variables

### Frontend - Vercel

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding
```

### Backend - Railway or Render

```text
NODE_ENV=production
PORT=4000
DATABASE_URL=
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
FRONTEND_URL=
PROGRAMME_TIME_ZONE=Asia/Kolkata
SEED_DEMO_DATA=false
TEST_ACCOUNT_PASSWORD=SkillBridge@2026!
GOOGLE_GENERATIVE_AI_API_KEY=
```

`GOOGLE_GENERATIVE_AI_API_KEY` is optional. The current insights feature works without paid AI credentials.
`SEED_DEMO_DATA=true` makes the Docker/Railway start command create or update the five reviewer accounts before the API starts.

## Clerk Setup

1. Create or claim a Clerk application.
2. Enable email/password.
3. Add local URLs during development:
   - `http://localhost:3000`
   - `http://localhost:4000`
4. Add deployed frontend URL after Vercel deployment.
5. Copy the same Clerk publishable/secret key pair into frontend and backend env files.

For the deployed demo accounts, run `npm run accounts:seed` locally or set `SEED_DEMO_DATA=true` on Railway for one redeploy. The shared password is `SkillBridge@2026!`; the test-mode verification code is `424242` if Clerk asks for it.

## Neon Setup

1. Create a Neon project.
2. Copy the PostgreSQL connection string.
3. Set `DATABASE_URL` in `backend/.env` and the backend hosting provider.
4. From `backend/`, run:

```bash
npm run db:migrate
npm run db:seed
```

## Vercel Frontend

1. Import GitHub repository.
2. Set root directory to `frontend`.
3. Add frontend environment variables.
4. Deploy.

Build command:

```text
npm run build
```

Output is handled automatically by Next.js on Vercel.

## Railway Backend

1. Create a Railway project from GitHub.
2. Set root directory to `backend`.
3. Add backend environment variables.
4. Deploy with the Dockerfile or Node build/start commands.

Build command:

```text
Dockerfile
```

Start command:

```text
sh -c 'if [ "$SEED_DEMO_DATA" = "true" ]; then node dist/db/test-accounts.js; fi; node dist/index.js'
```

Verify:

```text
GET /health
```

Recommended Railway demo seed flow:

1. Set `SEED_DEMO_DATA=true`.
2. Redeploy the backend.
3. Confirm the deploy logs show "Demo accounts are ready".
4. Optionally set `SEED_DEMO_DATA=false` and redeploy if you want demo edits to persist.

## Render Fallback

1. Create a Web Service.
2. Root directory: `backend`.
3. Build command: `npm install && npm run build`.
4. Start command: `npm start`.
5. Add the same backend environment variables.

Render free services sleep after inactivity, so the first request can be slow.

## CI/CD

GitHub Actions runs:

- Frontend lint, typecheck, test, build.
- Backend typecheck, tests, audit, build.
- Backend Docker image build.
- Backend integration smoke tests against a real Postgres service.

The repository also includes a manual CD workflow:

```text
.github/workflows/deploy.yml
```

It verifies both apps, builds the backend Docker image, then deploys the backend through Railway CLI. Add these GitHub repository secrets before running it:

```text
RAILWAY_TOKEN=
RAILWAY_SERVICE_ID=
```

Vercel frontend deployment is expected to run through the normal Vercel GitHub integration after importing the `frontend/` directory.

## Submission Checklist

- Frontend deployed URL opens.
- Backend `/health` returns JSON.
- README includes live URLs.
- README includes five test accounts.
- Each role can log in and see the correct dashboard.
- Monitoring Officer has read-only UI.
- Any incomplete feature is documented honestly.
