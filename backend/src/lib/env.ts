import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),

  FRONTEND_URL: z.string().default('http://localhost:3000'),
  PROGRAMME_TIME_ZONE: z.string().default('Asia/Kolkata'),

  // Reserved for a future hosted LLM enhancement. The current API uses
  // deterministic insights and runs without paid AI credentials.
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
})

function loadEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error('\nInvalid environment variables:\n')
    result.error.issues.forEach((issue) => {
      console.error(`   ${issue.path.join('.')} - ${issue.message}`)
    })
    console.error('\nCopy backend/.env.example to backend/.env and fill in the values.\n')
    process.exit(1)
  }

  return result.data
}

export type Env = z.infer<typeof envSchema>

export const env = loadEnv()
