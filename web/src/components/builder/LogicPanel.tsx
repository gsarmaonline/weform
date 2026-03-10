'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logicApi } from '@/lib/api/logic'
import { useBuilderStore } from '@/lib/stores/builderStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { LogicRule, LogicCondition, FormPage, FormField } from '@/types'

interface LogicPanelProps {
  workspaceId: string | undefined
  formId: string
}

const CONDITION_OPERATORS = [
  { value: 'is', label: 'is' },
  { value: 'is_not', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: '<=' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
]

const NO_VALUE_OPS = new Set(['is_empty', 'is_not_empty'])

function emptyCondition(): Omit<LogicCondition, 'id' | 'ruleId' | 'fieldRef'> {
  return { fieldId: '', operator: 'is', value: '' }
}

function emptyRule(pages: FormPage[]): Omit<LogicRule, 'id'> {
  return {
    sourcePageId: pages[0]?.id ?? '',
    position: 0,
    operator: 'all',
    destinationType: 'thank_you',
    destinationPageId: undefined,
    destinationUrl: undefined,
    conditions: [],
  }
}

export function LogicPanel({ workspaceId, formId }: LogicPanelProps) {
  const form = useBuilderStore((s) => s.form)
  const pages = form?.pages ?? []
  const allFields = pages.flatMap((p) => p.fields)

  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['logic', formId],
    queryFn: () => logicApi.getRules(workspaceId!, formId),
    enabled: !!workspaceId,
  })
  const rules = data?.rules ?? []

  const createMutation = useMutation({
    mutationFn: (rule: Omit<LogicRule, 'id'>) => logicApi.createRule(workspaceId!, formId, rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logic', formId] }),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: Partial<LogicRule> }) =>
      logicApi.updateRule(workspaceId!, formId, id, rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logic', formId] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => logicApi.deleteRule(workspaceId!, formId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['logic', formId] }),
  })

  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Omit<LogicRule, 'id'>>(() => emptyRule(pages))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<LogicRule | null>(null)

  function startAdd() {
    setDraft(emptyRule(pages))
    setAdding(true)
  }

  function saveAdd() {
    createMutation.mutate(draft, { onSuccess: () => setAdding(false) })
  }

  function startEdit(rule: LogicRule) {
    setEditingId(rule.id)
    setEditDraft({ ...rule, conditions: rule.conditions.map((c) => ({ ...c })) })
  }

  function saveEdit() {
    if (!editDraft) return
    updateMutation.mutate(
      { id: editDraft.id, rule: editDraft },
      { onSuccess: () => { setEditingId(null); setEditDraft(null) } }
    )
  }

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Jump Logic</h2>
        <Button size="sm" variant="outline" onClick={startAdd} disabled={adding || pages.length < 2}>
          + Add rule
        </Button>
      </div>

      {pages.length < 2 && (
        <p className="text-xs text-muted-foreground">Add at least 2 pages to create logic rules.</p>
      )}

      {rules.map((rule) =>
        editingId === rule.id && editDraft ? (
          <RuleForm
            key={rule.id}
            rule={editDraft}
            pages={pages}
            fields={allFields}
            onChange={(r) => setEditDraft(r as LogicRule)}
            onSave={saveEdit}
            onCancel={() => { setEditingId(null); setEditDraft(null) }}
            saving={updateMutation.isPending}
          />
        ) : (
          <RuleCard
            key={rule.id}
            rule={rule}
            pages={pages}
            fields={allFields}
            onEdit={() => startEdit(rule)}
            onDelete={() => deleteMutation.mutate(rule.id)}
          />
        )
      )}

      {adding && (
        <RuleForm
          rule={draft}
          pages={pages}
          fields={allFields}
          onChange={setDraft}
          onSave={saveAdd}
          onCancel={() => setAdding(false)}
          saving={createMutation.isPending}
        />
      )}

      {rules.length === 0 && !adding && pages.length >= 2 && (
        <p className="text-xs text-muted-foreground">
          No rules yet. Rules are evaluated top-to-bottom; first match wins.
        </p>
      )}
    </div>
  )
}

interface RuleCardProps {
  rule: LogicRule
  pages: FormPage[]
  fields: FormField[]
  onEdit: () => void
  onDelete: () => void
}

