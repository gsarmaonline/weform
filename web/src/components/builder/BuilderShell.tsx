'use client'

import { useWorkspaces } from '@/lib/hooks/useWorkspaces'
import { useBuilderForm, useAutoSave } from '@/lib/hooks/useBuilder'
import { FieldPanel } from './FieldPanel'
import { FieldEditor } from './FieldEditor'
import { BuilderToolbar } from './BuilderToolbar'
import { FormCanvas } from './FormCanvas'

interface BuilderShellProps {
  formId: string
}

export function BuilderShell({ formId }: BuilderShellProps) {
  const { data: workspaces } = useWorkspaces()
  const workspaceId = workspaces?.[0]?.id

  const { isLoading } = useBuilderForm(workspaceId, formId)
  useAutoSave(workspaceId, formId)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading form...</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <BuilderToolbar workspaceId={workspaceId} formId={formId} />
      <div className="flex flex-1 overflow-hidden">
        <FieldPanel workspaceId={workspaceId} formId={formId} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
          <div className="mx-auto max-w-xl">
            <FormCanvas workspaceId={workspaceId} formId={formId} />
          </div>
        </main>
        <FieldEditor workspaceId={workspaceId} formId={formId} />
      </div>
    </div>
  )
}
