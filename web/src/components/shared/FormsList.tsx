'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspaces } from '@/lib/hooks/useWorkspaces'
import { useForms, useCreateForm, useDeleteForm } from '@/lib/hooks/useForms'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Form } from '@/types'

export function FormsList() {
  const router = useRouter()
  const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces()
  const workspace = workspaces?.[0]

  const { data: forms, isLoading: loadingForms } = useForms(workspace?.id)
  const createForm = useCreateForm(workspace?.id)
  const deleteForm = useDeleteForm(workspace?.id)

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    const form = await createForm.mutateAsync(newTitle.trim())
    setShowCreate(false)
    setNewTitle('')
    router.push(`/builder/${form.id}`)
  }

  if (loadingWorkspaces) {
    return <div className="p-8 text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Forms</h1>
          {workspace && (
            <p className="text-sm text-muted-foreground mt-0.5">{workspace.name}</p>
          )}
        </div>
        <Button onClick={() => setShowCreate(true)}>New form</Button>
      </div>

      {loadingForms ? (
        <div className="text-sm text-muted-foreground">Loading forms...</div>
      ) : !forms?.length ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onOpen={() => router.push(`/builder/${form.id}`)}
              onDelete={() => deleteForm.mutate(form.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New form</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="form-title">Title</Label>
              <Input
                id="form-title"
                placeholder="Customer feedback survey"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim() || createForm.isPending}>
                {createForm.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FormCard({
  form,
  onOpen,
  onDelete,
}: {
  form: Form
  onOpen: () => void
  onDelete: () => void
}) {
  return (
    <div className="group relative rounded-lg border bg-card p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <button className="text-left flex-1" onClick={onOpen}>
          <p className="font-medium leading-snug">{form.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {form.cachedResponseCount} response{form.cachedResponseCount !== 1 ? 's' : ''}
          </p>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={form.status === 'published' ? 'default' : 'secondary'}>
            {form.status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-opacity">
              <DotsIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={onDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Updated {new Date(form.updatedAt).toLocaleDateString()}
      </p>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed p-12 text-center">
      <p className="font-medium">No forms yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        Create your first form to start collecting responses.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        Create a form
      </Button>
    </div>
  )
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
    </svg>
  )
}
