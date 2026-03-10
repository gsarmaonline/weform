'use client'

import { useState } from 'react'
import type { ResponseRow } from '@/lib/api/analytics'

interface ResponseTableProps {
  responses: ResponseRow[]
  total: number
}

export function ResponseTable({ responses, total }: ResponseTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{total} response{total !== 1 ? 's' : ''}</p>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Answers</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((r) => (
              <>
                <tr
                  key={r.id}
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">{r.respondentEmail ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.timeToCompleteSeconds != null ? `${r.timeToCompleteSeconds}s` : '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.answers.length} field{r.answers.length !== 1 ? 's' : ''}
                    <span className="ml-2 text-xs">{expanded === r.id ? '▲' : '▼'}</span>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-expand`} className="border-b bg-muted/20">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="space-y-2">
                        {r.answers.map((a, i) => (
                          <div key={i} className="flex gap-4 text-sm">
                            <span className="w-32 shrink-0 text-muted-foreground font-mono text-xs pt-0.5">
                              {a.fieldRef}
                            </span>
                            <span className="break-all">{formatValue(a.value)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}
