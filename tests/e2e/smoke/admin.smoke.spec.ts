/**
 * Admin & Super Admin Happy Path Smoke Tests
 *
 * Validates admin panel access and features for Admin and Super Admin roles.
 */

import { test, expect } from '../fixtures/auth.fixture'

// ============================================================================
// ADMIN HAPPY PATH
// ============================================================================

test.describe('Admin Happy Path', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin')
  })

  test('Admin dashboard loads with stats', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see admin dashboard heading
    await expect(page.locator('h1, h2').filter({ hasText: /admin|dashboard/i }).first()).toBeVisible({
      timeout: 10000,
    })

    // Should see stats cards (Total Users, etc.)
    await expect(page.locator('text=/total users|users|groups|activities/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('User management page accessible', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // Should see users management content
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.locator('text=/user|manage|email/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Certificate approvals page accessible', async ({ page }) => {
    await page.goto('/admin/certificates')
    await page.waitForLoadState('networkidle')

    // Should see certificates page content
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.locator('text=/certificate|approval|pending/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('System page accessible', async ({ page }) => {
    await page.goto('/admin/system')
    await page.waitForLoadState('networkidle')

    // Should see system page content
    await expect(page.locator('main').first()).toBeVisible()
  })
})

// ============================================================================
// SUPER ADMIN HAPPY PATH
// ============================================================================

test.describe('Super Admin Happy Path', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('superAdmin')
  })

  test('Full admin dashboard visible', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see admin dashboard
    await expect(page.locator('h1, h2').filter({ hasText: /admin|dashboard/i }).first()).toBeVisible({
      timeout: 10000,
    })

    // Should see quick actions
    await expect(page.locator('text=/manage users|certificate|quick action/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('All admin pages accessible', async ({ page }) => {
    // Test multiple admin pages in sequence for super admin
    const adminPages = ['/admin', '/admin/users', '/admin/certificates', '/admin/analytics', '/admin/system']

    for (const adminPage of adminPages) {
      await page.goto(adminPage)
      await page.waitForLoadState('networkidle')

      // Each page should load without access denied
      const accessDenied = await page.locator('text=/access denied|forbidden|not authorized/i').isVisible()
      expect(accessDenied).toBeFalsy()
    }
  })
})

// ============================================================================
// CROSS-ROLE NAVIGATION (Access Control)
// ============================================================================

test.describe('Cross-Role Navigation', () => {
  test('Student cannot access admin pages', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see access denied or redirect
    const accessDenied = await page.locator('text=/access denied|permission|not authorized/i').isVisible()
    const redirectedAway = !page.url().includes('/admin') || page.url().includes('/dashboard')

    expect(accessDenied || redirectedAway).toBeTruthy()
  })

  test('Teacher cannot access admin pages', async ({ page, loginAs }) => {
    await loginAs('teacher1')

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see access denied or redirect
    const accessDenied = await page.locator('text=/access denied|permission|not authorized/i').isVisible()
    const redirectedAway = !page.url().includes('/admin') || page.url().includes('/dashboard')

    expect(accessDenied || redirectedAway).toBeTruthy()
  })
})
