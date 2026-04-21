import { serve } from '@hono/node-server'
import { app } from './app.js'
import { env } from './lib/env.js'

console.log('\nStarting SkillBridge API...')
console.log(`Environment: ${env.NODE_ENV}`)
console.log(`Port: ${env.PORT}\n`)

serve({
  fetch: app.fetch,
  port: env.PORT,
})
