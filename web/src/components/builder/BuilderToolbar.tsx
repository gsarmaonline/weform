'use client'

import { useBuilderStore } from '@/lib/stores/builderStore'
import { usePublishForm } from '@/lib/hooks/useBuilder'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface BuilderToolbarProps {
  workspaceId: string | undefined
  formId: string
}

export function BuilderToolbar({ workspaceId, formId }: BuilderToolbarProps) {
  const form = useBuilderStore((s) => s.form)
  const isDirty = useBuilderStore((s) => s.isDirty)
  const publish = usePublishForm(workspaceId, formId)

  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <span className="font-medium">{form?.title ?? 'Loading...'}</span>
        {form && (
          <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
            {form.status}
          </Badge>
        )}
        {isDirty && (
          <span className="text-muted-foreground text-xs">Saving...</span>
        )}
        {!isDirty && form && (
          <span className="text-muted-foreground text-xs">Saved</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`/forms/${formId}/results`}
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          Results
        </a>
        <a
          href={`/f/${form?.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
        >
          Preview
        </a>
        <Button
          size="sm"
          disabled={form?.status === 'published' || publish.isPending}
          onClick={() => publish.mutate()}
        >
          {publish.isPending ? 'Publishing...' : form?.status === 'published' ? 'Published' : 'Publish'}
        </Button>
      </div>
    </header>
  )
}
