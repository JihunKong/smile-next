import { test as base, expect, type Page } from '@playwright/test'
import { TEST_USERS } from './test-data'

type UserType = keyof typeof TEST_USERS

interface AuthFixtures {
  loginAs: (userType: UserType) => Promise<void>
  logout: () => Promise<void>
  authenticatedPage: Page
}

export const test = base.extend<AuthFixtures>({
  loginAs: async ({ page }, use) => {
    const login = async (userType: UserType) => {
      const user = TEST_USERS[userType]

      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      await page.fill('input[name="email"]', user.email)
      await page.fill('input[name="password"]', user.password)
      await page.click('button[type="submit"]')

      // Wait for redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/, { timeout: 15000 })
    }
    await use(login)
  },

  logout: async ({ page }, use) => {
    const logout = async () => {
      // Look for logout button or user menu
      const userMenu = page.locator('[data-testid="user-menu"]')
      if (await userMenu.isVisible()) {
        await userMenu.click()
        await page.click('[data-testid="logout-button"]')
      } else {
        // Try direct navigation to logout
        await page.goto('/api/auth/signout')
        await page.click('button[type="submit"]')
      }
      await expect(page).toHaveURL(/.*login.*|.*\/$/)
    }
    await use(logout)
  },

  authenticatedPage: async ({ page, loginAs }, use) => {
    // Default login as student1
    await loginAs('student1')
    await use(page)
  },
})

export { expect } from '@playwright/test'

/**
 * Helper function to fill login form
 */
export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
}

/**
 * Helper function to fill signup form
 */
export async function fillSignupForm(
  page: Page,
  data: {
    email: string
    password: string
    confirmPassword?: string
    firstName: string
    lastName: string
    username?: string
  }
) {
  await page.fill('input[name="email"]', data.email)
  await page.fill('input[name="firstName"]', data.firstName)
  await page.fill('input[name="lastName"]', data.lastName)
  // Generate username from email if not provided
  const username = data.username || data.email.split('@')[0]
  await page.fill('input[name="username"]', username)
  await page.fill('input[name="password"]', data.password)
  await page.fill('input[name="confirmPassword"]', data.confirmPassword || data.password)
}

/**
 * Helper to wait for toast notification
 */
export async function waitForToast(page: Page, text?: string) {
  const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]')
  await expect(toast).toBeVisible({ timeout: 10000 })
  if (text) {
    await expect(toast).toContainText(text)
  }
}
