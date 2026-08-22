import type { PlanRequest, TaskInput, Urgency } from '../types.js'

const validUrgencies: Urgency[] = ['high', 'medium', 'low']

export class ValidationError extends Error {
  status = 400

  constructor(public readonly issues: string[]) {
    super(issues[0] ?? 'Invalid request')
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function normalizeTask(task: unknown, index: number): TaskInput {
  if (!isRecord(task)) {
    throw new ValidationError([`Task ${index + 1} must be an object.`])
  }

  const title = typeof task.title === 'string' ? task.title.trim() : ''
  const estimateMin = typeof task.estimateMin === 'number' ? task.estimateMin : Number(task.estimateMin)
  const urgency = typeof task.urgency === 'string' ? task.urgency : ''

  const issues: string[] = []

  if (!title) {
    issues.push(`Task ${index + 1} title is required.`)
  }

  if (!Number.isFinite(estimateMin) || estimateMin < 15 || estimateMin > 480) {
    issues.push(`Task ${index + 1} estimate must be between 15 and 480 minutes.`)
  }

  if (!validUrgencies.includes(urgency as Urgency)) {
    issues.push(`Task ${index + 1} urgency must be high, medium, or low.`)
  }

  if (issues.length > 0) {
    throw new ValidationError(issues)
  }

  return {
    title,
    estimateMin: Math.round(estimateMin),
    urgency: urgency as Urgency,
  }
}

export function normalizeSleepHours(sleepHours: number): number {
  return sleepHours
}

export function normalizePlanRequest(body: unknown): PlanRequest {
  if (!isRecord(body)) {
    throw new ValidationError(['Request body must be a JSON object.'])
  }

  const sleepHours =
    typeof body.sleepHours === 'number' ? body.sleepHours : Number.parseFloat(String(body.sleepHours))
  const startTime = typeof body.startTime === 'string' ? body.startTime : '09:00'
  const rawTasks = Array.isArray(body.tasks) ? body.tasks : []

  const issues: string[] = []

  if (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24) {
    issues.push('sleepHours must be between 0 and 24.')
  }

  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    issues.push('startTime must use HH:MM format.')
  }

  if (rawTasks.length === 0) {
    issues.push('At least one task is required.')
  }

  if (issues.length > 0) {
    throw new ValidationError(issues)
  }

  return {
    sleepHours,
    startTime,
    tasks: rawTasks.map(normalizeTask),
  }
}
