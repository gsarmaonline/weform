import { BuilderShell } from '@/components/builder/BuilderShell'

export default async function BuilderPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params
  return <BuilderShell formId={formId} />
}
