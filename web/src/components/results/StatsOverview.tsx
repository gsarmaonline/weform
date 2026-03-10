import type { FormStats } from '@/lib/api/analytics'

function fmt(seconds: number | null): string {
  if (!seconds) return '-'
  if (seconds < 60) return `${Math.round(seconds)}s`
  return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

export function StatsOverview({ stats }: { stats: FormStats }) {
  const cards = [
    { label: 'Total responses', value: stats.totalResponses.toLocaleString() },
    { label: 'Completed', value: stats.completedResponses.toLocaleString() },
    { label: 'Completion rate', value: `${stats.completionRate.toFixed(1)}%` },
    { label: 'Avg. time', value: fmt(stats.avgTimeSeconds) },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border bg-card p-5">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-3xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
