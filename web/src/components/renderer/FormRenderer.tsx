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
import type { Form, FormField, FieldConfig, AnswerValue, LogicRule, LogicCondition } from '@/types'

interface FormRendererProps {
  form: Form
}

// Evaluate a single condition against current answers
function evalCondition(c: LogicCondition, answers: Record<string, AnswerValue>): boolean {
  const raw = answers[c.fieldId]
  const val = raw !== null && raw !== undefined ? String(raw) : ''
  const isEmpty = raw === null || raw === undefined || raw === '' || (Array.isArray(raw) && raw.length === 0)
  switch (c.operator) {
    case 'is':           return val === (c.value ?? '')
    case 'is_not':       return val !== (c.value ?? '')
    case 'contains':     return val.includes(c.value ?? '')
    case 'not_contains': return !val.includes(c.value ?? '')
    case 'gt':           return parseFloat(val) > parseFloat(c.value ?? '0')
    case 'gte':          return parseFloat(val) >= parseFloat(c.value ?? '0')
    case 'lt':           return parseFloat(val) < parseFloat(c.value ?? '0')
    case 'lte':          return parseFloat(val) <= parseFloat(c.value ?? '0')
    case 'is_empty':     return isEmpty
    case 'is_not_empty': return !isEmpty
    default:             return false
  }
}

// Returns the matching rule for the given page, or null
function matchRule(pageId: string, rules: LogicRule[], answers: Record<string, AnswerValue>): LogicRule | null {
  const pageRules = rules
    .filter((r) => r.sourcePageId === pageId)
    .sort((a, b) => a.position - b.position)

  for (const rule of pageRules) {
    const results = rule.conditions.map((c) => evalCondition(c, answers))
    const matched = rule.operator === 'all' ? results.every(Boolean) : results.some(Boolean)
    if (matched) return rule
  }
  return null
}

export function FormRenderer({ form }: FormRendererProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [started, setStarted] = useState(!form.welcomeScreen)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [pageHistory, setPageHistory] = useState<number[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disqualified, setDisqualified] = useState(false)

  const logicRules: LogicRule[] = (form as any).logicRules ?? []

  const handleStart = async () => {
    try {
      const { sessionToken: token } = await rendererApi.startSession(form.slug)
      setSessionToken(token)
      setStarted(true)
    } catch {
      setStarted(true)
    }
  }

  const setAnswer = useCallback((fieldId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  const doSubmit = async (currentAnswers: Record<string, AnswerValue>) => {
    setSubmitting(true)
    setError(null)
    try {
      const allAnswers: AnswerInput[] = []
      for (const page of form.pages) {
        for (const field of page.fields) {
          const val = currentAnswers[field.id]
          if (val !== undefined && val !== null && val !== '') {
            allAnswers.push({ fieldId: field.id, fieldRef: field.ref, fieldType: field.type, value: val })
          }
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

  const handleNext = async () => {
    const page = form.pages[currentPageIndex]
    const matchedRule = matchRule(page.id, logicRules, answers)

    if (matchedRule) {
      switch (matchedRule.destinationType) {
        case 'thank_you':
          await doSubmit(answers)
          return
        case 'disqualify':
          setDisqualified(true)
          return
        case 'url':
          if (matchedRule.destinationUrl) window.location.href = matchedRule.destinationUrl
          return
        case 'page': {
          const targetIdx = form.pages.findIndex((p) => p.id === matchedRule.destinationPageId)
          if (targetIdx !== -1) {
            setPageHistory((h) => [...h, currentPageIndex])
            setCurrentPageIndex(targetIdx)
            return
          }
          break
        }
      }
    }

    const isLast = currentPageIndex === form.pages.length - 1
    if (!isLast) {
      setPageHistory((h) => [...h, currentPageIndex])
      setCurrentPageIndex((i) => i + 1)
      return
    }

    await doSubmit(answers)
  }

  const handleBack = () => {
    if (pageHistory.length > 0) {
      const prev = pageHistory[pageHistory.length - 1]
      setPageHistory((h) => h.slice(0, -1))
      setCurrentPageIndex(prev)
    } else if (currentPageIndex > 0) {
      setCurrentPageIndex((i) => i - 1)
    }
  }

  // Disqualified screen
  if (disqualified) {
    return (
      <FormScreen>
        <h1 className="text-3xl font-bold">We're sorry</h1>
        <p className="mt-3 text-muted-foreground">Based on your responses, you don't qualify to continue.</p>
      </FormScreen>
    )
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
        {(currentPageIndex > 0 || pageHistory.length > 0) ? (
          <Button variant="outline" onClick={handleBack}>
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
