import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Form, FormField, FormPage } from '@/types'

interface BuilderState {
  form: Form | null
  selectedFieldId: string | null
  selectedPageId: string | null
  isDirty: boolean

  // Actions
  setForm: (form: Form) => void
  selectField: (fieldId: string | null) => void
  selectPage: (pageId: string | null) => void

  updateField: (fieldId: string, updates: Partial<FormField>) => void
  addField: (pageId: string, field: FormField) => void
  removeField: (fieldId: string) => void
  reorderFields: (pageId: string, fromIndex: number, toIndex: number) => void

  updatePage: (pageId: string, updates: Partial<FormPage>) => void
  addPage: (page: FormPage) => void
  removePage: (pageId: string) => void

  updateForm: (updates: Partial<Form>) => void
  markSaved: () => void
}

export const useBuilderStore = create<BuilderState>()(
  immer((set) => ({
    form: null,
    selectedFieldId: null,
    selectedPageId: null,
    isDirty: false,

    setForm: (form) =>
      set((state) => {
        state.form = form
        state.selectedPageId = form.pages[0]?.id ?? null
        state.isDirty = false
      }),

    selectField: (fieldId) =>
      set((state) => {
        state.selectedFieldId = fieldId
      }),

    selectPage: (pageId) =>
      set((state) => {
        state.selectedPageId = pageId
        state.selectedFieldId = null
      }),

    updateField: (fieldId, updates) =>
      set((state) => {
        if (!state.form) return
        for (const page of state.form.pages) {
          const field = page.fields.find((f) => f.id === fieldId)
          if (field) {
            Object.assign(field, updates)
            state.isDirty = true
            return
          }
        }
      }),

    addField: (pageId, field) =>
      set((state) => {
        if (!state.form) return
        const page = state.form.pages.find((p) => p.id === pageId)
        if (page) {
          page.fields.push(field)
          state.selectedFieldId = field.id
          state.isDirty = true
        }
      }),

    removeField: (fieldId) =>
      set((state) => {
        if (!state.form) return
        for (const page of state.form.pages) {
          const idx = page.fields.findIndex((f) => f.id === fieldId)
          if (idx !== -1) {
            page.fields.splice(idx, 1)
            state.selectedFieldId = null
            state.isDirty = true
            return
          }
        }
      }),

    reorderFields: (pageId, fromIndex, toIndex) =>
      set((state) => {
        if (!state.form) return
        const page = state.form.pages.find((p) => p.id === pageId)
        if (!page) return
        const [moved] = page.fields.splice(fromIndex, 1)
        page.fields.splice(toIndex, 0, moved)
        page.fields.forEach((f, i) => (f.position = i))
        state.isDirty = true
      }),

    updatePage: (pageId, updates) =>
      set((state) => {
        if (!state.form) return
        const page = state.form.pages.find((p) => p.id === pageId)
        if (page) {
          Object.assign(page, updates)
          state.isDirty = true
        }
      }),

    addPage: (page) =>
      set((state) => {
        if (!state.form) return
        state.form.pages.push(page)
        state.selectedPageId = page.id
        state.isDirty = true
      }),

    removePage: (pageId) =>
      set((state) => {
        if (!state.form) return
        state.form.pages = state.form.pages.filter((p) => p.id !== pageId)
        state.isDirty = true
      }),

    updateForm: (updates) =>
      set((state) => {
        if (!state.form) return
        Object.assign(state.form, updates)
        state.isDirty = true
      }),

    markSaved: () =>
      set((state) => {
        state.isDirty = false
      }),
  })),
)
