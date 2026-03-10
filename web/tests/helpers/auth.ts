/**
 * Auth helper for Playwright tests.
 *
 * Since Google OAuth can't be automated in tests, we hit the backend's
 * test-only endpoint (only enabled when ENV=test) to get a JWT for a
 * seeded test user, then store it in sessionStorage so the app picks it up.
 */
import { Page } from '@playwright/test'

const API = process.env.API_URL ?? 'http://localhost:8080/api/v1'
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? 'test@weform.dev'

export async function loginAsTestUser(page: Page): Promise<string> {
  // Get a JWT from the backend test-login endpoint
  const res = await page.request.post(`${API}/auth/test-login`, {
    data: { email: TEST_EMAIL },
  })

  if (!res.ok()) {
    throw new Error(
      `test-login failed: ${res.status()} — is the backend running with ENV=test?`
    )
  }

  const { token } = await res.json()

  // Seed sessionStorage before the app loads
  await page.addInitScript((t) => {
    sessionStorage.setItem('backendToken', t)
  }, token)

  return token
}
