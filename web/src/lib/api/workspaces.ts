import { api } from './client'
import type { Workspace } from '@/types'

export const workspacesApi = {
  list: () => api.get<{ data: Workspace[] }>('/workspaces'),
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`),
  create: (name: string) => api.post<Workspace>('/workspaces', { name }),
}
