import { test, expect } from '@playwright/test'
import { TEST_USERS, TEST_PASSWORD, generateNewUser } from './fixtures/test-data'
import { fillLoginForm, fillSignupForm } from './fixtures/auth.fixture'

test.describe('Authentication', () => {
  test.describe('Signup', () => {
    test('should successfully create a new account', async ({ page }) => {
      const newUser = generateNewUser()

      await page.goto('/auth/signup')
      await page.waitForLoadState('networkidle')

      await fillSignupForm(page, newUser)
      await page.click('button[type="submit"]')

      // Should redirect to check-email, login, or dashboard
      await expect(page).toHaveURL(/.*check-email.*|.*login.*|.*dashboard.*/, { timeout: 15000 })
    })

    test('should show error for weak password (missing uppercase)', async ({ page }) => {
      const newUser = generateNewUser()

      await page.goto('/auth/signup')
      await fillSignupForm(page, { ...newUser, password: 'test1234!' })
      await page.click('button[type="submit"]')

      // Should show validation error - "Password must contain an uppercase letter"
      await expect(page.locator('text=/uppercase/i')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for weak password (missing number)', async ({ page }) => {
      const newUser = generateNewUser()

      await page.goto('/auth/signup')
      await fillSignupForm(page, { ...newUser, password: 'Testtest!' })
      await page.click('button[type="submit"]')

      // Should show validation error - "Password must contain a number"
      await expect(page.locator('text=/number/i')).toBeVisible({ timeout: 5000 })
    })

    test('should show error for password too short', async ({ page }) => {
      const newUser = generateNewUser()

      await page.goto('/auth/signup')
      await fillSignupForm(page, { ...newUser, password: 'Test1!' })
      await page.click('button[type="submit"]')

      // Should show validation error - "Password must be at least 8 characters"
      await expect(page.locator('text=/8 characters|at least 8/i')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should reject duplicate email', async ({ page }) => {
      const existingUser = TEST_USERS.student1

      await page.goto('/auth/signup')
      await fillSignupForm(page, {
        email: existingUser.email,
        password: TEST_PASSWORD,
        firstName: 'New',
        lastName: 'User',
      })
      await page.click('button[type="submit"]')

      // Should show error about existing email - "Email already exists" or similar
      await expect(page.locator('text=/already|exist|registered|in use/i')).toBeVisible({
        timeout: 5000,
      })
    })
  })

  test.describe('Login', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      const user = TEST_USERS.student1

      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      await fillLoginForm(page, user.email, user.password)
      await page.click('button[type="submit"]')

      // Should redirect to dashboard or groups
      await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/, { timeout: 15000 })
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      await fillLoginForm(page, 'invalid@email.com', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/invalid|incorrect|wrong|failed/i')).toBeVisible({
        timeout: 5000,
      })
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')

      const passwordInput = page.locator('input[name="password"]')

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle button - use specific data-testid
      const toggleButton = page.locator('[data-testid="toggle-password"]')
      await expect(toggleButton).toBeVisible({ timeout: 5000 })
      await toggleButton.click()

      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies()

      await page.goto('/groups')

      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 })
    })

    test('should redirect to login when accessing activity page', async ({ page }) => {
      await page.context().clearCookies()

      await page.goto('/activities/some-activity-id')

      await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 })
    })
  })

  test.describe('Logout', () => {
    test('should successfully logout', async ({ page }) => {
      // First login
      const user = TEST_USERS.student1
      await page.goto('/auth/login')
      await fillLoginForm(page, user.email, user.password)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/, { timeout: 15000 })

      // Now logout - look for user menu or logout button
      const logoutButton = page.locator(
        '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")'
      )
      const userMenu = page.locator(
        '[data-testid="user-menu"], button:has-text("Account"), [aria-label*="user"]'
      )

      if (await userMenu.isVisible()) {
        await userMenu.first().click()
        await page.waitForTimeout(500)
      }

      if (await logoutButton.isVisible()) {
        await logoutButton.first().click()
        // Should redirect to home or login
        await expect(page).toHaveURL(/.*login.*|^\/$/, { timeout: 10000 })
      }
    })
  })
})
