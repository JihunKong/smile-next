/**
 * Student Happy Path Smoke Tests
 *
 * Validates core student features work: dashboard, groups, activities, modes.
 */

import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVITIES } from '../fixtures/test-data'

test.describe('Student Happy Path', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student1')
  })

  test('Dashboard loads with welcome message', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Should see welcome header
    await expect(page.locator('text=/welcome/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Groups page shows enrolled groups', async ({ page }) => {
    await page.goto('/groups')
    await page.waitForLoadState('networkidle')

    // Should see groups heading
    await expect(page.locator('h1, h2').filter({ hasText: /group/i }).first()).toBeVisible()

    // Should see at least one group (CS Intro from seed data)
    await expect(page.locator('text=/Introduction to Computer Science|group/i').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('Activities page loads', async ({ page }) => {
    await page.goto('/activities')
    await page.waitForLoadState('networkidle')

    // Should see activities page content
    await expect(page.locator('h1, h2').filter({ hasText: /activit/i }).first()).toBeVisible()
  })

  test('Open Mode activity page loads', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Should see activity name or content
    await expect(page.locator('main').first()).toBeVisible()

    // Should see ask/create button - use data-testid for specificity
    const askButton = page.locator('[data-testid="ask-question"]')
    const fallbackButton = page.locator('a:has-text("Ask"), button:has-text("Ask")').first()
    await expect(askButton.or(fallbackButton)).toBeVisible({ timeout: 10000 })
  })

  test('Exam Mode info page loads', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    // Should show exam mode title or info
    await expect(page.locator('text=/Exam Mode|exam/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Inquiry Mode info page loads', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    // Should show inquiry mode content
    await expect(page.locator('text=/Inquiry Mode|inquiry|keyword/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Case Mode info page loads', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Should show case mode content
    await expect(page.locator('text=/Case.*Mode|scenario/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Profile page loads', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Should see profile content or user info
    await expect(page.locator('main').first()).toBeVisible()
    // Look for profile-related content
    const profileContent = page.locator('text=/profile|achievements|score|questions/i')
    await expect(profileContent.first()).toBeVisible({ timeout: 10000 })
  })

  test('Leaderboard page loads', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.waitForLoadState('networkidle')

    // Should see leaderboard heading or content
    await expect(page.locator('h1, h2').filter({ hasText: /leaderboard|ranking/i }).first()).toBeVisible({
      timeout: 10000,
    })
  })

  test('Settings page loads', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Should see settings content
    await expect(page.locator('h1, h2').filter({ hasText: /settings|preferences/i }).first()).toBeVisible({
      timeout: 10000,
    })
  })
})
