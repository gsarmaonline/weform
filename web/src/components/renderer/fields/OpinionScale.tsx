interface Props {
  value: number | null
  onChange: (v: number) => void
  start?: number
  end?: number
  startLabel?: string
  endLabel?: string
}

export function OpinionScale({ value, onChange, start = 0, end = 10, startLabel, endLabel }: Props) {
  const steps = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap">
        {steps.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 min-w-[2.5rem] rounded-lg border-2 px-1 text-sm font-medium transition-colors ${
              value === n
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary/40'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {(startLabel || endLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
    </div>
  )
}
