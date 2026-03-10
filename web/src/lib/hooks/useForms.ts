'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formsApi } from '@/lib/api/forms'
import type { Form } from '@/types'

export function useForms(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['forms', workspaceId],
    queryFn: async () => {
      const res = await formsApi.list(workspaceId!)
      return res.data
    },
    enabled: !!workspaceId,
  })
}

export function useCreateForm(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => formsApi.create(workspaceId!, { title }),
    onSuccess: (newForm: Form) => {
      queryClient.invalidateQueries({ queryKey: ['forms', workspaceId] })
      return newForm
    },
  })
}

export function useDeleteForm(workspaceId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formId: string) => formsApi.delete(workspaceId!, formId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forms', workspaceId] }),
  })
}
