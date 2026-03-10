import { api } from './client'
import type { Form, FormPage, FormField, PaginatedResponse } from '@/types'

export const formsApi = {
  list: (workspaceId: string) =>
    api.get<PaginatedResponse<Form>>(`/workspaces/${workspaceId}/forms`),

  get: (workspaceId: string, formId: string) =>
    api.get<Form>(`/workspaces/${workspaceId}/forms/${formId}`),

  create: (workspaceId: string, data: { title: string }) =>
    api.post<Form>(`/workspaces/${workspaceId}/forms`, data),

  update: (workspaceId: string, formId: string, data: Partial<Form>) =>
    api.put<Form>(`/workspaces/${workspaceId}/forms/${formId}`, data),

  delete: (workspaceId: string, formId: string) =>
    api.delete<void>(`/workspaces/${workspaceId}/forms/${formId}`),

  publish: (workspaceId: string, formId: string) =>
    api.post<Form>(`/workspaces/${workspaceId}/forms/${formId}/publish`, {}),

  // Pages
  createPage: (formId: string, data: Partial<FormPage>) =>
    api.post<FormPage>(`/forms/${formId}/pages`, data),

  updatePage: (formId: string, pageId: string, data: Partial<FormPage>) =>
    api.put<FormPage>(`/forms/${formId}/pages/${pageId}`, data),

  deletePage: (formId: string, pageId: string) =>
    api.delete<void>(`/forms/${formId}/pages/${pageId}`),

  // Fields
  createField: (formId: string, pageId: string, data: Partial<FormField>) =>
    api.post<FormField>(`/forms/${formId}/pages/${pageId}/fields`, data),

  updateField: (formId: string, fieldId: string, data: Partial<FormField>) =>
    api.put<FormField>(`/forms/${formId}/fields/${fieldId}`, data),

  deleteField: (formId: string, fieldId: string) =>
    api.delete<void>(`/forms/${formId}/fields/${fieldId}`),

  reorderFields: (formId: string, pageId: string, fieldIds: string[]) =>
    api.post<void>(`/forms/${formId}/pages/${pageId}/fields/reorder`, { fieldIds }),

  // Public (no auth)
  getPublic: (slug: string) =>
    api.get<Form>(`/f/${slug}`),
}
