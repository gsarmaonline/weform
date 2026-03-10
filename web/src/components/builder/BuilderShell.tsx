'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formsApi } from '@/lib/api/forms'
import { useBuilderStore } from '@/lib/stores/builderStore'
import { FieldPanel } from './FieldPanel'
import { FieldEditor } from './FieldEditor'
import { BuilderToolbar } from './BuilderToolbar'

interface BuilderShellProps {
  formId: string
}

export function BuilderShell({ formId }: BuilderShellProps) {
  const setForm = useBuilderStore((s) => s.setForm)

  // TODO: replace 'workspace-id' with real workspace context
  const { data: form, isLoading } = useQuery({
    queryKey: ['form', formId],
    queryFn: () => formsApi.get('workspace-id', formId),
  })

  useEffect(() => {
    if (form) setForm(form)
  }, [form, setForm])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading form...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <BuilderToolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: field type picker */}
        <FieldPanel />
        {/* Center: form preview */}
        <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
          <div className="mx-auto max-w-xl">
            <FormPreview />
          </div>
        </main>
        {/* Right: selected field editor */}
        <FieldEditor />
      </div>
    </div>
  )
}

function FormPreview() {
  const form = useBuilderStore((s) => s.form)
  const selectedPageId = useBuilderStore((s) => s.selectedPageId)
  const selectField = useBuilderStore((s) => s.selectField)
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId)

  const page = form?.pages.find((p) => p.id === selectedPageId)

  if (!page) return null

  return (
    <div className="space-y-3">
      {page.fields.map((field) => (
        <div
          key={field.id}
          onClick={() => selectField(field.id)}
          className={`cursor-pointer rounded-lg border bg-background p-4 transition-shadow hover:shadow-sm ${
            selectedFieldId === field.id ? 'ring-primary ring-2' : ''
          }`}
        >
          <p className="text-sm font-medium">{field.title || 'Untitled question'}</p>
          {field.description && (
            <p className="text-muted-foreground mt-1 text-xs">{field.description}</p>
          )}
          <p className="text-muted-foreground mt-2 text-xs capitalize">{field.type.replace('_', ' ')}</p>
        </div>
      ))}
      {page.fields.length === 0 && (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">Add a question from the left panel</p>
        </div>
      )}
    </div>
  )
}
