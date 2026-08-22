import { useMemo, useState } from 'react'
import './App.css'
import { InputScreen } from './components/InputScreen'
import { ResultScreen } from './components/ResultScreen'
import type { PlanRequest, PlanResponse, TaskInput } from './types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const defaultTask: TaskInput = {
  title: 'Write project proposal',
  estimateMin: 90,
  urgency: 'high',
}

const defaultForm: PlanRequest = {
  sleepHours: 7,
  startTime: '09:00',
  tasks: [defaultTask, { title: 'Inbox cleanup', estimateMin: 30, urgency: 'low' }],
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
        <span>{hasFallbackPlan ? 'Fallback-ready planning active' : 'Agent-orchestrated planning active'}</span>
        <span>Azure-ready logging uses minimal plan metadata only.</span>
      </footer>
    </main>
  )
}

export default App
