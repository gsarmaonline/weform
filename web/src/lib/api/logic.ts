import { api } from './client'
import type { LogicRule } from '@/types'

export const logicApi = {
  getRules: (workspaceId: string, formId: string): Promise<{ rules: LogicRule[] }> =>
    api.get(`/workspaces/${workspaceId}/forms/${formId}/logic`),

  createRule: (workspaceId: string, formId: string, rule: Omit<LogicRule, 'id'>): Promise<LogicRule> =>
    api.post(`/workspaces/${workspaceId}/forms/${formId}/logic`, rule),

  updateRule: (workspaceId: string, formId: string, ruleId: string, rule: Partial<LogicRule>): Promise<LogicRule> =>
    api.put(`/workspaces/${workspaceId}/forms/${formId}/logic/${ruleId}`, rule),

  deleteRule: (workspaceId: string, formId: string, ruleId: string): Promise<void> =>
    api.delete(`/workspaces/${workspaceId}/forms/${formId}/logic/${ruleId}`),
}
