interface Props { value: string; onChange: (v: string) => void; placeholder?: string }

export function ShortText({ value, onChange, placeholder }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Your answer'}
      className="w-full border-b-2 border-muted bg-transparent py-2 text-base outline-none transition-colors focus:border-primary"
    />
  )
}
