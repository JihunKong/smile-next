import { test as setup, expect } from '@playwright/test'
import { TEST_USERS } from './fixtures/test-data'

const authFile = 'tests/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Login as student1 for default authenticated state
  const user = TEST_USERS.student1

  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')

  // Fill login form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)

  // Submit
  await page.click('button[type="submit"]')

  // Wait for successful login
  await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/, { timeout: 15000 })

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
