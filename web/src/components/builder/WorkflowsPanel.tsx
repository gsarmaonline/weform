'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workflowsApi } from '@/lib/api/workflows'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Workflow, WorkflowAction, WorkflowActionType, EmailNotificationConfig, WebhookConfig } from '@/types'

interface WorkflowsPanelProps {
  workspaceId: string | undefined
  formId: string
}

function NativeSelect({ value, onChange, className, children }: {
  value: string
  onChange: (v: string) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded-md px-2 py-1 text-xs bg-background ${className ?? ''}`}
    >
      {children}
    </select>
  )
}

export function WorkflowsPanel({ workspaceId, formId }: WorkflowsPanelProps) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['workflows', formId],
    queryFn: () => workflowsApi.list(workspaceId!, formId),
    enabled: !!workspaceId,
  })
  const workflows = data?.workflows ?? []

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      workflowsApi.create(workspaceId!, formId, { name, trigger: 'on_submission', isEnabled: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', formId] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.delete(workspaceId!, formId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', formId] }),
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      workflowsApi.update(workspaceId!, formId, id, { isEnabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', formId] }),
  })

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  function submitNew() {
    if (!newName.trim()) return
    createMutation.mutate(newName.trim(), {
      onSuccess: () => { setNewName(''); setAdding(false) },
    })
  }

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Workflows</h2>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} disabled={adding}>
          + Add workflow
        </Button>
      </div>

      {adding && (
        <div className="rounded-lg border bg-card p-4 flex gap-2">
          <Input
            className="h-8 text-sm"
            placeholder="Workflow name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitNew()}
            autoFocus
          />
          <Button size="sm" onClick={submitNew} disabled={createMutation.isPending}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      )}

      {workflows.map((wf) => (
        <WorkflowCard
          key={wf.id}
          workflow={wf}
          workspaceId={workspaceId!}
          formId={formId}
          onToggle={(isEnabled) => toggleMutation.mutate({ id: wf.id, isEnabled })}
          onDelete={() => deleteMutation.mutate(wf.id)}
        />
      ))}

      {workflows.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground">
          No workflows yet. Workflows run automatically when a form is submitted.
        </p>
      )}
    </div>
  )
}

interface WorkflowCardProps {
  workflow: Workflow
  workspaceId: string
  formId: string
  onToggle: (enabled: boolean) => void
  onDelete: () => void
}

function WorkflowCard({ workflow, workspaceId, formId, onToggle, onDelete }: WorkflowCardProps) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [addingAction, setAddingAction] = useState(false)
  const [actionType, setActionType] = useState<WorkflowActionType>('email_notification')

  const addActionMutation = useMutation({
    mutationFn: (action: Omit<WorkflowAction, 'id' | 'workflowId'>) =>
      workflowsApi.addAction(workspaceId, formId, workflow.id, action),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows', formId] }); setAddingAction(false) },
  })
  const deleteActionMutation = useMutation({
    mutationFn: (actionId: string) => workflowsApi.deleteAction(workspaceId, formId, workflow.id, actionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', formId] }),
  })
  const updateActionMutation = useMutation({
    mutationFn: ({ actionId, data }: { actionId: string; data: Partial<WorkflowAction> }) =>
      workflowsApi.updateAction(workspaceId, formId, workflow.id, actionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows', formId] }),
  })

  function addDefaultAction() {
    const defaultConfig: Record<string, unknown> =
      actionType === 'email_notification'
        ? { to: [], subject: 'New form response', includeResponseData: true }
        : actionType === 'webhook'
        ? { url: '', method: 'POST', headers: {} }
        : { replyToFieldRef: '', subject: 'Thanks for your response', bodyHtml: '' }

    addActionMutation.mutate({
      type: actionType,
      position: workflow.actions?.length ?? 0,
      isEnabled: true,
      config: defaultConfig as WorkflowAction['config'],
    })
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Toggle enabled={workflow.isEnabled} onToggle={() => onToggle(!workflow.isEnabled)} size="md" />
          <div>
            <p className="text-sm font-medium">{workflow.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{workflow.trigger.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▲' : '▼'}
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 space-y-3">
          {(workflow.actions ?? []).map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onToggle={(isEnabled) => updateActionMutation.mutate({ actionId: action.id, data: { isEnabled } })}
              onConfigChange={(config) => updateActionMutation.mutate({ actionId: action.id, data: { config: config as WorkflowAction['config'] } })}
              onDelete={() => deleteActionMutation.mutate(action.id)}
            />
          ))}

          {addingAction ? (
            <div className="flex items-center gap-2">
              <NativeSelect value={actionType} onChange={(v) => setActionType(v as WorkflowActionType)}>
                <option value="email_notification">Email notification</option>
                <option value="email_autoresponder">Email autoresponder</option>
                <option value="webhook">Webhook</option>
              </NativeSelect>
              <Button size="sm" onClick={addDefaultAction} disabled={addActionMutation.isPending}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingAction(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setAddingAction(true)}>+ Add action</Button>
          )}
        </div>
      )}
    </div>
  )
}

function Toggle({ enabled, onToggle, size = 'sm' }: { enabled: boolean; onToggle: () => void; size?: 'sm' | 'md' }) {
  const track = size === 'md' ? 'h-5 w-9' : 'h-4 w-7'
  const thumb = size === 'md' ? 'h-4 w-4 mt-0.5' : 'h-3 w-3 mt-0.5'
  const on = size === 'md' ? 'translate-x-4' : 'translate-x-3.5'
  const off = 'translate-x-0.5'
  return (
    <button
      className={`relative inline-flex ${track} rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
      onClick={onToggle}
    >
      <span className={`inline-block ${thumb} rounded-full bg-white shadow transition-transform ${enabled ? on : off}`} />
    </button>
  )
}

