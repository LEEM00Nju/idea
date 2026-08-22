import type { PlanBlock as PlanBlockType } from '../types'

const intensityLabels: Record<PlanBlockType['intensity'], string> = {
  high: 'High focus',
  medium: 'Balanced',
  low: 'Light',
  rest: 'Rest',
}

export function PlanBlock({ block }: { block: PlanBlockType }) {
  return (
    <article className={`plan-block plan-block--${block.intensity}`}>
      <div className="plan-block__time">
        <strong>
          {block.start} - {block.end}
        </strong>
        <span>{intensityLabels[block.intensity]}</span>
      </div>
      <p>{block.task}</p>
    </article>
  )
}
