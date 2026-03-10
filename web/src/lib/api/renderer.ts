import type { Form, AnswerValue, FieldType } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

async function publicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? res.statusText)
  }
  return res.json()
}

export interface AnswerInput {
  fieldId: string
  fieldRef: string
  fieldType: FieldType
  value: AnswerValue
}

export const rendererApi = {
  getForm: (slug: string) =>
    publicRequest<Form>(`/f/${slug}`),

  startSession: (slug: string) =>
    publicRequest<{ sessionToken: string; responseId: string }>(`/f/${slug}/sessions`, { method: 'POST' }),

  submit: (slug: string, sessionToken: string, answers: AnswerInput[]) =>
    publicRequest(`/f/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ sessionToken, answers }),
    }),
}
