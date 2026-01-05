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

    // Should show keyword pools
    await expect(page.locator('text=/keyword|pool|concept/i')).toBeVisible()

    // Should show question requirement
    await expect(
      page.locator(`text=${TEST_ACTIVITIES.inquiryScientific.questionsRequired}`)
    ).toBeVisible()
  })

  test('should start inquiry session', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    // Find and click start button
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Generate")'
    )
    await startButton.first().click()

    // Should redirect to take page
    await expect(page).toHaveURL(/.*inquiry\/take.*/, { timeout: 15000 })
  })

  test('should submit a question and receive AI evaluation', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Generate")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*inquiry\/take.*/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Enter a question
    const questionInput = page.locator(
      'textarea[name="question"], textarea[name="content"], input[name="question"], textarea'
    )
    await questionInput.first().fill(
      'How does the hypothesis about variable relationships influence the design of a controlled experiment?'
    )

    // Submit question
    const submitButton = page.locator(
      'button:has-text("Submit"), button:has-text("Generate"), button[type="submit"]'
    )
    await submitButton.first().click()

    // Wait for AI evaluation (could take time)
    await page.waitForTimeout(3000)

    // Should show feedback or score
    const feedback = page.locator(
      '[data-testid="feedback"], .feedback, text=/score|evaluation|bloom/i'
    )
    await expect(feedback).toBeVisible({ timeout: 30000 })
  })

  test('should show progress indicator', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.inquiryScientific.id}/inquiry`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Generate")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*inquiry\/take.*/, { timeout: 15000 })

    // Should show progress (e.g., "1/5 questions")
    await expect(page.locator('text=/\\d+.*\\/.*\\d+|progress/i')).toBeVisible({ timeout: 10000 })
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

    // Check for Pool 1 keywords (concepts)
    await expect(page.locator('text=/hypothesis|variable|control/i')).toBeVisible()

    // Check for Pool 2 keywords (actions)
    await expect(page.locator('text=/analyze|compare|predict/i')).toBeVisible()
  })
})
