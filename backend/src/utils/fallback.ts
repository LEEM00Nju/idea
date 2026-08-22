import type { EnergyPlannerResult, NapSuggestion, PlanBlock, PlanRequest, Subtask, TaskInput } from '../types.js'
import { normalizeSleepHours } from './validation.js'

type EnergyProfile = {
  focusMinutes: number
  restMinutes: number
  highFocusQuota: number
  napSuggestion: NapSuggestion
}

const labelSuffixes = ['setup', 'first pass', 'second pass', 'review', 'finish']

function toMinutes(clockTime: string): number {
  const [hours, minutes] = clockTime.split(':').map(Number)
  return hours * 60 + minutes
}

function toClock(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function getEnergyProfile(rawSleepHours: number): EnergyProfile {
  const sleepHours = normalizeSleepHours(rawSleepHours)

  if (sleepHours < 5) {
    return {
      focusMinutes: 25,
      restMinutes: 10,
      highFocusQuota: 1,
      napSuggestion: {
        recommended: true,
        window: '13:30-13:50',
        reason: 'Sleep debt is high, so a short reset can protect afternoon execution.',
      },
    }
  }

  if (sleepHours < 7) {
    return {
      focusMinutes: 30,
      restMinutes: 5,
      highFocusQuota: 2,
      napSuggestion: {
        recommended: true,
        window: '14:00-14:20',
        reason: 'A short nap is optional if energy dips after lunch.',
      },
    }
  }

  return {
    focusMinutes: 45,
    restMinutes: 5,
    highFocusQuota: 4,
    napSuggestion: {
      recommended: false,
      window: 'Not needed',
      reason: 'Sleep was sufficient, so sustained focus blocks are reasonable.',
    },
  }
}

function getPriorityScore(task: TaskInput): number {
  const isUrgent = task.urgency === 'high'
  const isLong = task.estimateMin > 45

  if (isUrgent && isLong) {
    return 0
  }

  if (isUrgent && !isLong) {
    return 1
  }

  if (!isUrgent && !isLong) {
    return task.urgency === 'medium' ? 2 : 3
  }

  return task.urgency === 'medium' ? 4 : 5
}

export function sortTasksByPriority(tasks: TaskInput[]): TaskInput[] {
  return [...tasks].sort((left, right) => {
    const scoreDiff = getPriorityScore(left) - getPriorityScore(right)

    if (scoreDiff !== 0) {
      return scoreDiff
    }

    if (left.urgency !== right.urgency) {
      const urgencyRank = { high: 0, medium: 1, low: 2 }
      return urgencyRank[left.urgency] - urgencyRank[right.urgency]
    }

    return right.estimateMin - left.estimateMin
  })
}

function buildChunkDurations(totalMinutes: number, targetChunk: number): number[] {
  if (totalMinutes <= targetChunk) {
    return [Math.max(20, totalMinutes)]
  }

  const chunks: number[] = []
  let remaining = totalMinutes

  while (remaining > 0) {
    let duration = Math.min(targetChunk, remaining)

    if (remaining - duration > 0 && remaining - duration < 15) {
      duration = remaining
    }

    chunks.push(duration)
    remaining -= duration
  }

  return chunks
}

function pickIntensity(task: TaskInput, chunkDuration: number): Subtask['intensity'] {
  if (task.urgency === 'high' || chunkDuration >= 40) {
    return 'high'
  }

  if (task.urgency === 'medium' || chunkDuration >= 30) {
    return 'medium'
  }

  return 'low'
}

export function decomposeTasksRuleBased(tasks: TaskInput[], sleepHours: number): Subtask[] {
  const energyProfile = getEnergyProfile(sleepHours)
  const chunkMinutes = Math.max(20, Math.min(energyProfile.focusMinutes, 45))

  return sortTasksByPriority(tasks).flatMap((task) => {
    const chunks = buildChunkDurations(task.estimateMin, chunkMinutes)

    return chunks.map((durationMin, index) => ({
      title: `${task.title} · ${labelSuffixes[index] ?? `part ${index + 1}`}`,
      durationMin,
      intensity: pickIntensity(task, durationMin),
      urgency: task.urgency,
      parentTask: task.title,
    }))
  })
}

export function scheduleSubtasksRuleBased(
  subtasks: Subtask[],
  sleepHours: number,
  startTime: string,
): EnergyPlannerResult {
  const profile = getEnergyProfile(sleepHours)
  const planBlocks: PlanBlock[] = []
  let cursor = toMinutes(startTime)
  let highFocusUsed = 0

  subtasks.forEach((subtask, subtaskIndex) => {
    let remaining = subtask.durationMin

    while (remaining > 0) {
      let duration = Math.min(profile.focusMinutes, remaining)

      if (remaining - duration > 0 && remaining - duration < 15) {
        duration = remaining
      }

      const effectiveIntensity =
        subtask.intensity === 'high' && highFocusUsed >= profile.highFocusQuota ? 'medium' : subtask.intensity

      if (effectiveIntensity === 'high') {
        highFocusUsed += 1
      }

      planBlocks.push({
        start: toClock(cursor),
        end: toClock(cursor + duration),
        task: subtask.title,
        intensity: effectiveIntensity,
      })
      cursor += duration
      remaining -= duration

      const shouldRest = remaining > 0 || subtaskIndex < subtasks.length - 1

      if (shouldRest) {
        planBlocks.push({
          start: toClock(cursor),
          end: toClock(cursor + profile.restMinutes),
          task: sleepHours < 5 ? 'Recovery break' : 'Short reset break',
          intensity: 'rest',
        })
        cursor += profile.restMinutes
      }
    }
  })

  return {
    planBlocks,
    napSuggestion: profile.napSuggestion,
    usedCopilot: false,
  }
}

export function buildFallbackPlan(input: PlanRequest, requestId: string): {
  response: {
    requestId: string
    aiGenerated: boolean
    summary: string
    planBlocks: PlanBlock[]
    napSuggestion: NapSuggestion
    fallbackUsed: boolean
    generatedAt: string
  }
  subtasks: Subtask[]
} {
  const subtasks = decomposeTasksRuleBased(input.tasks, input.sleepHours)
  const scheduled = scheduleSubtasksRuleBased(subtasks, input.sleepHours, input.startTime)

  return {
    response: {
      requestId,
      aiGenerated: false,
      summary:
        'Rule-based fallback plan generated because the agent pipeline was unavailable. Priorities and sleep-aware pacing were preserved.',
      planBlocks: scheduled.planBlocks,
      napSuggestion: scheduled.napSuggestion,
      fallbackUsed: true,
      generatedAt: new Date().toISOString(),
    },
    subtasks,
  }
}
