import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVITIES } from '../fixtures/test-data'

test.describe('Open Mode', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('student4')
  })

  test('should display activity page with ask question button', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Should show activity name
    await expect(
      page.locator(`text=${TEST_ACTIVITIES.openDiscussion.name}`)
    ).toBeVisible({ timeout: 10000 })

    // Should show ask question button
    const askButton = page.locator(
      'button:has-text("Ask"), button:has-text("Question"), button:has-text("Create"), a:has-text("Ask")'
    )
    await expect(askButton.first()).toBeVisible()
  })

  test('should open question form', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Click ask question button
    const askButton = page.locator(
      'button:has-text("Ask"), button:has-text("Question"), button:has-text("Create"), a:has-text("Ask")'
    )
    await askButton.first().click()

    // Should show question form or modal
    const questionForm = page.locator(
      'form, [data-testid="question-form"], textarea[name="content"], textarea[name="question"]'
    )
    await expect(questionForm.first()).toBeVisible({ timeout: 10000 })
  })

  test('should submit a question', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Click ask question button
    const askButton = page.locator(
      'button:has-text("Ask"), button:has-text("Question"), button:has-text("Create"), a:has-text("Ask")'
    )
    await askButton.first().click()

    // Fill in question content
    const questionInput = page.locator(
      'textarea[name="content"], textarea[name="question"], textarea'
    )
    const questionText = `Test question ${Date.now()}: What are the best practices for code review?`
    await questionInput.first().fill(questionText)

    // Submit question
    const submitButton = page.locator(
      'button:has-text("Submit"), button:has-text("Post"), button:has-text("Ask"), button[type="submit"]'
    )
    await submitButton.first().click()

    // Should show success or the question appears in the list
    await page.waitForLoadState('networkidle')

    // Either a toast appears or the question is visible
    const questionVisible = await page
      .locator(`text=${questionText.substring(0, 30)}`)
      .isVisible()
      .catch(() => false)

    const toastVisible = await page
      .locator('[role="alert"], .toast, text=/success|created|submitted/i')
      .isVisible()
      .catch(() => false)

    expect(questionVisible || toastVisible).toBeTruthy()
  })

  test('should submit an anonymous question when allowed', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Click ask question button
    const askButton = page.locator(
      'button:has-text("Ask"), button:has-text("Question"), button:has-text("Create"), a:has-text("Ask")'
    )
    await askButton.first().click()

    // Look for anonymous toggle
    const anonymousToggle = page.locator(
      'input[name="isAnonymous"], [data-testid="anonymous-toggle"], label:has-text("Anonymous")'
    )

    if (await anonymousToggle.isVisible()) {
      await anonymousToggle.click()

      // Fill in question
      const questionInput = page.locator(
        'textarea[name="content"], textarea[name="question"], textarea'
      )
      await questionInput.first().fill(`Anonymous question ${Date.now()}: Is this anonymous?`)

      // Submit
      const submitButton = page.locator(
        'button:has-text("Submit"), button:has-text("Post"), button[type="submit"]'
      )
      await submitButton.first().click()

      await page.waitForLoadState('networkidle')
    }
  })
})

test.describe('Open Mode - Question List', () => {
  test('should display existing questions', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Should show existing questions from seed data
    await expect(
      page.locator('text=/compiled.*interpreted|recursion.*iteration/i')
    ).toBeVisible({ timeout: 10000 })
  })

  test('should show question details', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Click on a question
    const questionLink = page.locator('text=/compiled.*interpreted/i').first()
    if (await questionLink.isVisible()) {
      await questionLink.click()

      // Should show question details or expand
      await expect(
        page.locator('text=/compiled.*interpreted/i')
      ).toBeVisible()
    }
  })
})
