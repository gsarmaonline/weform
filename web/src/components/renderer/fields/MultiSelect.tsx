import type { FieldOption } from '@/types'

interface Props {
  options: FieldOption[]
  value: string[]
  onChange: (v: string[]) => void
}

export function MultiSelect({ options, value, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const selected = value.includes(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
              selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
              selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
            }`}>
              {selected && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              )}
            </span>
            <span className="text-sm">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
