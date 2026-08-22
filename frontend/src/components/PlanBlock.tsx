import { useState } from 'react'
import type { PlanBlock as PlanBlockType } from '../types'

const intensityLabels: Record<PlanBlockType['intensity'], string> = {
  high: '집중력 높음',
  medium: '균형잡힘',
  low: '가벼운 작업',
  rest: '휴식',
}

export function PlanBlock({ block }: { block: PlanBlockType }) {
  const [done, setDone] = useState(false)

  return (
    <article className={`plan-block plan-block--${block.intensity}`}>
      <div className="plan-block__time">
        <strong>
          {block.start} - {block.end}
        </strong>
        <span>{intensityLabels[block.intensity]}</span>
      </div>
      <label className="plan-block__task">
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => setDone(e.target.checked)}
        />
        <span style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>
          {block.task}
        </span>
      </label>
    </article>
  )
}
