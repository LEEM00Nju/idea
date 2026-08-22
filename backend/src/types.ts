export type Urgency = 'high' | 'medium' | 'low'
export type Intensity = 'high' | 'medium' | 'low' | 'rest'

export interface TaskInput {
  title: string
  estimateMin: number
  urgency: Urgency
}

export interface PlanRequest {
  sleepHours: number
  startTime: string
  tasks: TaskInput[]
}

export interface Subtask {
  title: string
  durationMin: number
  intensity: Exclude<Intensity, 'rest'>
  urgency: Urgency
  parentTask: string
}

export interface PlanBlock {
  start: string
  end: string
  task: string
  intensity: Intensity
}

export interface NapSuggestion {
  recommended: boolean
  window: string
  reason: string
}

export interface PlanResponse {
  requestId: string
  aiGenerated: boolean
  summary: string
  planBlocks: PlanBlock[]
  napSuggestion: NapSuggestion
  fallbackUsed: boolean
  generatedAt: string
}

export interface TaskDecomposerResult {
  subtasks: Subtask[]
  usedCopilot: boolean
}

export interface EnergyPlannerResult {
  planBlocks: PlanBlock[]
  napSuggestion: NapSuggestion
  usedCopilot: boolean
}
