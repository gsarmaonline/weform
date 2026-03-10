import { api } from './client'
import type { Workflow, WorkflowAction } from '@/types'

export const workflowsApi = {
  list: (workspaceId: string, formId: string): Promise<{ workflows: Workflow[] }> =>
    api.get(`/workspaces/${workspaceId}/forms/${formId}/workflows`),

  create: (workspaceId: string, formId: string, data: Pick<Workflow, 'name' | 'trigger' | 'isEnabled'>): Promise<Workflow> =>
    api.post(`/workspaces/${workspaceId}/forms/${formId}/workflows`, data),

  update: (workspaceId: string, formId: string, workflowId: string, data: Partial<Workflow>): Promise<Workflow> =>
    api.put(`/workspaces/${workspaceId}/forms/${formId}/workflows/${workflowId}`, data),

  delete: (workspaceId: string, formId: string, workflowId: string): Promise<void> =>
    api.delete(`/workspaces/${workspaceId}/forms/${formId}/workflows/${workflowId}`),

  addAction: (workspaceId: string, formId: string, workflowId: string, action: Omit<WorkflowAction, 'id' | 'workflowId'>): Promise<WorkflowAction> =>
    api.post(`/workspaces/${workspaceId}/forms/${formId}/workflows/${workflowId}/actions`, action),

  updateAction: (workspaceId: string, formId: string, workflowId: string, actionId: string, action: Partial<WorkflowAction>): Promise<WorkflowAction> =>
    api.put(`/workspaces/${workspaceId}/forms/${formId}/workflows/${workflowId}/actions/${actionId}`, action),

  deleteAction: (workspaceId: string, formId: string, workflowId: string, actionId: string): Promise<void> =>
    api.delete(`/workspaces/${workspaceId}/forms/${formId}/workflows/${workflowId}/actions/${actionId}`),
}
