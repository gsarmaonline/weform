import type { FieldOption } from '@/types'

interface Props { options: FieldOption[]; value: string; onChange: (v: string) => void }

export function Dropdown({ options, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border-2 border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
    >
      <option value="">Select an option...</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>{opt.label}</option>
      ))}
    </select>
  )
}
