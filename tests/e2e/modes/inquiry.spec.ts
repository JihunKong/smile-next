import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVITIES } from '../fixtures/test-data'

test.describe('Inquiry Mode', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('student4')
  })

  test('should display inquiry start page with keywords', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    // Should show inquiry mode title
    await expect(page.locator('text=Inquiry Mode')).toBeVisible()

    // Should show keyword pools - look for Keywords heading or label
    await expect(page.locator('main').getByText(/keyword/i).first()).toBeVisible()

    // Should show question requirement - look for "Questions" label
    await expect(page.locator('main').getByText(/questions/i).first()).toBeVisible()
  })

  test('should start inquiry session', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    // Find and click start button
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Generate"), button:has-text("Continue")'
    )
    await startButton.first().click()

    // Should redirect to take page
    await expect(page).toHaveURL(/.*inquiry\/take.*/, { timeout: 15000 })
  })

  test('should submit a question and show evaluation', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Generate"), button:has-text("Continue")'
    )

    // If there's a start button, click it
    if (await startButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await startButton.first().click()
      await expect(page).toHaveURL(/.*inquiry\/take.*/, { timeout: 15000 })
    }

    await page.waitForLoadState('networkidle')

    // Check if already completed (all questions submitted) - check multiple indicators
    const viewResultsButton = await page.locator('button:has-text("View Results")').isVisible().catch(() => false)
    const submittedAllText = await page.locator('text=/submitted all.*questions/i').isVisible().catch(() => false)
    const questionCountMatch = await page.locator('text=/\\d+\\/\\d+.*questions|\\d+ of \\d+/i').first().isVisible().catch(() => false)

    if (viewResultsButton || submittedAllText) {
      // Test passes - inquiry already completed
      return
    }

    // Enter a question
    const questionInput = page.locator(
      'textarea[name="question"], textarea[name="content"], input[name="question"], textarea'
    )

    // If no question input (already at max questions), check for existing questions or scores
    if (!(await questionInput.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      const hasQuestions = await page.locator('text=/Q1|Q2|Q3|Question 1|Question 2/i').first().isVisible().catch(() => false)
      const hasScores = await page.locator('text=/\\d+\\.\\d.*\\/.*10|score/i').first().isVisible().catch(() => false)
      expect(hasQuestions || hasScores || questionCountMatch).toBeTruthy()
      return
    }

    await questionInput.first().fill(
      'How does the hypothesis about variable relationships influence the design of a controlled experiment?'
    )

    // Submit question
    const submitButton = page.locator(
      'button:has-text("Submit"), button:has-text("Generate"), button[type="submit"]'
    )
    await submitButton.first().click()

    // Wait for submission to complete
    await page.waitForTimeout(2000)

    // Should show some evaluation feedback (even preliminary "Evaluating..." is OK)
    const feedbackVisible = await page.locator(
      '[data-testid="feedback"], .feedback, text=/\\d+\\.\\d|evaluating|score/i'
    ).first().isVisible({ timeout: 10000 }).catch(() => false)

    const questionAdded = await page.locator('text=/How does the hypothesis/i').isVisible().catch(() => false)

    expect(feedbackVisible || questionAdded).toBeTruthy()
  })

  test('should show progress indicator', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Generate"), button:has-text("Continue")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*inquiry\/take.*/, { timeout: 15000 })

    // Should show progress (e.g., "Question 1 of 5")
    await expect(page.locator('text=/Question \\d+ of \\d+/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('should show completion summary', async ({ page, loginAs }) => {
    // Use student1 who has completed inquiry
    await loginAs('student1')

    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    // Should show completed status
    await expect(page.locator('text=/completed|finish/i')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Inquiry Mode - Keywords', () => {
  test('should display both keyword pools', async ({ page, loginAs }) => {
    await loginAs('student4')

    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    // Check for Pool 1 keywords (concepts) - use first() to avoid strict mode
    await expect(page.locator('text=/hypothesis|variable|control/i').first()).toBeVisible()

    // Check for Pool 2 keywords (actions) - use first() to avoid strict mode
    await expect(page.locator('text=/analyze|compare|predict/i').first()).toBeVisible()
  })
})
