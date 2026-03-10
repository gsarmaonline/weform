import type { FieldOption } from '@/types'

interface Props {
  options: FieldOption[]
  value: string
  onChange: (v: string) => void
  allowOther?: boolean
}

export function MultipleChoice({ options, value, onChange, allowOther }: Props) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const letter = String.fromCharCode(65 + i)
        const selected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(selected ? '' : opt.id)}
            className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
              selected
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 text-xs font-semibold ${
              selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
            }`}>
              {letter}
            </span>
            <span className="text-sm">{opt.label}</span>
          </button>
        )
      })}
      {allowOther && (
        <button
          type="button"
          onClick={() => onChange('__other__')}
          className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
            value === '__other__'
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-muted-foreground/40 text-xs font-semibold">
            {String.fromCharCode(65 + options.length)}
          </span>
          <span className="text-sm">Other</span>
        </button>
      )}
    </div>
  )
}
