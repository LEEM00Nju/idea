import { MemoryStorage } from '@microsoft/agents-hosting'
import { randomUUID } from 'node:crypto'
import { EnergyPlannerAgent } from './EnergyPlanner.js'
import { TaskDecomposerAgent } from './TaskDecomposer.js'
import { MonitoringService } from '../services/monitoring.js'
import { StorageService } from '../services/storage.js'
import type { PlanRequest, PlanResponse } from '../types.js'
import { buildFallbackPlan } from '../utils/fallback.js'
import { logger } from '../utils/logger.js'

const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS ?? 4000)
const AGENT_RETRY_COUNT = 1

function summarizePlan(request: PlanRequest, fallbackUsed: boolean): string {
  const normalizedSleepHours = request.sleepHours > 14 ? 7 : request.sleepHours

  if (fallbackUsed) {
    return 'Rule-based fallback plan generated after an agent issue.'
  }

  if (normalizedSleepHours < 5) {
    return 'AI-generated recovery-first schedule: one key focus item is front-loaded and more reset breaks are included.'
  }

  if (normalizedSleepHours < 7) {
    return 'AI-generated balanced schedule: high-focus work is placed earlier, with short breaks to protect momentum.'
  }

  return 'AI-generated full-energy schedule: longer focus blocks are prioritized while preserving urgent work first.'
}

export class PlanOrchestrator {
  private readonly frameworkState = MemoryStorage.getSingleInstance()

  constructor(
    private readonly taskDecomposer = new TaskDecomposerAgent(),
    private readonly energyPlanner = new EnergyPlannerAgent(),
    private readonly storage = new StorageService(),
    private readonly monitoring = new MonitoringService(),
  ) {}

  async generatePlan(input: PlanRequest): Promise<PlanResponse> {
    const requestId = randomUUID()
    const startedAt = Date.now()

    await this.persistContext(requestId, {
      requestId,
      step: 'input',
      taskCount: input.tasks.length,
      sleepHours: input.sleepHours,
      startTime: input.startTime,
    })

    try {
      const taskResult = await this.runWithRetry(
        () => this.taskDecomposer.run(input),
        'task-decomposer',
        requestId,
      )
      await this.persistContext(requestId, {
        step: 'task-decomposer',
        subtasks: taskResult.subtasks.length,
        usedCopilot: taskResult.usedCopilot,
      })

      const energyResult = await this.runWithRetry(
        () => this.energyPlanner.run(input, taskResult.subtasks),
        'energy-planner',
        requestId,
      )
      await this.persistContext(requestId, {
        step: 'energy-planner',
        planBlocks: energyResult.planBlocks.length,
        usedCopilot: energyResult.usedCopilot,
      })

      const response: PlanResponse = {
        requestId,
        aiGenerated: true,
        summary: summarizePlan(input, false),
        planBlocks: energyResult.planBlocks,
        napSuggestion: energyResult.napSuggestion,
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      }

      await this.storage.savePlanAudit({
        requestId,
        sleepHours: input.sleepHours,
        taskCount: input.tasks.length,
        fallbackUsed: false,
      })

      this.monitoring.trackPlanGenerated(
        {
          requestId,
          fallbackUsed: 'false',
          usedCopilot: String(taskResult.usedCopilot || energyResult.usedCopilot),
        },
        {
          durationMs: Date.now() - startedAt,
          taskCount: input.tasks.length,
        },
      )

      return response
    } catch (error) {
      logger.warn('Plan generation fell back to rule-based mode', {
        requestId,
        error: error instanceof Error ? error.message : String(error),
      })

      this.monitoring.trackError(error, { requestId, stage: 'fallback' })

      const fallback = buildFallbackPlan(input, requestId)
      await this.persistContext(requestId, {
        step: 'fallback',
        subtasks: fallback.subtasks.length,
        planBlocks: fallback.response.planBlocks.length,
      })
      await this.storage.savePlanAudit({
        requestId,
        sleepHours: input.sleepHours,
        taskCount: input.tasks.length,
        fallbackUsed: true,
      })

      return fallback.response
    }
  }

  private async runWithRetry<T>(work: () => Promise<T>, agentName: string, requestId: string): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt <= AGENT_RETRY_COUNT; attempt += 1) {
      try {
        return await Promise.race([
          work(),
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${agentName} timed out`)), AGENT_TIMEOUT_MS),
          ),
        ])
      } catch (error) {
        lastError = error
        logger.warn('Agent attempt failed', {
          requestId,
          agentName,
          attempt: attempt + 1,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    throw lastError
  }

  private async persistContext(requestId: string, patch: Record<string, unknown>) {
    const current = await this.frameworkState.read([requestId])
    const existing = (current[requestId] ?? {}) as Record<string, unknown>
    await this.frameworkState.write({
      [requestId]: {
        ...existing,
        ...patch,
      },
    })
  }
}
