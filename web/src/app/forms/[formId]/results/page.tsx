import { ResultsDashboard } from '@/components/results/ResultsDashboard'

export default async function ResultsPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  return <ResultsDashboard formId={formId} />
}
