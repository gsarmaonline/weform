'use client'

import { useBuilderStore } from '@/lib/stores/builderStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function FieldEditor() {
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId)
  const form = useBuilderStore((s) => s.form)
  const updateField = useBuilderStore((s) => s.updateField)

  const field = form?.pages.flatMap((p) => p.fields).find((f) => f.id === selectedFieldId)

  if (!field) {
    return (
      <aside className="w-72 border-l bg-background px-4 py-4">
        <p className="text-muted-foreground text-sm">Select a question to edit</p>
      </aside>
    )
  }

  return (
    <aside className="w-72 overflow-y-auto border-l bg-background px-4 py-4">
      <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wide">
        Edit question
      </p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="field-title">Question</Label>
          <Input
            id="field-title"
            value={field.title}
            onChange={(e) => updateField(field.id, { title: e.target.value })}
            placeholder="Your question here"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="field-description">Description</Label>
          <Input
            id="field-description"
            value={field.description ?? ''}
            onChange={(e) => updateField(field.id, { description: e.target.value })}
            placeholder="Optional helper text"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="field-required"
            type="checkbox"
            checked={field.isRequired}
            onChange={(e) => updateField(field.id, { isRequired: e.target.checked })}
            className="h-4 w-4 rounded border"
          />
          <Label htmlFor="field-required">Required</Label>
        </div>
        {/* Type-specific config panels will go here */}
      </div>
    </aside>
  )
}
