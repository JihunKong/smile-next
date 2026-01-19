/**
 * Shared Feature Smoke Tests
 *
 * Validates features accessible by multiple roles: certificates, messages, results.
 */

import { test, expect } from '../fixtures/auth.fixture'

// ============================================================================
// CERTIFICATES PATH (All Roles)
// ============================================================================

test.describe('Certificates Access', () => {
  test('Student can view certificates page', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto('/certificates')
    await page.waitForLoadState('networkidle')

    // Should see certificates page
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Student can view my-certificates page', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto('/my-certificates')
    await page.waitForLoadState('networkidle')

    // Should see my certificates page
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Teacher can access certificate designer', async ({ page, loginAs }) => {
    await loginAs('teacher1')

    await page.goto('/certificates/create')
    await page.waitForLoadState('networkidle')

    // Should see certificate creation form or page
    await expect(page.locator('main').first()).toBeVisible()
  })
})

// ============================================================================
// MESSAGING PATH (All Roles)
// ============================================================================

test.describe('Messaging Access', () => {
  test('Student can access messages page', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    // Should see messages page
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Teacher can access messages page', async ({ page, loginAs }) => {
    await loginAs('teacher1')

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')

    // Should see messages page
    await expect(page.locator('main').first()).toBeVisible()
  })
})

// ============================================================================
// MY RESULTS PATH
// ============================================================================

test.describe('Results Access', () => {
  test('Student can view my-results page', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto('/my-results')
    await page.waitForLoadState('networkidle')

    // Should see results page
    await expect(page.locator('main').first()).toBeVisible()
  })
})

// ============================================================================
// ACHIEVEMENTS PATH
// ============================================================================

test.describe('Achievements Access', () => {
  test('Student can view achievements page', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto('/achievements')
    await page.waitForLoadState('networkidle')

    // Should see achievements page
    await expect(page.locator('main').first()).toBeVisible()
  })
})
