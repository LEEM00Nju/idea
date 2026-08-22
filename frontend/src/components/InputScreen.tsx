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

function urgencyFromCheckboxes(ggeupham: boolean, gilm: boolean): Urgency {
  const count = (ggeupham ? 1 : 0) + (gilm ? 1 : 0)
  if (count === 2) return 'high'
  if (count === 1) return 'medium'
  return 'low'
}

function checkboxesFromUrgency(urgency: Urgency): { ggeupham: boolean; gilm: boolean } {
  if (urgency === 'high') return { ggeupham: true, gilm: true }
  if (urgency === 'medium') return { ggeupham: true, gilm: false }
  return { ggeupham: false, gilm: false }
}

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
        <h1>수면 패턴을 반영한 하루 일정 계획</h1>
        <p>
          수면 시간과 할 일을 입력하면, AI가 최적의 일정을 생성해 드립니다.
        </p>
      </div>

      <div className="panel">
        <div className="panel__grid">
          <label>
            <span>어제 수면시간</span>
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
            <span>시작 시간</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => onStartTimeChange(event.target.value)}
            />
          </label>
        </div>

        <div className="tasks-header">
          <div>
            <h2>오늘의 작업</h2>
            <p>각 작업의 이름, 긴급도, 소요시간을 입력하세요.</p>
          </div>
          <button className="secondary-button" type="button" onClick={onAddTask}>
            작업 추가
          </button>
        </div>

        <div className="task-list">
          {form.tasks.map((task, index) => {
            const { ggeupham, gilm } = checkboxesFromUrgency(task.urgency)
            return (
              <div className="task-card" key={index}>
                <label className="task-card__title">
                  <span>작업명</span>
                  <input
                    placeholder="예: 기획서 작성"
                    type="text"
                    value={task.title}
                    onChange={(event) => onTaskChange(index, 'title', event.target.value)}
                  />
                </label>

                <div className="urgency-field">
                  <span>긴급도</span>
                  <div className="urgency-checkboxes">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={ggeupham}
                        onChange={(event) => {
                          onTaskChange(index, 'urgency', urgencyFromCheckboxes(event.target.checked, gilm))
                        }}
                      />
                      <span>급함</span>
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={gilm}
                        onChange={(event) => {
                          onTaskChange(index, 'urgency', urgencyFromCheckboxes(ggeupham, event.target.checked))
                        }}
                      />
                      <span>긺</span>
                    </label>
                  </div>
                </div>

                <label>
                  <span>소요시간 (분)</span>
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
                  제거
                </button>
              </div>
            )
          })}
        </div>

        {errors.length > 0 ? (
          <div className="error-box" role="alert">
            <strong>입력 항목을 확인해 주세요:</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="actions">
          <button className="primary-button" disabled={isSubmitting} type="button" onClick={onSubmit}>
            {isSubmitting ? '일정 생성 중…' : '일정 생성'}
          </button>
          <p className="hint">입력 → 생성 → 확인, 세 단계로 완성됩니다.</p>
        </div>
      </div>
    </section>
  )
}
