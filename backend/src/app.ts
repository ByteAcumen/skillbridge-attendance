import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

const plannedRoutes = [
  'POST /batches',
  'POST /batches/:id/invite',
  'POST /batches/:id/join',
  'POST /sessions',
  'POST /attendance/mark',
  'GET /sessions/:id/attendance',
  'GET /batches/:id/summary',
  'GET /institutions/:id/summary',
  'GET /programme/summary',
]

export function createApp() {
  const app = express()
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use(helmet())
  app.use(cors({ origin: allowedOrigins, credentials: true }))
  app.use(express.json())

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'))
  }

  app.get('/', (_request, response) => {
    response.json({
      name: 'SkillBridge Attendance API',
      status: 'scaffolded',
      docs: '/health',
      plannedRoutes,
    })
  })

  app.get('/health', (_request, response) => {
    response.json({
      ok: true,
      service: 'skillbridge-attendance-api',
      environment: process.env.NODE_ENV ?? 'development',
      timestamp: new Date().toISOString(),
    })
  })

  app.use('/api', (_request, response) => {
    response.status(501).json({
      error: 'NotImplemented',
      message: 'SkillBridge assignment routes are planned and will be implemented next.',
      plannedRoutes,
    })
  })

  return app
}