interface ActionCardProps {
  action: WorkflowAction
  onToggle: (enabled: boolean) => void
  onConfigChange: (config: Record<string, unknown>) => void
  onDelete: () => void
}

function ActionCard({ action, onToggle, onConfigChange, onDelete }: ActionCardProps) {
  const cfg = action.config as Record<string, unknown>

  return (
    <div className={`rounded-md border p-3 space-y-2 ${!action.isEnabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Toggle enabled={action.isEnabled} onToggle={() => onToggle(!action.isEnabled)} />
          <span className="text-xs font-medium capitalize">{action.type.replace(/_/g, ' ')}</span>
        </div>
        <Button size="sm" variant="ghost" className="h-6 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
          Remove
        </Button>
      </div>

      {action.type === 'email_notification' && (
        <EmailNotificationForm config={cfg as Partial<EmailNotificationConfig>} onChange={onConfigChange} />
      )}
      {action.type === 'webhook' && (
        <WebhookForm config={cfg as Partial<WebhookConfig>} onChange={onConfigChange} />
      )}
      {action.type === 'email_autoresponder' && (
        <AutoresponderForm config={cfg} onChange={onConfigChange} />
      )}
    </div>
  )
}

function EmailNotificationForm({ config, onChange }: {
  config: Partial<EmailNotificationConfig>
  onChange: (c: Record<string, unknown>) => void
}) {
  const [toInput, setToInput] = useState((config.to ?? []).join(', '))
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Send to (comma-separated emails)</p>
        <Input
          className="h-7 text-xs"
          value={toInput}
          onChange={(e) => setToInput(e.target.value)}
          onBlur={() => onChange({ ...config, to: toInput.split(',').map((s) => s.trim()).filter(Boolean) })}
          placeholder="owner@example.com"
        />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Subject</p>
        <Input
          className="h-7 text-xs"
          value={config.subject ?? ''}
          onChange={(e) => onChange({ ...config, subject: e.target.value })}
          placeholder="New form response"
        />
      </div>
      <label className="flex items-center gap-2 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={config.includeResponseData ?? true}
          onChange={(e) => onChange({ ...config, includeResponseData: e.target.checked })}
        />
        Include response data in email
      </label>
    </div>
  )
}

function WebhookForm({ config, onChange }: {
  config: Partial<WebhookConfig>
  onChange: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-muted-foreground mb-1">URL</p>
        <Input
          className="h-7 text-xs"
          value={config.url ?? ''}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://your-endpoint.com/webhook"
        />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Method</p>
        <NativeSelect value={config.method ?? 'POST'} onChange={(v) => onChange({ ...config, method: v })}>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="GET">GET</option>
        </NativeSelect>
      </div>
    </div>
  )
}

function AutoresponderForm({ config, onChange }: {
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Reply-to field ref (email field)</p>
        <Input
          className="h-7 text-xs"
          value={(config.replyToFieldRef as string) ?? ''}
          onChange={(e) => onChange({ ...config, replyToFieldRef: e.target.value })}
          placeholder="email_field_ref"
        />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Subject</p>
        <Input
          className="h-7 text-xs"
          value={(config.subject as string) ?? ''}
          onChange={(e) => onChange({ ...config, subject: e.target.value })}
          placeholder="Thanks for your response"
        />
      </div>
    </div>
  )
}
