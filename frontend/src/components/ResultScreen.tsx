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
              {plan.aiGenerated ? 'AI 생성 일정' : '규칙 기반 일정'}
            </span>
            <h1>오늘의 실행 계획</h1>
          </div>
          <div className="result-actions">
            <button className="secondary-button" type="button" onClick={onBack}>
              수정
            </button>
            <button className="ghost-button" disabled={isSubmitting} type="button" onClick={onRegenerate}>
              다시 생성
            </button>
          </div>
        </div>

        <p>{plan.summary}</p>
        <div className="meta-row">
          <span>요청 ID: {plan.requestId.slice(0, 8)}</span>
          <span>{new Date(plan.generatedAt).toLocaleString('ko-KR')}</span>
          <span>{plan.fallbackUsed ? '대체 계획 사용' : '에이전트 파이프라인 완료'}</span>
        </div>
      </div>

      <div className="panel panel--results">
        <div className="results-grid">
          <div>
            <h2>일정 블록</h2>
            <div className="plan-grid">
              {plan.planBlocks.map((block) => (
                <PlanBlock block={block} key={`${block.start}-${block.task}`} />
              ))}
            </div>
          </div>

          <aside className="summary-card">
            <h2>실행 전 확인</h2>
            <p>
              RhythmPilot은 아무것도 자동으로 시작하지 않습니다. 일정이 현실적으로 보일 때만 확인하세요.
            </p>
            <div className="summary-card__section">
              <strong>낮잠 / 회복 안내</strong>
              <p>{plan.napSuggestion.reason}</p>
              <span>{plan.napSuggestion.window}</span>
            </div>
            <button className="primary-button" type="button" onClick={onConfirm}>
              {confirmed ? '일정 확인됨' : '일정 확인'}
            </button>
          </aside>
        </div>
      </div>
    </section>
  )
}
