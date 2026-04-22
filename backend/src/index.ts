/**
 * src/index.ts
 *
 * Entry point. Runs in this safe order:
 *   1. Validate all env vars (crashes early with a helpful message if any are missing)
 *   2. Connect to DB — in production also runs migrations
 *   3. Start the HTTP server (with retry on EADDRINUSE for tsx watch compatibility)
 *   4. Register SIGTERM/SIGINT handlers for graceful shutdown
 */
import http from 'node:http'
import { serve } from '@hono/node-server'
import { app } from './app.js'
import { env } from './lib/env.js'
import { initDb, sqlClient } from './db/client.js'

async function main() {
  console.log('\n🚀 Starting SkillBridge API...')
  console.log(`   Environment : ${env.NODE_ENV}`)
  console.log(`   Port        : ${env.PORT}\n`)

  // ── Step 1: DB connectivity (+ migrations in production) ────────────────────
  try {
    await initDb()
  } catch (err) {
    console.error('\n❌ Database initialisation failed:', err)
    process.exit(1)
  }

  // ── Step 2: Start HTTP server with EADDRINUSE retry ──────────────────────────
  // tsx watch on Windows goes through a full process restart on file changes.
  // The OS keeps the port in TIME_WAIT for a moment after the old process dies,
  // so the new process briefly sees EADDRINUSE. We retry a few times before giving up.
  const server = await startServerWithRetry(env.PORT)

  // ── Step 3: Graceful shutdown ────────────────────────────────────────────────
  // closeAllConnections() drops HTTP keep-alive connections immediately so the
  // port is released before tsx spawns the next process.
  async function shutdown(signal: string) {
    console.log(`\n${signal} received — shutting down gracefully...`)
    server.closeAllConnections()
    server.close(async () => {
      await sqlClient.end()
      console.log('Database connection closed. Bye! 👋\n')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

/**
 * Creates the HTTP server. If the port is busy (EADDRINUSE), retries up to
 * MAX_RETRIES times with increasing delays — handles tsx watch's race condition
 * on Windows where the previous process hasn't fully released the port yet.
 */
async function startServerWithRetry(port: number): Promise<http.Server> {
  const MAX_RETRIES = 8
  const BASE_DELAY_MS = 250

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await tryBind(port)
    if (result.ok) {
      console.log(`\n✅ Server listening on http://0.0.0.0:${port}\n`)
      return result.server
    }

    if (attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * attempt
      console.log(`  Port ${port} busy — retry ${attempt}/${MAX_RETRIES - 1} in ${delay}ms...`)
      await sleep(delay)
    } else {
      console.error(
        `\n❌ Could not bind to port ${port} after ${MAX_RETRIES} attempts.\n` +
        `   Another process may be holding it. Kill it with:\n\n` +
        `   PowerShell:  Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force\n` +
        `   Unix:        lsof -ti :${port} | xargs kill -9\n`
      )
      process.exit(1)
    }
  }

  // Unreachable — TypeScript needs this
  process.exit(1)
}

function tryBind(port: number): Promise<{ ok: true; server: http.Server } | { ok: false }> {
  return new Promise(resolve => {
    const server = serve({ fetch: app.fetch, port }) as unknown as http.Server
    server.once('listening', () => resolve({ ok: true, server }))
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve({ ok: false })
      } else {
        console.error('\n❌ Unexpected server error:', err)
        process.exit(1)
      }
    })
  })
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

main()
