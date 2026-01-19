/**
 * Teacher Happy Path Smoke Tests
 *
 * Validates core teacher features: groups, activities, tools, analytics.
 */

import { test, expect } from '../fixtures/auth.fixture'
import { TEST_GROUPS, TEST_ACTIVITIES } from '../fixtures/test-data'

test.describe('Teacher Happy Path', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher1')
  })

  test('Dashboard loads', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=/welcome/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Groups page shows owned groups', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForLoadState('networkidle')

    // Should see the CS group that teacher1 owns
    await expect(page.locator(`text=${TEST_GROUPS.csIntro.name}`)).toBeVisible({ timeout: 10000 })
  })

  test('Group detail page loads', async ({ page }) => {
    await page.goto(`/groups/${TEST_GROUPS.csIntro.id}`)
    await page.waitForLoadState('networkidle')

    // Should see group name in heading specifically
    await expect(page.locator('h1').filter({ hasText: TEST_GROUPS.csIntro.name })).toBeVisible({ timeout: 10000 })
  })

  test('Activities page shows activities', async ({ page }) => {
    await page.goto('/activities')
    await page.waitForLoadState('networkidle')

    // Should see activities content
    await expect(page.locator('h1, h2').filter({ hasText: /activit/i }).first()).toBeVisible()
  })

  test('Tools page loads with tools visible', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Should see tools heading
    await expect(page.locator('h1, h2').filter({ hasText: /tool/i }).first()).toBeVisible()

    // Should see at least one tool card
    await expect(page.locator('text=/Activity Maker|QR Code|Export|Duplicator/i').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('Group analytics page accessible', async ({ page }) => {
    await page.goto(`/groups/${TEST_GROUPS.csIntro.id}/analytics`)
    await page.waitForLoadState('networkidle')

    // Should load analytics page (may show data or empty state)
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Activity analytics page accessible', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}/analytics`)
    await page.waitForLoadState('networkidle')

    // Should load analytics page
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Create group form accessible', async ({ page }) => {
    await page.goto('/groups/create')
    await page.waitForLoadState('networkidle')

    // Should see create group form
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 10000 })
  })
})
