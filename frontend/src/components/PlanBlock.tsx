import { useState } from 'react'
import type { PlanBlock as PlanBlockType } from '../types'

const intensityLabels: Record<PlanBlockType['intensity'], string> = {
  high: '집중력 높음',
  medium: '보통',
  low: '가벼운 작업',
  rest: '휴식',
}

export function PlanBlock({ block }: { block: PlanBlockType }) {
  const [done, setDone] = useState(false)

  return (
    <article className={`plan-block plan-block--${block.intensity}${done ? ' plan-block--done' : ''}`}>
      <div className="plan-block__time">
        <strong>
          {block.start} - {block.end}
        </strong>
        <span>{intensityLabels[block.intensity]}</span>
      </div>
      <div className="plan-block__header">
        <input
          aria-label="완료 체크"
          className="plan-block__checkbox"
          checked={done}
          type="checkbox"
          onChange={() => setDone((prev) => !prev)}
        />
        <p className={`plan-block__task${done ? ' plan-block__task--done' : ''}`}>{block.task}</p>
      </div>
    </article>
  )
}

