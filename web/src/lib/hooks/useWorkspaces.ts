'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspacesApi } from '@/lib/api/workspaces'

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await workspacesApi.list()
      return res.data
    },
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => workspacesApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })
}
