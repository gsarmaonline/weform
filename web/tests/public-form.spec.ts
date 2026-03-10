/**
 * Tests for the public form renderer — no auth required.
 * Assumes a published form with slug "test-form" exists,
 * or uses the API to create one first.
 */
import { test, expect } from '@playwright/test'

const FORM_SLUG = process.env.TEST_FORM_SLUG ?? 'test-form'

test.describe('Public form renderer', () => {
  test('loads the form welcome screen', async ({ page }) => {
    await page.goto(`/f/${FORM_SLUG}`)
    // Should show a start/submit button or form content
    await expect(page.locator('button, [role="button"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('shows 404 for unknown slug', async ({ page }) => {
    const res = await page.goto('/f/this-slug-does-not-exist-xyz')
    expect(res?.status()).toBe(404)
  })
})
