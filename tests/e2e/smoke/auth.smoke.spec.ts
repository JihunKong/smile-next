/**
 * Authentication Smoke Tests
 *
 * Validates login works for all 4 account types and protected routes work.
 */

import { test, expect } from '../fixtures/auth.fixture'

test.describe('Authentication Smoke', () => {
  test('Student can login and reach dashboard', async ({ page, loginAs }) => {
    await loginAs('student1')
    await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('Teacher can login and reach dashboard', async ({ page, loginAs }) => {
    await loginAs('teacher1')
    await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('Admin can login and reach dashboard', async ({ page, loginAs }) => {
    await loginAs('admin')
    await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('Super Admin can login and reach dashboard', async ({ page, loginAs }) => {
    await loginAs('superAdmin')
    await expect(page).toHaveURL(/.*dashboard.*|.*groups.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('Protected route redirects to login', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/groups')
    await expect(page).toHaveURL(/.*login.*/, { timeout: 10000 })
  })
})
