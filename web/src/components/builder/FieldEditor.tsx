'use client'

import { useEffect, useRef } from 'react'
import { useBuilderStore } from '@/lib/stores/builderStore'
import { useUpdateField } from '@/lib/hooks/useBuilder'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ChoiceConfig } from './config/ChoiceConfig'
import { RatingConfig } from './config/RatingConfig'
import { ScaleConfig } from './config/ScaleConfig'
import type { FormField } from '@/types'

interface FieldEditorProps {
  workspaceId: string | undefined
  formId: string
}

export function FieldEditor({ workspaceId, formId }: FieldEditorProps) {
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId)
  const form = useBuilderStore((s) => s.form)
  const updateFieldStore = useBuilderStore((s) => s.updateField)
  const updateField = useUpdateField(workspaceId, formId)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const field = form?.pages.flatMap((p) => p.fields).find((f) => f.id === selectedFieldId)

  // Debounced persist on every store update
  const persistField = (fieldId: string, data: Partial<FormField>) => {
    updateFieldStore(fieldId, data)
    if (fieldId.startsWith('temp-') || !workspaceId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateField.mutate({ fieldId, data: data as Record<string, unknown> })
    }, 800)
  }

  useEffect(() => () => clearTimeout(saveTimer.current), [])

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
        {/* Question text */}
        <div className="space-y-1.5">
          <Label htmlFor="field-title">Question</Label>
          <Input
            id="field-title"
            value={field.title}
            onChange={(e) => persistField(field.id, { title: e.target.value })}
            placeholder="Your question here"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="field-description">Description</Label>
          <Input
            id="field-description"
            value={field.description ?? ''}
            onChange={(e) => persistField(field.id, { description: e.target.value || undefined })}
            placeholder="Optional helper text"
          />
        </div>

        {/* Required toggle */}
        <div className="flex items-center gap-2">
          <input
            id="field-required"
            type="checkbox"
            checked={field.isRequired}
            onChange={(e) => persistField(field.id, { isRequired: e.target.checked })}
            className="h-4 w-4 rounded border"
          />
          <Label htmlFor="field-required">Required</Label>
        </div>

        {/* Type-specific config */}
        {['multiple_choice', 'multi_select', 'dropdown', 'picture_choice'].includes(field.type) && (
          <>
            <Separator />
            <ChoiceConfig field={field} onChange={(config) => persistField(field.id, { config })} />
          </>
        )}

        {field.type === 'rating' && (
          <>
            <Separator />
            <RatingConfig field={field} onChange={(config) => persistField(field.id, { config })} />
          </>
        )}

        {field.type === 'opinion_scale' && (
          <>
            <Separator />
            <ScaleConfig field={field} onChange={(config) => persistField(field.id, { config })} />
          </>
        )}
      </div>
    </aside>
  )
}
