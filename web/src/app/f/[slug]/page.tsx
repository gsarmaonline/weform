import { formsApi } from '@/lib/api/forms'
import { FormRenderer } from '@/components/renderer/FormRenderer'
import { notFound } from 'next/navigation'

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let form
  try {
    form = await formsApi.getPublic(slug)
  } catch {
    notFound()
  }

  return <FormRenderer form={form} />
}
