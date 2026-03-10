'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'
import { builderApi } from '@/lib/api/builder'
import { formsApi } from '@/lib/api/forms'
import { useBuilderStore } from '@/lib/stores/builderStore'
import type { FieldType } from '@/types'

export function useBuilderForm(workspaceId: string | undefined, formId: string) {
  const setForm = useBuilderStore((s) => s.setForm)

  const query = useQuery({
    queryKey: ['builder', formId],
    queryFn: () => builderApi.getForm(workspaceId!, formId),
    enabled: !!workspaceId,
  })

  useEffect(() => {
    if (query.data) {
      // Merge pages into form object for the store
      setForm({ ...query.data.form, pages: query.data.pages })
    }
  }, [query.data, setForm])

  return query
}

export function useAddField(workspaceId: string | undefined, formId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, type, position }: { pageId: string; type: FieldType; position: number }) =>
      builderApi.addField(workspaceId!, formId, pageId, { type, position }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builder', formId] }),
  })
}

export function useUpdateField(workspaceId: string | undefined, formId: string) {
  return useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: string; data: Record<string, unknown> }) =>
      builderApi.updateField(workspaceId!, formId, fieldId, data as any),
  })
}

export function useDeleteField(workspaceId: string | undefined, formId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldId: string) => builderApi.deleteField(workspaceId!, formId, fieldId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builder', formId] }),
  })
}

export function useReorderFields(workspaceId: string | undefined, formId: string) {
  return useMutation({
    mutationFn: ({ pageId, fieldIds }: { pageId: string; fieldIds: string[] }) =>
      builderApi.reorderFields(workspaceId!, formId, pageId, fieldIds),
  })
}

export function useAddPage(workspaceId: string | undefined, formId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => builderApi.addPage(workspaceId!, formId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builder', formId] }),
  })
}

export function usePublishForm(workspaceId: string | undefined, formId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => formsApi.publish(workspaceId!, formId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['builder', formId] }),
  })
}

// Auto-save hook: flushes pending field updates to the backend after a debounce.
export function useAutoSave(workspaceId: string | undefined, formId: string) {
  const isDirty = useBuilderStore((s) => s.isDirty)
  const form = useBuilderStore((s) => s.form)
  const markSaved = useBuilderStore((s) => s.markSaved)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!isDirty || !form || !workspaceId) return

    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      // Persist form-level changes (title, description)
      try {
        await formsApi.update(workspaceId, formId, { title: form.title, description: form.description })
        markSaved()
      } catch {
        // Silent — user can retry manually
      }
    }, 1500)

    return () => clearTimeout(timer.current)
  }, [isDirty, form?.title, form?.description])
}
