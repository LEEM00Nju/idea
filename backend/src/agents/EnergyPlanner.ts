import type { EnergyPlannerResult, NapSuggestion, PlanBlock, PlanRequest, Subtask } from '../types.js'
import { scheduleSubtasksRuleBased } from '../utils/fallback.js'
import { runCopilotJson } from '../utils/copilot.js'

function normalizePlanBlocks(candidate: unknown, fallback: PlanBlock[]): PlanBlock[] {
  if (!Array.isArray(candidate) || candidate.length === 0) {
    return fallback
  }

  const normalized = candidate
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const block = entry as Record<string, unknown>
      const intensity = String(block.intensity)

      if (
        typeof block.start !== 'string' ||
        typeof block.end !== 'string' ||
        typeof block.task !== 'string' ||
        !['high', 'medium', 'low', 'rest'].includes(intensity)
      ) {
        return null
      }

      return {
        start: block.start,
        end: block.end,
        task: block.task.trim(),
        intensity: intensity as PlanBlock['intensity'],
      }
    })
    .filter((entry): entry is PlanBlock => entry !== null)

  return normalized.length > 0 ? normalized : fallback
}

function normalizeNapSuggestion(candidate: unknown, fallback: NapSuggestion): NapSuggestion {
  if (!candidate || typeof candidate !== 'object') {
    return fallback
  }

  const suggestion = candidate as Record<string, unknown>

  if (
    typeof suggestion.recommended !== 'boolean' ||
    typeof suggestion.window !== 'string' ||
    typeof suggestion.reason !== 'string'
  ) {
    return fallback
  }

  return {
    recommended: suggestion.recommended,
    window: suggestion.window,
    reason: suggestion.reason.trim(),
  }
}

export class EnergyPlannerAgent {
  async run(input: PlanRequest, subtasks: Subtask[]): Promise<EnergyPlannerResult> {
    if (process.env.SIMULATE_AGENT_FAILURE === 'energy') {
      throw new Error('Simulated Energy Planner failure')
    }

    const fallbackSchedule = scheduleSubtasksRuleBased(subtasks, input.sleepHours, input.startTime)
    const copilotResponse = await runCopilotJson<{
      planBlocks?: unknown[]
      napSuggestion?: unknown
    }>(`
Return JSON only with the shape {"planBlocks":[...],"napSuggestion":{...}}.
Schedule subtasks into a realistic day plan based on sleep duration.
Rules:
- sleepHours < 5: keep blocks short and avoid repeated high-intensity blocks
- 5 <= sleepHours < 7: place high focus work early with short breaks
- sleepHours >= 7: allow longer focus blocks
- preserve the priority order from the provided subtasks
- never provide medical advice

Input:
${JSON.stringify({ ...input, subtasks }, null, 2)}
`)

    return {
      planBlocks: normalizePlanBlocks(copilotResponse?.planBlocks, fallbackSchedule.planBlocks),
      napSuggestion: normalizeNapSuggestion(copilotResponse?.napSuggestion, fallbackSchedule.napSuggestion),
      usedCopilot:
        Array.isArray(copilotResponse?.planBlocks) && typeof copilotResponse?.napSuggestion === 'object',
    }
  }
}
