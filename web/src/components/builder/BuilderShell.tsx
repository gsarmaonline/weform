'use client'

import { useState } from 'react'
import { useWorkspaces } from '@/lib/hooks/useWorkspaces'
import { useBuilderForm, useAutoSave } from '@/lib/hooks/useBuilder'
import { FieldPanel } from './FieldPanel'
import { FieldEditor } from './FieldEditor'
import { BuilderToolbar } from './BuilderToolbar'
import { FormCanvas } from './FormCanvas'
import { LogicPanel } from './LogicPanel'
import { WorkflowsPanel } from './WorkflowsPanel'

type ActiveTab = 'build' | 'logic' | 'workflows'

interface BuilderShellProps {
  formId: string
}

export function BuilderShell({ formId }: BuilderShellProps) {
  const { data: workspaces } = useWorkspaces()
  const workspaceId = workspaces?.[0]?.id
  const [tab, setTab] = useState<ActiveTab>('build')

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

      {/* Tab bar */}
      <div className="flex border-b bg-background px-4 gap-1">
        {(['build', 'logic', 'workflows'] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'build' && (
        <div className="flex flex-1 overflow-hidden">
          <FieldPanel workspaceId={workspaceId} formId={formId} />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-8">
            <div className="mx-auto max-w-xl">
              <FormCanvas workspaceId={workspaceId} formId={formId} />
            </div>
          </main>
          <FieldEditor workspaceId={workspaceId} formId={formId} />
        </div>
      )}

      {tab === 'logic' && (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl">
            <LogicPanel workspaceId={workspaceId} formId={formId} />
          </div>
        </div>
      )}

      {tab === 'workflows' && (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl">
            <WorkflowsPanel workspaceId={workspaceId} formId={formId} />
          </div>
        </div>
      )}
    </div>
  )
}
