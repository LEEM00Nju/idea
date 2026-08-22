import { Router } from 'express'
import { PlanOrchestrator } from '../agents/Orchestrator.js'
import { logger } from '../utils/logger.js'
import { normalizePlanRequest, ValidationError } from '../utils/validation.js'

export function createPlanRouter(orchestrator: PlanOrchestrator): Router {
  const router = Router()

  router.post('/plan', async (req, res) => {
    try {
      const request = normalizePlanRequest(req.body)
      const response = await orchestrator.generatePlan(request)
      res.json(response)
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(error.status).json({
          message: 'Please fix the highlighted inputs and try again.',
          issues: error.issues,
        })
        return
      }

      logger.error('Unhandled /api/plan error', {
        error: error instanceof Error ? error.message : String(error),
      })

      res.status(500).json({
        message: 'Plan generation failed. Please retry in a moment.',
      })
    }
  })

  return router
}
