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

const urgencyLabels: Record<Urgency, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
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
        <h1>수면을 반영한 하루 일정, 두 단계로</h1>
        <p>
          수면 시간과 할 일을 입력하면 AI가 최적화된 일정을 제안합니다. 시작 전 반드시 직접 확인하세요.
        </p>
      </div>

      <div className="panel">
        <div className="panel__grid">
          <label>
            <span>어젯밤 수면 시간 (시간)</span>
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
            <h2>오늘의 할 일</h2>
            <p>각 작업에 제목, 우선순위, 예상 시간을 입력하세요.</p>
          </div>
          <button className="secondary-button" type="button" onClick={onAddTask}>
            작업 추가
          </button>
        </div>

        <div className="task-list">
          {form.tasks.map((task, index) => (
            <div className="task-card" key={`${task.title}-${index}`}>
              <label className="task-card__title">
                <span>작업 이름</span>
                <input
                  placeholder="프로젝트 제안서 작성"
                  type="text"
                  value={task.title}
                  onChange={(event) => onTaskChange(index, 'title', event.target.value)}
                />
              </label>

              <label>
                <span>우선순위</span>
                <select
                  value={task.urgency}
                  onChange={(event) => onTaskChange(index, 'urgency', event.target.value as Urgency)}
                >
                  {urgencyOptions.map((urgency) => (
                    <option key={urgency} value={urgency}>
                      {urgencyLabels[urgency]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>예상 시간 (분)</span>
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
                삭제
              </button>
            </div>
          ))}
        </div>

        {errors.length > 0 ? (
          <div className="error-box" role="alert">
            <strong>입력값을 확인해 주세요:</strong>
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
          <p className="hint">입력 → 생성 → 확인, 3단계로 오늘 하루를 계획하세요.</p>
        </div>
      </div>
    </section>
  )
}

