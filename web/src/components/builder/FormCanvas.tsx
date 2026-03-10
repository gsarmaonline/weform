'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBuilderStore } from '@/lib/stores/builderStore'
import { useReorderFields, useDeleteField } from '@/lib/hooks/useBuilder'
import type { FormField } from '@/types'

interface FormCanvasProps {
  workspaceId: string | undefined
  formId: string
}

export function FormCanvas({ workspaceId, formId }: FormCanvasProps) {
  const form = useBuilderStore((s) => s.form)
  const selectedPageId = useBuilderStore((s) => s.selectedPageId)
  const reorderFieldsStore = useBuilderStore((s) => s.reorderFields)
  const reorderFields = useReorderFields(workspaceId, formId)

  const page = form?.pages.find((p) => p.id === selectedPageId)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  if (!page) return null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = page.fields.findIndex((f) => f.id === active.id)
    const newIndex = page.fields.findIndex((f) => f.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    reorderFieldsStore(page.id, oldIndex, newIndex)

    const reordered = arrayMove(page.fields, oldIndex, newIndex)
    reorderFields.mutate({ pageId: page.id, fieldIds: reordered.map((f) => f.id) })
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={page.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {page.fields.map((field) => (
            <SortableFieldCard
              key={field.id}
              field={field}
              workspaceId={workspaceId}
              formId={formId}
            />
          ))}
        </SortableContext>
      </DndContext>

      {page.fields.length === 0 && (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">Add a question from the left panel</p>
        </div>
      )}
    </div>
  )
}

function SortableFieldCard({
  field,
  workspaceId,
  formId,
}: {
  field: FormField
  workspaceId: string | undefined
  formId: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })
  const selectField = useBuilderStore((s) => s.selectField)
  const selectedFieldId = useBuilderStore((s) => s.selectedFieldId)
  const removeField = useBuilderStore((s) => s.removeField)
  const deleteField = useDeleteField(workspaceId, formId)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeField(field.id)
    if (!field.id.startsWith('temp-') && workspaceId) {
      deleteField.mutate(field.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectField(field.id)}
      className={`group cursor-pointer rounded-lg border bg-background p-4 transition-shadow hover:shadow-sm ${
        selectedFieldId === field.id ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripIcon />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {field.title || <span className="text-muted-foreground italic">Untitled question</span>}
          </p>
          {field.description && (
            <p className="text-muted-foreground mt-0.5 text-xs truncate">{field.description}</p>
          )}
          <p className="text-muted-foreground mt-1.5 text-xs capitalize">
            {field.type.replace(/_/g, ' ')}
            {field.isRequired && <span className="ml-2 text-destructive">Required</span>}
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="4" cy="3.5" r="1.2" /><circle cx="10" cy="3.5" r="1.2" />
      <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
      <circle cx="4" cy="10.5" r="1.2" /><circle cx="10" cy="10.5" r="1.2" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}
