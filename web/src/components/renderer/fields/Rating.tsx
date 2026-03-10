'use client'
import { useState } from 'react'

interface Props {
  value: number | null
  onChange: (v: number) => void
  steps?: number
  shape?: 'star' | 'heart' | 'thumb' | 'number'
  startLabel?: string
  endLabel?: string
}

const SHAPES: Record<string, (filled: boolean) => React.ReactNode> = {
  star: (filled) => (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  heart: (filled) => (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  thumb: (filled) => (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  number: (filled) => null,
}

export function Rating({ value, onChange, steps = 5, shape = 'star', startLabel, endLabel }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (shape === 'number') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`h-10 w-10 rounded-lg border-2 text-sm font-medium transition-colors ${
                (value ?? 0) >= n
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <Labels startLabel={startLabel} endLabel={endLabel} />
      </div>
    )
  }

  const active = hovered ?? value ?? 0
  const ShapeComponent = SHAPES[shape]

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            className={`transition-colors ${active >= n ? 'text-primary' : 'text-muted-foreground/30'}`}
          >
            {ShapeComponent(active >= n)}
          </button>
        ))}
      </div>
      <Labels startLabel={startLabel} endLabel={endLabel} />
    </div>
  )
}

function Labels({ startLabel, endLabel }: { startLabel?: string; endLabel?: string }) {
  if (!startLabel && !endLabel) return null
  return (
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>{startLabel}</span>
      <span>{endLabel}</span>
    </div>
  )
}
