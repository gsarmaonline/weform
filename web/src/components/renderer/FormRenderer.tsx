'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { rendererApi, type AnswerInput } from '@/lib/api/renderer'
import { ShortText } from './fields/ShortText'
import { LongText } from './fields/LongText'
import { MultipleChoice } from './fields/MultipleChoice'
import { MultiSelect } from './fields/MultiSelect'
import { Dropdown } from './fields/Dropdown'
import { YesNo } from './fields/YesNo'
import { Rating } from './fields/Rating'
import { OpinionScale } from './fields/OpinionScale'
import { NumberInput } from './fields/NumberInput'
import { PictureChoice } from './fields/PictureChoice'
import type { Form, FormField, FieldConfig, AnswerValue } from '@/types'

interface FormRendererProps {
  form: Form
}

export function FormRenderer({ form }: FormRendererProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [started, setStarted] = useState(!form.welcomeScreen)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    try {
      const { sessionToken: token } = await rendererApi.startSession(form.slug)
      setSessionToken(token)
      setStarted(true)
    } catch {
      setStarted(true) // Proceed even if session creation fails
    }
  }

  const setAnswer = useCallback((fieldId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  const handleNext = async () => {
    const isLast = currentPageIndex === form.pages.length - 1
    if (!isLast) {
      setCurrentPageIndex((i) => i + 1)
      return
    }

    // Submit
    setSubmitting(true)
    setError(null)
    try {
      const page = form.pages[currentPageIndex]
      const allAnswers: AnswerInput[] = []

      for (const field of (page?.fields ?? [])) {
        const val = answers[field.id]
        if (val !== undefined && val !== null && val !== '') {
          allAnswers.push({
            fieldId: field.id,
            fieldRef: field.ref,
            fieldType: field.type,
            value: val,
          })
        }
      }

      if (sessionToken) {
        await rendererApi.submit(form.slug, sessionToken, allAnswers)
      }
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Welcome screen
  if (!started) {
    const ws = form.welcomeScreen as any
    return (
      <FormScreen>
        <h1 className="text-3xl font-bold">{ws?.title ?? form.title}</h1>
        {ws?.description && <p className="mt-3 text-muted-foreground">{ws.description}</p>}
        <Button className="mt-8" size="lg" onClick={handleStart}>
          {ws?.buttonText ?? 'Start'}
        </Button>
      </FormScreen>
    )
  }

  // Thank you screen
  if (submitted) {
    const ty = form.thankYouScreen as any
    return (
      <FormScreen>
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold">{ty?.title ?? 'Thank you!'}</h1>
        {ty?.description && <p className="mt-3 text-muted-foreground">{ty.description}</p>}
        {ty?.redirectUrl && (
          <Button className="mt-8" onClick={() => window.location.href = ty.redirectUrl}>
            {ty.buttonText ?? 'Continue'}
          </Button>
        )}
      </FormScreen>
    )
  }

  const page = form.pages[currentPageIndex]
  if (!page) return null

  const isLast = currentPageIndex === form.pages.length - 1
  const totalPages = form.pages.length
  const progress = ((currentPageIndex + 1) / totalPages) * 100

  const visibleFields = page.fields.filter(
    (f) => f.type !== 'hidden' && f.type !== 'statement',
  )
  const statementFields = page.fields.filter((f) => f.type === 'statement')

  // Validate required fields on current page
  const canProceed = visibleFields.every((f) => {
    if (!f.isRequired) return true
    const val = answers[f.id]
    if (val === null || val === undefined || val === '') return false
    if (Array.isArray(val)) return val.length > 0
    return true
  })

  return (
    <FormScreen>
      {/* Progress bar */}
      {totalPages > 1 && (
        <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="space-y-10">
        {/* Statement blocks (display only) */}
        {statementFields.map((f) => {
          const cfg = (f.config ?? {}) as FieldConfig
          return (
            <div key={f.id} className="rounded-lg bg-muted/50 px-5 py-4">
              <p className="font-medium">{f.title}</p>
              {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
            </div>
          )
        })}

        {/* Input fields */}
        {visibleFields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={(v) => setAnswer(field.id, v)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      <div className="mt-10 flex items-center justify-between">
        {currentPageIndex > 0 ? (
          <Button variant="outline" onClick={() => setCurrentPageIndex((i) => i - 1)}>
            Back
          </Button>
        ) : <div />}

        <Button onClick={handleNext} disabled={!canProceed || submitting} size="lg">
          {submitting ? 'Submitting...' : isLast ? 'Submit' : 'Next'}
        </Button>
      </div>
    </FormScreen>
  )
}

function FormScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField
  value: AnswerValue
  onChange: (v: AnswerValue) => void
}) {
  const cfg = (field.config ?? {}) as FieldConfig

  return (
    <div>
      <p className="mb-3 text-lg font-medium leading-snug">
        {field.title || 'Question'}
        {field.isRequired && <span className="ml-1 text-destructive">*</span>}
      </p>
      {field.description && (
        <p className="mb-3 text-sm text-muted-foreground">{field.description}</p>
      )}
      <FieldControl field={field} cfg={cfg} value={value} onChange={onChange} />
    </div>
  )
}

function FieldControl({
  field,
  cfg,
  value,
  onChange,
}: {
  field: FormField
  cfg: FieldConfig
  value: AnswerValue
  onChange: (v: AnswerValue) => void
}) {
  switch (field.type) {
    case 'short_text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <ShortText
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={cfg.placeholder}
        />
      )
    case 'long_text':
      return (
        <LongText
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={cfg.placeholder}
        />
      )
    case 'multiple_choice':
      return (
        <MultipleChoice
          options={cfg.options ?? []}
          value={(value as string) ?? ''}
          onChange={onChange}
          allowOther={cfg.allowOther}
        />
      )
    case 'multi_select':
      return (
        <MultiSelect
          options={cfg.options ?? []}
          value={(value as string[]) ?? []}
          onChange={onChange}
        />
      )
    case 'dropdown':
      return (
        <Dropdown
          options={cfg.options ?? []}
          value={(value as string) ?? ''}
          onChange={onChange}
        />
      )
    case 'yes_no':
      return (
        <YesNo
          value={value as boolean | null}
          onChange={onChange}
          yesLabel={cfg.yesLabel}
          noLabel={cfg.noLabel}
        />
      )
    case 'rating':
      return (
        <Rating
          value={value as number | null}
          onChange={onChange}
          steps={cfg.steps}
          shape={cfg.shape}
          startLabel={cfg.startLabel}
          endLabel={cfg.endLabel}
        />
      )
    case 'opinion_scale':
      return (
        <OpinionScale
          value={value as number | null}
          onChange={onChange}
          start={cfg.start}
          end={cfg.end}
          startLabel={cfg.startLabel}
          endLabel={cfg.endLabel}
        />
      )
    case 'number':
      return (
        <NumberInput
          value={(value as string) ?? ''}
          onChange={onChange}
          min={cfg.min}
          max={cfg.max}
          prefix={cfg.prefix}
          suffix={cfg.suffix}
        />
      )
    case 'date':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-b-2 border-muted bg-transparent py-2 text-base outline-none transition-colors focus:border-primary"
        />
      )
    case 'picture_choice':
      return (
        <PictureChoice
          options={cfg.options ?? []}
          value={(value as string) ?? ''}
          onChange={onChange}
        />
      )
    default:
      return (
        <ShortText
          value={(value as string) ?? ''}
          onChange={onChange}
        />
      )
  }
}
