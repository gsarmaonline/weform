'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { FieldStat, KVEntry, NumEntry } from '@/lib/api/analytics'

const CHOICE_TYPES = ['multiple_choice', 'multi_select', 'dropdown', 'picture_choice', 'yes_no']
const NUMERIC_TYPES = ['rating', 'opinion_scale']

export function FieldCharts({ fields }: { fields: FieldStat[] }) {
  return (
    <div className="space-y-6">
      {fields.map((field) => (
        <FieldCard key={field.fieldId} field={field} />
      ))}
    </div>
  )
}

function FieldCard({ field }: { field: FieldStat }) {
  const isChoice = CHOICE_TYPES.includes(field.fieldType)
  const isNumeric = NUMERIC_TYPES.includes(field.fieldType)

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{field.title || 'Untitled question'}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{field.fieldType.replace(/_/g, ' ')}</p>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">
          {field.responses} response{field.responses !== 1 ? 's' : ''}
        </span>
      </div>

      {field.responses === 0 && (
        <p className="text-sm text-muted-foreground">No responses yet</p>
      )}

      {field.responses > 0 && isChoice && (
        <ChoiceChart data={field.distribution as KVEntry[]} total={field.responses} />
      )}

      {field.responses > 0 && isNumeric && (
        <NumericChart data={field.distribution as NumEntry[]} />
      )}

      {field.responses > 0 && !isChoice && !isNumeric && (
        <TextPreview fieldType={field.fieldType} />
      )}
    </div>
  )
}

function ChoiceChart({ data, total }: { data: KVEntry[]; total: number }) {
  if (!data?.length) return <p className="text-sm text-muted-foreground">No data</p>

  return (
    <div className="space-y-2.5">
      {data.map((entry, i) => {
        const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0
        return (
          <div key={i}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="truncate max-w-[70%]">{entry.label || '(empty)'}</span>
              <span className="text-muted-foreground">{entry.count} ({pct}%)</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']

function NumericChart({ data }: { data: NumEntry[] }) {
  if (!data?.length) return <p className="text-sm text-muted-foreground">No data</p>

  const chartData = data.map((d) => ({ name: String(d.value), count: d.count }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [v, 'Responses']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function TextPreview({ fieldType }: { fieldType: string }) {
  return (
    <p className="text-sm text-muted-foreground italic">
      Text responses — view in the Responses tab
    </p>
  )
}
