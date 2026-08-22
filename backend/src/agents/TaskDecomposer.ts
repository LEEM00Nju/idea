import type { PlanRequest, Subtask, TaskDecomposerResult } from '../types.js'
import { decomposeTasksRuleBased } from '../utils/fallback.js'
import { runCopilotJson } from '../utils/copilot.js'

function normalizeSubtasks(candidate: unknown, fallback: Subtask[]): Subtask[] {
  if (!Array.isArray(candidate) || candidate.length === 0) {
    return fallback
  }

  const normalized = candidate
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const subtask = entry as Record<string, unknown>
      const durationMin = Number(subtask.durationMin)
      const intensity = String(subtask.intensity)
      const urgency = String(subtask.urgency)

      if (
        typeof subtask.title !== 'string' ||
        !Number.isFinite(durationMin) ||
        durationMin < 20 ||
        durationMin > 45 ||
        !['high', 'medium', 'low'].includes(intensity) ||
        !['high', 'medium', 'low'].includes(urgency) ||
        typeof subtask.parentTask !== 'string'
      ) {
        return null
      }

      return {
        title: subtask.title.trim(),
        durationMin: Math.round(durationMin),
        intensity: intensity as Subtask['intensity'],
        urgency: urgency as Subtask['urgency'],
        parentTask: subtask.parentTask.trim(),
      }
    })
    .filter((entry): entry is Subtask => entry !== null)

  return normalized.length > 0 ? normalized : fallback
}

export class TaskDecomposerAgent {
  async run(input: PlanRequest): Promise<TaskDecomposerResult> {
    if (process.env.SIMULATE_AGENT_FAILURE === 'task') {
      throw new Error('Simulated Task Decomposer failure')
    }

    const fallbackSubtasks = decomposeTasksRuleBased(input.tasks, input.sleepHours)
    const copilotResponse = await runCopilotJson<{ subtasks?: unknown[] }>(`
Return JSON only with the shape {"subtasks":[...]}.
Break each task into executable subtasks that take 20-45 minutes.
Use the priority rule urgent+long > urgent+short > routine+short > routine+long.
Do not provide medical advice.

Input:
${JSON.stringify(input, null, 2)}
`)

    return {
      subtasks: normalizeSubtasks(copilotResponse?.subtasks, fallbackSubtasks),
      usedCopilot: Array.isArray(copilotResponse?.subtasks),
    }
  }
}
