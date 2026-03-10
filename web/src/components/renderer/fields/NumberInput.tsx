interface Props {
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  prefix?: string
  suffix?: string
}

export function NumberInput({ value, onChange, min, max, prefix, suffix }: Props) {
  return (
    <div className="flex items-center gap-2">
      {prefix && <span className="text-muted-foreground text-sm">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder="0"
        className="w-full border-b-2 border-muted bg-transparent py-2 text-base outline-none transition-colors focus:border-primary"
      />
      {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
    </div>
  )
}
