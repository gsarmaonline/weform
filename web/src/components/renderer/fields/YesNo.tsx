interface Props {
  value: boolean | null
  onChange: (v: boolean) => void
  yesLabel?: string
  noLabel?: string
}

export function YesNo({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }: Props) {
  return (
    <div className="flex gap-3">
      {[
        { label: yesLabel, val: true },
        { label: noLabel, val: false },
      ].map(({ label, val }) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(val)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-6 py-4 text-sm font-medium transition-colors ${
            value === val
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <span>{val ? '👍' : '👎'}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
