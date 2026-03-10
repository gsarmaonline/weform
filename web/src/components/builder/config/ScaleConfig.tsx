'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { FormField, FieldConfig } from '@/types'

interface ScaleConfigProps {
  field: FormField
  onChange: (config: FieldConfig) => void
}

export function ScaleConfig({ field, onChange }: ScaleConfigProps) {
  const config = (field.config ?? {}) as FieldConfig

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Start</Label>
          <Input
            type="number"
            value={config.start ?? 0}
            onChange={(e) => onChange({ ...config, start: Number(e.target.value) })}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>End</Label>
          <Input
            type="number"
            value={config.end ?? 10}
            onChange={(e) => onChange({ ...config, end: Number(e.target.value) })}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Start label</Label>
          <Input
            value={config.startLabel ?? ''}
            onChange={(e) => onChange({ ...config, startLabel: e.target.value })}
            placeholder="Not likely"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>End label</Label>
          <Input
            value={config.endLabel ?? ''}
            onChange={(e) => onChange({ ...config, endLabel: e.target.value })}
            placeholder="Very likely"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
