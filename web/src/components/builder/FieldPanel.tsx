'use client'

import { useBuilderStore } from '@/lib/stores/builderStore'
import type { FieldType } from '@/types'

const FIELD_GROUPS: { label: string; fields: { type: FieldType; label: string }[] }[] = [
  {
    label: 'Text',
    fields: [
      { type: 'short_text', label: 'Short text' },
      { type: 'long_text', label: 'Long text' },
      { type: 'statement', label: 'Statement' },
    ],
  },
  {
    label: 'Choice',
    fields: [
      { type: 'multiple_choice', label: 'Multiple choice' },
      { type: 'multi_select', label: 'Multi select' },
      { type: 'dropdown', label: 'Dropdown' },
      { type: 'yes_no', label: 'Yes / No' },
      { type: 'picture_choice', label: 'Picture choice' },
    ],
  },
  {
    label: 'Scale',
    fields: [
      { type: 'rating', label: 'Rating' },
      { type: 'opinion_scale', label: 'Opinion scale' },
    ],
  },
  {
    label: 'Input',
    fields: [
      { type: 'number', label: 'Number' },
      { type: 'email', label: 'Email' },
      { type: 'phone', label: 'Phone' },
      { type: 'url', label: 'URL' },
      { type: 'date', label: 'Date' },
      { type: 'file_upload', label: 'File upload' },
    ],
  },
  {
    label: 'Advanced',
    fields: [{ type: 'hidden', label: 'Hidden field' }],
  },
]

export function FieldPanel() {
  const addField = useBuilderStore((s) => s.addField)
  const selectedPageId = useBuilderStore((s) => s.selectedPageId)
  const form = useBuilderStore((s) => s.form)

  const handleAdd = (type: FieldType) => {
    if (!selectedPageId) return
    const page = form?.pages.find((p) => p.id === selectedPageId)
    const position = page?.fields.length ?? 0

    addField(selectedPageId, {
      id: crypto.randomUUID(),
      ref: `field_${crypto.randomUUID().slice(0, 8)}`,
      type,
      title: '',
      position,
      isRequired: false,
      config: {},
      validation: {},
    })
  }

  return (
    <aside className="w-52 overflow-y-auto border-r bg-background px-3 py-4">
      <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
        Add question
      </p>
      <div className="space-y-4">
        {FIELD_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-muted-foreground mb-1 text-xs font-medium">{group.label}</p>
            <div className="space-y-0.5">
              {group.fields.map((f) => (
                <button
                  key={f.type}
                  onClick={() => handleAdd(f.type)}
                  className="hover:bg-accent hover:text-accent-foreground w-full rounded px-2 py-1.5 text-left text-sm transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
