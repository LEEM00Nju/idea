import { useMemo, useState } from 'react'
import './App.css'
import { InputScreen } from './components/InputScreen'
import { ResultScreen } from './components/ResultScreen'
import type { PlanRequest, PlanResponse, TaskInput } from './types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const defaultTask: TaskInput = {
  title: '기획서 작성',
  estimateMin: 90,
  urgency: 'high',
}

const defaultForm: PlanRequest = {
  sleepHours: 7,
  startTime: '09:00',
  tasks: [defaultTask, { title: '받은 메일 정리', estimateMin: 30, urgency: 'low' }],
}

function validateForm(form: PlanRequest): string[] {
  const errors: string[] = []

  if (form.sleepHours < 0 || form.sleepHours > 24 || Number.isNaN(form.sleepHours)) {
    errors.push('Sleep hours must be between 0 and 24.')
  }

  if (!/^\d{2}:\d{2}$/.test(form.startTime)) {
    errors.push('Start time must use HH:MM format.')
  }

  form.tasks.forEach((task, index) => {
    if (!task.title.trim()) {
      errors.push(`Task ${index + 1} title is required.`)
    }

    if (task.estimateMin < 15 || task.estimateMin > 480 || Number.isNaN(task.estimateMin)) {
      errors.push(`Task ${index + 1} estimate must be between 15 and 480 minutes.`)
    }
  })

  return errors
}

function App() {
  const [screen, setScreen] = useState<'input' | 'result'>('input')
  const [form, setForm] = useState<PlanRequest>(defaultForm)
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const hasFallbackPlan = useMemo(() => plan?.fallbackUsed ?? false, [plan])

  const submit = async () => {
    const validationErrors = validateForm(form)
    setErrors(validationErrors)

    if (validationErrors.length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json()

      if (!response.ok) {
        const nextErrors = Array.isArray(payload.issues) ? payload.issues : [payload.message ?? 'Request failed.']
        setErrors(nextErrors)
        return
      }

      setPlan(payload)
      setConfirmed(false)
      setErrors([])
      setScreen('result')
    } catch {
      setErrors(['Network error. Check the API and try again.'])
      setScreen('input')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell">
      {screen === 'input' || !plan ? (
        <InputScreen
          errors={errors}
          form={form}
          isSubmitting={isSubmitting}
          onAddTask={() =>
            setForm((current) => ({
              ...current,
              tasks: [...current.tasks, { title: '', estimateMin: 30, urgency: 'medium' }],
            }))
          }
          onRemoveTask={(index) =>
            setForm((current) => ({
              ...current,
              tasks: current.tasks.filter((_, taskIndex) => taskIndex !== index),
            }))
          }
          onSleepHoursChange={(sleepHours) => setForm((current) => ({ ...current, sleepHours }))}
          onStartTimeChange={(startTime) => setForm((current) => ({ ...current, startTime }))}
          onSubmit={submit}
          onTaskChange={(index, field, value) =>
            setForm((current) => ({
              ...current,
              tasks: current.tasks.map((task, taskIndex) =>
                taskIndex === index ? { ...task, [field]: value } : task,
              ),
            }))
          }
        />
      ) : (
        <ResultScreen
          confirmed={confirmed}
          isSubmitting={isSubmitting}
          onBack={() => setScreen('input')}
          onConfirm={() => setConfirmed(true)}
          onRegenerate={submit}
          plan={plan}
        />
      )}

      <footer className="app-footer">
        <span>{hasFallbackPlan ? '대체 계획 모드 활성' : '에이전트 파이프라인 활성'}</span>
        <span>Azure 로깅은 최소한의 계획 메타데이터만 사용합니다.</span>
      </footer>
    </main>
  )
}

export default App
