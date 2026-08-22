import { PlanBlock } from './PlanBlock'
import type { PlanResponse } from '../types'

type ResultScreenProps = {
  plan: PlanResponse
  confirmed: boolean
  isSubmitting: boolean
  onBack: () => void
  onRegenerate: () => void
  onConfirm: () => void
}

export function ResultScreen({
  plan,
  confirmed,
  isSubmitting,
  onBack,
  onRegenerate,
  onConfirm,
}: ResultScreenProps) {
  return (
    <section className="screen">
      <div className="hero-card hero-card--compact">
        <div className="result-header">
          <div>
            <span className={`badge ${plan.fallbackUsed ? 'badge--muted' : ''}`}>
              {plan.aiGenerated ? 'AI generated plan' : 'Rule-based fallback plan'}
            </span>
            <h1>Your executable day plan</h1>
          </div>
          <div className="result-actions">
            <button className="secondary-button" type="button" onClick={onBack}>
              Edit inputs
            </button>
            <button className="ghost-button" disabled={isSubmitting} type="button" onClick={onRegenerate}>
              Regenerate
            </button>
          </div>
        </div>

        <p>{plan.summary}</p>
        <div className="meta-row">
          <span>Request: {plan.requestId.slice(0, 8)}</span>
          <span>{new Date(plan.generatedAt).toLocaleString()}</span>
          <span>{plan.fallbackUsed ? 'Fallback used' : 'Agent pipeline completed'}</span>
        </div>
      </div>

      <div className="panel panel--results">
        <div className="results-grid">
          <div>
            <h2>Schedule blocks</h2>
            <div className="plan-grid">
              {plan.planBlocks.map((block) => (
                <PlanBlock block={block} key={`${block.start}-${block.task}`} />
              ))}
            </div>
          </div>

          <aside className="summary-card">
            <h2>Review before execution</h2>
            <p>
              RhythmPilot never starts anything automatically. Confirm the schedule only if the pace looks realistic.
            </p>
            <div className="summary-card__section">
              <strong>Nap / recovery guidance</strong>
              <p>{plan.napSuggestion.reason}</p>
              <span>{plan.napSuggestion.window}</span>
            </div>
            <button className="primary-button" type="button" onClick={onConfirm}>
              {confirmed ? 'Plan confirmed' : 'Confirm plan'}
            </button>
          </aside>
        </div>
      </div>
    </section>
  )
}