function RuleCard({ rule, pages, fields, onEdit, onDelete }: RuleCardProps) {
  const sourcePage = pages.find((p) => p.id === rule.sourcePageId)
  const destPage = pages.find((p) => p.id === rule.destinationPageId)
  const sourceIdx = pages.indexOf(sourcePage!)

  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 text-sm flex-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            On page: {sourcePage?.title || `Page ${sourceIdx + 1}`}
          </p>
          {rule.conditions.map((c, i) => {
            const field = fields.find((f) => f.id === c.fieldId)
            return (
              <p key={c.id ?? i} className="text-xs">
                {i === 0 ? 'If' : rule.operator === 'all' ? 'AND' : 'OR'}{' '}
                <span className="font-medium">{field?.title || c.fieldId}</span>{' '}
                {c.operator.replace(/_/g, ' ')}{c.value ? ` "${c.value}"` : ''}
              </p>
            )
          })}
          <p className="text-xs text-primary font-medium">
            {rule.destinationType === 'page' && `→ Jump to: ${destPage?.title || rule.destinationPageId}`}
            {rule.destinationType === 'thank_you' && '→ Show thank you screen'}
            {rule.destinationType === 'url' && `→ Redirect to: ${rule.destinationUrl}`}
            {rule.destinationType === 'disqualify' && '→ Disqualify respondent'}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">Del</Button>
        </div>
      </div>
    </div>
  )
}

interface RuleFormProps {
  rule: Omit<LogicRule, 'id'> | LogicRule
  pages: FormPage[]
  fields: FormField[]
  onChange: (rule: Omit<LogicRule, 'id'> | LogicRule) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
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

function RuleForm({ rule, pages, fields, onChange, onSave, onCancel, saving }: RuleFormProps) {
  function updateCondition(i: number, patch: Partial<LogicCondition>) {
    const conditions = rule.conditions.map((c, idx) => idx === i ? { ...c, ...patch } : c)
    onChange({ ...rule, conditions })
  }

  function addCondition() {
    const c = emptyCondition() as LogicCondition
    onChange({ ...rule, conditions: [...rule.conditions, c] })
  }

  function removeCondition(i: number) {
    onChange({ ...rule, conditions: rule.conditions.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-muted-foreground">On page</span>
        <NativeSelect value={rule.sourcePageId} onChange={(v) => onChange({ ...rule, sourcePageId: v })}>
          {pages.map((p, i) => <option key={p.id} value={p.id}>{p.title || `Page ${i + 1}`}</option>)}
        </NativeSelect>
        <span className="text-muted-foreground">match</span>
        <NativeSelect value={rule.operator} onChange={(v) => onChange({ ...rule, operator: v as 'all' | 'any' })}>
          <option value="all">all</option>
          <option value="any">any</option>
        </NativeSelect>
        <span className="text-muted-foreground">conditions</span>
      </div>

      <div className="space-y-2">
        {rule.conditions.map((c, i) => (
          <div key={i} className="flex items-center gap-1 flex-wrap">
            <NativeSelect value={c.fieldId} onChange={(v) => updateCondition(i, { fieldId: v })}>
              <option value="">Field...</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.title || f.ref}</option>)}
            </NativeSelect>
            <NativeSelect value={c.operator} onChange={(v) => updateCondition(i, { operator: v })}>
              {CONDITION_OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
            </NativeSelect>
            {!NO_VALUE_OPS.has(c.operator) && (
              <Input
                className="h-7 text-xs w-24"
                placeholder="value"
                value={c.value ?? ''}
                onChange={(e) => updateCondition(i, { value: e.target.value })}
              />
            )}
            {rule.conditions.length > 1 && (
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeCondition(i)}>×</Button>
            )}
          </div>
        ))}
        <Button size="sm" variant="ghost" className="text-xs h-6" onClick={addCondition}>+ condition</Button>
      </div>

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-muted-foreground">Then</span>
        <NativeSelect
          value={rule.destinationType}
          onChange={(v) => onChange({ ...rule, destinationType: v as LogicRule['destinationType'] })}
        >
          <option value="page">Jump to page</option>
          <option value="thank_you">Show thank you</option>
          <option value="disqualify">Disqualify</option>
          <option value="url">Redirect to URL</option>
        </NativeSelect>
        {rule.destinationType === 'page' && (
          <NativeSelect
            value={rule.destinationPageId ?? ''}
            onChange={(v) => onChange({ ...rule, destinationPageId: v })}
          >
            <option value="">Select page...</option>
            {pages.filter((p) => p.id !== rule.sourcePageId).map((p, i) => (
              <option key={p.id} value={p.id}>{p.title || `Page ${i + 1}`}</option>
            ))}
          </NativeSelect>
        )}
        {rule.destinationType === 'url' && (
          <Input
            className="h-7 text-xs w-48"
            placeholder="https://..."
            value={rule.destinationUrl ?? ''}
            onChange={(e) => onChange({ ...rule, destinationUrl: e.target.value })}
          />
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onSave} disabled={saving}>Save rule</Button>
      </div>
    </div>
  )
}
