import { api } from './client'
import type { FieldType } from '@/types'

export interface FormStats {
  totalResponses: number
  completedResponses: number
  completionRate: number
  avgTimeSeconds: number | null
}

export interface KVEntry { label: string; count: number }
export interface NumEntry { value: number; count: number }

export interface FieldStat {
  fieldId: string
  fieldRef: string
  fieldType: FieldType
  title: string
  position: number
  responses: number
  distribution: KVEntry[] | NumEntry[]
}

export interface AnalyticsResponse {
  overview: FormStats
  fields: FieldStat[]
}

export interface AnswerRow {
  fieldRef: string
  fieldType: FieldType
  value: unknown
}

export interface ResponseRow {
  id: string
  respondentEmail: string | null
  submittedAt: string | null
  timeToCompleteSeconds: number | null
  answers: AnswerRow[]
}

export interface ResponsesResponse {
  data: ResponseRow[]
  total: number
  limit: number
  offset: number
}

export const analyticsApi = {
  getStats: (workspaceId: string, formId: string) =>
    api.get<AnalyticsResponse>(`/workspaces/${workspaceId}/forms/${formId}/analytics`),

  listResponses: (workspaceId: string, formId: string, limit = 50, offset = 0) =>
    api.get<ResponsesResponse>(
      `/workspaces/${workspaceId}/forms/${formId}/responses?limit=${limit}&offset=${offset}`,
    ),

  exportCsvUrl: (workspaceId: string, formId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'}/workspaces/${workspaceId}/forms/${formId}/responses/export`,
}
