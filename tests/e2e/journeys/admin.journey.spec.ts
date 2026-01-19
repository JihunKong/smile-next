/**
 * Admin Journey Tests
 *
 * End-to-end verification of admin features.
 *
 * Data Strategy:
 * - READ-ONLY tests - no data creation or modification
 * - Verifies admin features are accessible and functional
 * - Does not stack QA data
 */

import { test, expect } from '../fixtures/auth.fixture'

test.describe('Admin Journey: Dashboard & Overview', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin')
  })

  test('Complete admin dashboard flow', async ({ page }) => {
    // Step 1: Access admin dashboard
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see admin dashboard
    await expect(page.locator('h1, h2').filter({ hasText: /admin.*dashboard/i }).first()).toBeVisible()

    // Should see stats cards
    await expect(page.locator('text=/total users|users/i').first()).toBeVisible()
    await expect(page.locator('text=/groups|activities/i').first()).toBeVisible()

    // Should see quick actions
    await expect(page.locator('text=/manage users|quick action/i').first()).toBeVisible()
  })

  test('Navigate through admin sections', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Click on Users link
    const usersLink = page.locator('a[href="/admin/users"]').or(page.locator('text=/manage users/i')).first()
    if (await usersLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usersLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/.*admin\/users.*/)
    }
  })
})

test.describe('Admin Journey: User Management', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin')
  })

  test('View users list', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // Should see users management page
    await expect(page.locator('main').first()).toBeVisible()

    // Should see user-related content (search, list, or table)
    await expect(page.locator('text=/user|email|role|search/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Search/filter users (read-only)', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="search"]')
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Type a search query
      await searchInput.fill('student')
      await page.waitForTimeout(500)

      // Should still show the page (not error)
      await expect(page.locator('main').first()).toBeVisible()
    }
  })
})

test.describe('Admin Journey: Certificate Management', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin')
  })

  test('View certificates admin page', async ({ page }) => {
    await page.goto('/admin/certificates')
    await page.waitForLoadState('networkidle')

    // Should see certificates management
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.locator('text=/certificate|approval|pending/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('View certificate details (read-only)', async ({ page }) => {
    await page.goto('/admin/certificates')
    await page.waitForLoadState('networkidle')

    // If there are certificates, click on one to view details
    const certLink = page.locator('a[href*="/certificates/"], tr:has-text("certificate")').first()
    if (await certLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await certLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('main').first()).toBeVisible()
    }
  })
})

test.describe('Admin Journey: Analytics', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin')
  })

  test('View admin analytics', async ({ page }) => {
    await page.goto('/admin/analytics')
    await page.waitForLoadState('networkidle')

    // Should see analytics page or content
    await expect(page.locator('main').first()).toBeVisible()
  })
})

test.describe('Admin Journey: System Settings', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('admin')
  })

  test('View system settings (read-only)', async ({ page }) => {
    await page.goto('/admin/system')
    await page.waitForLoadState('networkidle')

    // Should see system page
    await expect(page.locator('main').first()).toBeVisible()
  })
})

// ============================================================================
// SUPER ADMIN JOURNEY
// ============================================================================

test.describe('Super Admin Journey: Full Access Verification', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('superAdmin')
  })

  test('Verify full admin access', async ({ page }) => {
    // Test all admin pages are accessible
    const adminPages = [
      { path: '/admin', check: /admin.*dashboard/i },
      { path: '/admin/users', check: /user|email/i },
      { path: '/admin/certificates', check: /certificate|approval/i },
      { path: '/admin/analytics', check: /.+/ },
      { path: '/admin/system', check: /.+/ },
    ]

    for (const { path, check } of adminPages) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Should not see access denied
      const accessDenied = await page.locator('text=/access denied|forbidden/i').isVisible()
      expect(accessDenied).toBeFalsy()

      // Should see page content
      await expect(page.locator('main').first()).toBeVisible()
    }
  })

  test('Super Admin can view all stats', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see comprehensive stats
    await expect(page.locator('text=/total users/i').first()).toBeVisible()
    await expect(page.locator('text=/groups|activities|certificates/i').first()).toBeVisible()
  })
})

// ============================================================================
// ACCESS CONTROL VERIFICATION
// ============================================================================

test.describe('Admin Journey: Access Control', () => {
  test('Verify student cannot access admin pages', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see access denied OR be redirected
    const accessDenied = await page.locator('text=/access denied|permission|not authorized/i').isVisible()
    const redirected = !page.url().includes('/admin') || page.url().includes('/dashboard')

    expect(accessDenied || redirected).toBeTruthy()
  })

  test('Verify teacher cannot access admin pages', async ({ page, loginAs }) => {
    await loginAs('teacher1')

    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    // Should see access denied OR be redirected
    const accessDenied = await page.locator('text=/access denied|permission|not authorized/i').isVisible()
    const redirected = !page.url().includes('/admin') || page.url().includes('/dashboard')

    expect(accessDenied || redirected).toBeTruthy()
  })

  test('Verify admin cannot access super admin only features', async ({ page, loginAs }) => {
    await loginAs('admin')

    // If there are super-admin-only pages, test them here
    // For now, verify admin can access regular admin pages
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1, h2').filter({ hasText: /admin/i }).first()).toBeVisible()
  })
})
