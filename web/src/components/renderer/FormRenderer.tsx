'use client'

import { useState } from 'react'
import type { Form, FormPage, AnswerValue } from '@/types'
import { Button } from '@/components/ui/button'

interface FormRendererProps {
  form: Form
}

export function FormRenderer({ form }: FormRendererProps) {
  const [started, setStarted] = useState(!form.welcomeScreen)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [submitted, setSubmitted] = useState(false)

  if (!started && form.welcomeScreen) {
    return (
      <FormScreen>
        <h1 className="text-3xl font-bold">{form.welcomeScreen.title}</h1>
        {form.welcomeScreen.description && (
          <p className="text-muted-foreground mt-2">{form.welcomeScreen.description}</p>
        )}
        <Button className="mt-8" onClick={() => setStarted(true)}>
          {form.welcomeScreen.buttonText || 'Start'}
        </Button>
      </FormScreen>
    )
  }

  if (submitted) {
    const ty = form.thankYouScreen
    return (
      <FormScreen>
        <h1 className="text-3xl font-bold">{ty?.title ?? 'Thanks!'}</h1>
        {ty?.description && (
          <p className="text-muted-foreground mt-2">{ty.description}</p>
        )}
      </FormScreen>
    )
  }

  const page = form.pages[currentPageIndex]
  if (!page) return null

  const isLast = currentPageIndex === form.pages.length - 1

  const handleNext = () => {
    if (isLast) {
      setSubmitted(true)
    } else {
      setCurrentPageIndex((i) => i + 1)
    }
  }

  return (
    <FormScreen>
      <PageView
        page={page}
        answers={answers}
        onChange={(fieldId, value) => setAnswers((prev) => ({ ...prev, [fieldId]: value }))}
      />
      <div className="mt-8 flex justify-end">
        <Button onClick={handleNext}>{isLast ? 'Submit' : 'Next'}</Button>
      </div>
      {form.theme?.showProgressBar && (
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${((currentPageIndex + 1) / form.pages.length) * 100}%` }}
          />
        </div>
      )}
    </FormScreen>
  )
}

function FormScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  )
}

function PageView({
  page,
  answers,
  onChange,
}: {
  page: FormPage
  answers: Record<string, AnswerValue>
  onChange: (fieldId: string, value: AnswerValue) => void
}) {
  return (
    <div className="space-y-8">
      {page.fields
        .filter((f) => f.type !== 'hidden' && f.type !== 'statement')
        .map((field) => (
          <div key={field.id}>
            <p className="text-lg font-medium">
              {field.title}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </p>
            {field.description && (
              <p className="text-muted-foreground mt-1 text-sm">{field.description}</p>
            )}
            <div className="mt-3">
              {/* Field input components will go here per type */}
              <input
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
                value={(answers[field.id] as string) ?? ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder="Your answer"
              />
            </div>
          </div>
        ))}
    </div>
  )
}
