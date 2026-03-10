'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { FormField, FieldConfig, FieldOption } from '@/types'

interface ChoiceConfigProps {
  field: FormField
  onChange: (config: FieldConfig) => void
}

export function ChoiceConfig({ field, onChange }: ChoiceConfigProps) {
  const config = (field.config ?? {}) as FieldConfig
  const options: FieldOption[] = config.options ?? []

  const updateOptions = (next: FieldOption[]) => {
    onChange({ ...config, options: next })
  }

  const addOption = () => {
    updateOptions([...options, { id: crypto.randomUUID(), label: '' }])
  }

  const updateLabel = (id: string, label: string) => {
    updateOptions(options.map((o) => (o.id === id ? { ...o, label } : o)))
  }

  const removeOption = (id: string) => {
    updateOptions(options.filter((o) => o.id !== id))
  }

  return (
    <div className="space-y-3">
      <Label>Options</Label>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2">
            <span className="text-muted-foreground w-4 shrink-0 text-xs">{i + 1}.</span>
            <Input
              value={opt.label}
              onChange={(e) => updateLabel(opt.id, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="h-8 text-sm"
            />
            <button
              onClick={() => removeOption(opt.id)}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addOption} className="w-full">
        + Add option
      </Button>

      <div className="flex items-center gap-2 pt-1">
        <input
          id="allow-other"
          type="checkbox"
          checked={config.allowOther ?? false}
          onChange={(e) => onChange({ ...config, allowOther: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="allow-other" className="text-sm font-normal">Allow "Other" option</Label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="randomize"
          type="checkbox"
          checked={config.randomize ?? false}
          onChange={(e) => onChange({ ...config, randomize: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="randomize" className="text-sm font-normal">Randomize order</Label>
      </div>
    </div>
  )
}
