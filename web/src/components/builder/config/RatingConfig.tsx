'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { FormField, FieldConfig } from '@/types'

interface RatingConfigProps {
  field: FormField
  onChange: (config: FieldConfig) => void
}

export function RatingConfig({ field, onChange }: RatingConfigProps) {
  const config = (field.config ?? {}) as FieldConfig

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Steps</Label>
        <select
          value={config.steps ?? 5}
          onChange={(e) => onChange({ ...config, steps: Number(e.target.value) })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>{n} stars</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Shape</Label>
        <select
          value={config.shape ?? 'star'}
          onChange={(e) => onChange({ ...config, shape: e.target.value as FieldConfig['shape'] })}
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="star">Star</option>
          <option value="heart">Heart</option>
          <option value="thumb">Thumb</option>
          <option value="number">Number</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Start label</Label>
          <Input
            value={config.startLabel ?? ''}
            onChange={(e) => onChange({ ...config, startLabel: e.target.value })}
            placeholder="Not at all"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>End label</Label>
          <Input
            value={config.endLabel ?? ''}
            onChange={(e) => onChange({ ...config, endLabel: e.target.value })}
            placeholder="Extremely"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
