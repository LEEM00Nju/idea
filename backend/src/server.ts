import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PlanOrchestrator } from './agents/Orchestrator.js'
import { createPlanRouter } from './routes/plan.js'
import { logger } from './utils/logger.js'

const app = express()
const orchestrator = new PlanOrchestrator()
const port = Number(process.env.PORT ?? 3001)
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const frontendDist = path.resolve(currentDirectory, '../../frontend/dist')
const apiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please wait a moment and retry.',
  },
})
const pageRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Too many requests. Please wait a moment and retry.',
})

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'RhythmPilot API',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', apiRateLimit, createPlanRouter(orchestrator))

app.use(express.static(frontendDist))
app.get(/^(?!\/api|\/health).*/, pageRateLimit, (_req, res, next) => {
  res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) {
      next()
    }
  })
})

app.listen(port, () => {
  logger.info('RhythmPilot server started', { port })
})
