/**
 * Student Journey Tests
 *
 * End-to-end critical flows for students.
 * Uses existing seeded data where possible to minimize data creation.
 *
 * Data Strategy:
 * - Uses seeded test groups and activities
 * - Questions created during tests are marked with unique IDs for identification
 * - No cleanup needed for questions (they don't accumulate significantly)
 */

import { test, expect } from '../fixtures/auth.fixture'
import { TEST_GROUPS, TEST_ACTIVITIES } from '../fixtures/test-data'

// Generate unique test run ID to identify test data
const TEST_RUN_ID = `e2e-${Date.now()}`

test.describe('Student Journey: Browse & Engage', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student1')
  })

  test('Complete flow: Dashboard → Groups → Group Detail → Activity', async ({ page }) => {
    // Step 1: Start at dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=/welcome/i').first()).toBeVisible()

    // Step 2: Navigate to groups via quick action or nav
    const groupsLink = page.locator('a[href="/groups"]').or(page.locator('text=/my groups/i'))
    await groupsLink.first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, h2').filter({ hasText: /group/i }).first()).toBeVisible()

    // Step 3: Click on CS Intro group
    await page.click(`text=${TEST_GROUPS.csIntro.name}`)
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(new RegExp(TEST_GROUPS.csIntro.id))

    // Step 4: Should see activities in the group
    await expect(page.locator('text=/activit/i').first()).toBeVisible()

    // Step 5: Click on Open Discussion activity
    const activityLink = page.locator(`a[href*="${TEST_ACTIVITIES.openDiscussion.id}"]`).first()
    if (await activityLink.isVisible()) {
      await activityLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(new RegExp(TEST_ACTIVITIES.openDiscussion.id))
    }
  })

  test('View activity details and see questions', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Should see the activity page with questions or ask button
    await expect(page.locator('main').first()).toBeVisible()

    // Should see existing questions from seed data OR the ask button
    const hasContent = await page
      .locator('text=/question|ask|compiled|recursion/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(hasContent).toBeTruthy()
  })
})

test.describe('Student Journey: Open Mode Question Submission', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student4') // Use student4 who may have fewer questions
  })

  test('Submit a question in Open Mode', async ({ page }) => {
    // Increase timeout for this test
    test.setTimeout(60000)

    // Navigate to activity
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Click ask question button
    const askButton = page.locator('[data-testid="ask-question"], a:has-text("Ask"), button:has-text("Ask")')
    await expect(askButton.first()).toBeVisible({ timeout: 10000 })
    await askButton.first().click()

    // Wait for create page
    await page.waitForLoadState('networkidle')

    // Fill in the question - use unique ID for identification
    const questionText = `[${TEST_RUN_ID}] What are the key differences between functional and object-oriented programming paradigms?`
    const questionInput = page.locator('textarea[name="content"], textarea[name="question"], textarea').first()
    await expect(questionInput).toBeVisible({ timeout: 10000 })
    await questionInput.fill(questionText)

    // Submit the question
    const submitButton = page.locator(
      'button:has-text("Submit"), button:has-text("Post"), button[type="submit"]'
    ).first()
    await submitButton.click()

    // Wait for submission
    await page.waitForTimeout(3000)
    await page.waitForLoadState('networkidle')

    // Verify: Either redirected away from create page, or success indicator
    const notOnCreatePage = !page.url().includes('/create')
    const successIndicator = await page
      .locator('text=/success|submitted|thank/i')
      .first()
      .isVisible()
      .catch(() => false)

    expect(notOnCreatePage || successIndicator).toBeTruthy()
  })
})

test.describe('Student Journey: Exam Mode Flow', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student1')
  })

  test('View exam info and previous attempt', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    // Should see exam mode page
    await expect(page.locator('text=/Exam Mode/i').first()).toBeVisible()

    // Should see exam settings (time, questions, threshold)
    await expect(page.locator('main').getByText(/minute|question|threshold|pass/i).first()).toBeVisible()

    // student1 has a previous attempt - should see score/result
    const hasResult = await page
      .locator('text=/80|passed|score|attempt/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(hasResult).toBeTruthy()
  })

  test('View exam leaderboard if available', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/leaderboard`)
    await page.waitForLoadState('networkidle')

    // Should load leaderboard or show empty state
    await expect(page.locator('main').first()).toBeVisible()
  })
})

test.describe('Student Journey: Inquiry Mode Flow', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student1')
  })

  test('View inquiry info with keywords', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    // Should see inquiry mode page
    await expect(page.locator('text=/Inquiry Mode/i').first()).toBeVisible()

    // Should see keywords
    await expect(page.locator('text=/keyword|hypothesis|variable/i').first()).toBeVisible()
  })
})

test.describe('Student Journey: Case Mode Flow', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student1')
  })

  test('View case study info', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Should see case mode page
    await expect(page.locator('text=/Case.*Mode/i').first()).toBeVisible()

    // Should see scenario info
    await expect(page.locator('text=/scenario|minute|time/i').first()).toBeVisible()
  })
})

test.describe('Student Journey: Profile & Gamification', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student1')
  })

  test('View profile with stats', async ({ page }) => {
    await page.goto('/profile')
    await page.waitForLoadState('networkidle')

    // Should see profile content
    await expect(page.locator('main').first()).toBeVisible()

    // Should see some profile sections (achievements, stats, etc.)
    await expect(page.locator('text=/achievement|question|score|profile/i').first()).toBeVisible()
  })

  test('View leaderboard', async ({ page }) => {
    await page.goto('/leaderboard')
    await page.waitForLoadState('networkidle')

    // Should see leaderboard
    await expect(page.locator('h1, h2').filter({ hasText: /leaderboard|ranking/i }).first()).toBeVisible()
  })

  test('View achievements page', async ({ page }) => {
    await page.goto('/achievements')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })
})
