interface Props { value: string; onChange: (v: string) => void; placeholder?: string }

export function LongText({ value, onChange, placeholder }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Your answer'}
      rows={4}
      className="w-full resize-none border-b-2 border-muted bg-transparent py-2 text-base outline-none transition-colors focus:border-primary"
    />
  )
}
