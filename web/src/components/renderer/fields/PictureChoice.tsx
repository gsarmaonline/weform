import type { FieldOption } from '@/types'

interface Props {
  options: FieldOption[]
  value: string
  onChange: (v: string) => void
}

export function PictureChoice({ options, value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {options.map((opt) => {
        const selected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(selected ? '' : opt.id)}
            className={`overflow-hidden rounded-lg border-2 text-left transition-colors ${
              selected ? 'border-primary' : 'border-border hover:border-primary/40'
            }`}
          >
            {opt.imageUrl ? (
              <img src={opt.imageUrl} alt={opt.label} className="h-28 w-full object-cover" />
            ) : (
              <div className="flex h-28 items-center justify-center bg-muted text-muted-foreground text-xs">
                No image
              </div>
            )}
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{opt.label}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
