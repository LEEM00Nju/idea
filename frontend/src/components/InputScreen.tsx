import type { PlanRequest, TaskInput, Urgency } from '../types'

type InputScreenProps = {
  form: PlanRequest
  errors: string[]
  isSubmitting: boolean
  onSleepHoursChange: (value: number) => void
  onStartTimeChange: (value: string) => void
  onTaskChange: (index: number, field: keyof TaskInput, value: string | number) => void
  onAddTask: () => void
  onRemoveTask: (index: number) => void
  onSubmit: () => void
}

const urgencyOptions: Urgency[] = ['high', 'medium', 'low']

export function InputScreen({
  form,
  errors,
  isSubmitting,
  onSleepHoursChange,
  onStartTimeChange,
  onTaskChange,
  onAddTask,
  onRemoveTask,
  onSubmit,
}: InputScreenProps) {
  return (
    <section className="screen">
      <div className="hero-card">
        <span className="badge">RhythmPilot</span>
        <h1>Sleep-aware daily planning in two steps</h1>
        <p>
          Enter your sleep and tasks, then review an AI-labeled schedule before you start anything.
        </p>
      </div>

      <div className="panel">
        <div className="panel__grid">
          <label>
            <span>Sleep hours last night</span>
            <input
              min="0"
              max="24"
              step="0.5"
              type="number"
              value={form.sleepHours}
              onChange={(event) => onSleepHoursChange(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Start time</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => onStartTimeChange(event.target.value)}
            />
          </label>
        </div>

        <div className="tasks-header">
          <div>
            <h2>Today&apos;s tasks</h2>
            <p>Each task needs a title, urgency, and estimate.</p>
          </div>
          <button className="secondary-button" type="button" onClick={onAddTask}>
            Add task
          </button>
        </div>

        <div className="task-list">
          {form.tasks.map((task, index) => (
            <div className="task-card" key={`${task.title}-${index}`}>
              <label className="task-card__title">
                <span>Task</span>
                <input
                  placeholder="Write project proposal"
                  type="text"
                  value={task.title}
                  onChange={(event) => onTaskChange(index, 'title', event.target.value)}
                />
              </label>

              <label>
                <span>Urgency</span>
                <select
                  value={task.urgency}
                  onChange={(event) => onTaskChange(index, 'urgency', event.target.value as Urgency)}
                >
                  {urgencyOptions.map((urgency) => (
                    <option key={urgency} value={urgency}>
                      {urgency}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Estimate (min)</span>
                <input
                  min="15"
                  max="480"
                  step="5"
                  type="number"
                  value={task.estimateMin}
                  onChange={(event) => onTaskChange(index, 'estimateMin', Number(event.target.value))}
                />
              </label>

              <button
                className="ghost-button"
                disabled={form.tasks.length === 1}
                type="button"
                onClick={() => onRemoveTask(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {errors.length > 0 ? (
          <div className="error-box" role="alert">
            <strong>Fix these inputs first:</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="actions">
          <button className="primary-button" disabled={isSubmitting} type="button" onClick={onSubmit}>
            {isSubmitting ? 'Building your schedule…' : 'Generate schedule'}
          </button>
          <p className="hint">Core value is delivered within 3 clicks: input, generate, confirm.</p>
        </div>
      </div>
    </section>
  )
}
