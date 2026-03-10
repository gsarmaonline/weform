// ---- Enums ----------------------------------------------------------------

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'multi_select'
  | 'dropdown'
  | 'yes_no'
  | 'rating'
  | 'opinion_scale'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'file_upload'
  | 'picture_choice'
  | 'statement'
  | 'hidden'

export type FormStatus = 'draft' | 'published' | 'closed' | 'archived'

export type WorkspaceRole = 'owner' | 'editor' | 'viewer'

// ---- Auth -----------------------------------------------------------------

export interface User {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
}

// ---- Workspace ------------------------------------------------------------

export interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
  avatarUrl: string | null
}

export interface WorkspaceMember {
  userId: string
  role: WorkspaceRole
  fullName: string | null
  email: string
  avatarUrl: string | null
}

// ---- Theme ----------------------------------------------------------------

export interface FormTheme {
  id: string
  name: string
  isSystem: boolean
  fontFamily: string
  colorBackground: string
  colorQuestion: string
  colorAnswer: string
  colorButton: string
  colorButtonText: string
  colorProgress: string
  showProgressBar: boolean
  showQuestionNumbers: boolean
  buttonStyle: 'square' | 'rounded' | 'pill'
  backgroundImageUrl: string | null
}

// ---- Field ----------------------------------------------------------------

export interface FieldOption {
  id: string
  label: string
  imageUrl?: string
  description?: string
}

export interface FieldConfig {
  // text
  maxLength?: number
  placeholder?: string
  // choice
  options?: FieldOption[]
  randomize?: boolean
  allowOther?: boolean
  otherLabel?: string
  // yes_no
  yesLabel?: string
  noLabel?: string
  // rating
  steps?: number
  shape?: 'star' | 'heart' | 'thumb' | 'number'
  startLabel?: string
  endLabel?: string
  // opinion_scale
  start?: number
  end?: number
  // number
  min?: number
  max?: number
  decimalPlaces?: number
  prefix?: string
  suffix?: string
  // date
  format?: string
  includeTime?: boolean
  // file_upload
  maxSizeMb?: number
  maxFiles?: number
  allowedTypes?: string[]
  // hidden
  defaultValue?: string
  populateFrom?: string
  // statement
  buttonLabel?: string
  media?: { type: 'image' | 'video'; url: string }
}

export interface VisibilityCondition {
  fieldRef: string
  condition: 'is' | 'is_not' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty'
  value?: string
}

export interface VisibilityRule {
  operator: 'all' | 'any'
  conditions: VisibilityCondition[]
}

export interface FormField {
  id: string
  ref: string
  type: FieldType
  title: string
  description?: string
  position: number
  isRequired: boolean
  config: FieldConfig
  validation: Record<string, unknown>
  visibilityRule?: VisibilityRule
}

// ---- Page -----------------------------------------------------------------

export interface FormPage {
  id: string
  title?: string
  description?: string
  position: number
  fields: FormField[]
}

// ---- Logic ----------------------------------------------------------------

export interface LogicCondition {
  id: string
  fieldId: string
  fieldRef: string
  operator: string
  value?: string
}

export interface LogicRule {
  id: string
  sourcePageId: string
  position: number
  operator: 'all' | 'any'
  destinationType: 'page' | 'thank_you' | 'url' | 'disqualify'
  destinationPageId?: string
  destinationUrl?: string
  conditions: LogicCondition[]
}

// ---- Workflows ------------------------------------------------------------

export type WorkflowTrigger = 'on_submission' | 'on_completion'
export type WorkflowActionType = 'email_notification' | 'email_autoresponder' | 'webhook'

export interface EmailNotificationConfig {
  to: string[]
  subject: string
  includeResponseData: boolean
}

export interface WebhookConfig {
  url: string
  method: 'POST' | 'GET' | 'PUT'
  headers?: Record<string, string>
}

export interface WorkflowAction {
  id: string
  workflowId: string
  type: WorkflowActionType
  position: number
  isEnabled: boolean
  config: EmailNotificationConfig | WebhookConfig | Record<string, unknown>
}

export interface Workflow {
  id: string
  formId: string
  name: string
  isEnabled: boolean
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  createdAt: string
  updatedAt: string
}

// ---- Form -----------------------------------------------------------------

export interface WelcomeScreen {
  title: string
  description?: string
  buttonText: string
  media?: { type: 'image' | 'video'; url: string }
}

export interface ThankYouScreen {
  title: string
  description?: string
  buttonText?: string
  redirectUrl?: string
  showSocialShare: boolean
}

export interface Form {
  id: string
  workspaceId: string
  title: string
  slug: string
  status: FormStatus
  description?: string
  themeId?: string
  theme?: FormTheme
  welcomeScreen?: WelcomeScreen
  thankYouScreen?: ThankYouScreen
  pages: FormPage[]
  logicRules: LogicRule[]
  captchaEnabled: boolean
  maxSubmissions?: number
  cachedResponseCount: number
  cachedCompletionRate?: number
  createdAt: string
  updatedAt: string
}

// ---- Responses ------------------------------------------------------------

export type ResponseStatus = 'in_progress' | 'submitted' | 'partial'

export type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | { files: { url: string; filename: string; sizeByes: number; mimeType: string }[] }
  | null

export interface ResponseAnswer {
  fieldId: string
  fieldRef: string
  fieldType: FieldType
  value: AnswerValue
}

export interface FormResponse {
  id: string
  formId: string
  status: ResponseStatus
  respondentEmail?: string
  respondentName?: string
  answers: ResponseAnswer[]
  startedAt: string
  submittedAt?: string
  timeToCompleteSeconds?: number
}

// ---- API Pagination -------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}
