import { api } from './client'
import type { Form, FormPage, FormField, FieldType } from '@/types'

interface FormFull {
  form: Form
  pages: FormPage[]
}

export const builderApi = {
  getForm: (workspaceId: string, formId: string) =>
    api.get<FormFull>(`/workspaces/${workspaceId}/forms/${formId}/builder`),

  addPage: (workspaceId: string, formId: string) =>
    api.post<FormPage>(`/workspaces/${workspaceId}/forms/${formId}/pages`, {}),

  updatePage: (workspaceId: string, formId: string, pageId: string, data: { title?: string; description?: string }) =>
    api.put<FormPage>(`/workspaces/${workspaceId}/forms/${formId}/pages/${pageId}`, data),

  deletePage: (workspaceId: string, formId: string, pageId: string) =>
    api.delete<void>(`/workspaces/${workspaceId}/forms/${formId}/pages/${pageId}`),

  addField: (workspaceId: string, formId: string, pageId: string, data: { type: FieldType; title?: string; position?: number }) =>
    api.post<FormField>(`/workspaces/${workspaceId}/forms/${formId}/pages/${pageId}/fields`, data),

  updateField: (workspaceId: string, formId: string, fieldId: string, data: Partial<FormField>) =>
    api.put<FormField>(`/workspaces/${workspaceId}/forms/${formId}/fields/${fieldId}`, data),

  deleteField: (workspaceId: string, formId: string, fieldId: string) =>
    api.delete<void>(`/workspaces/${workspaceId}/forms/${formId}/fields/${fieldId}`),

  reorderFields: (workspaceId: string, formId: string, pageId: string, fieldIds: string[]) =>
    api.post<void>(`/workspaces/${workspaceId}/forms/${formId}/pages/${pageId}/fields/reorder`, { fieldIds }),
}
