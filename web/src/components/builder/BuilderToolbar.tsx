'use client'

import { useBuilderStore } from '@/lib/stores/builderStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function BuilderToolbar() {
  const form = useBuilderStore((s) => s.form)
  const isDirty = useBuilderStore((s) => s.isDirty)

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
          <span className="text-muted-foreground text-xs">Unsaved changes</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Preview</Button>
        <Button size="sm">Publish</Button>
      </div>
    </header>
  )
}
