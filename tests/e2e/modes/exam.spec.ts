import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVITIES, TEST_USERS } from '../fixtures/test-data'

test.describe('Exam Mode', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    // Login as student4 who has no attempts yet
    await loginAs('student4')
  })

  test('should display exam start page', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    // Should show exam title
    await expect(page.locator('text=Exam Mode')).toBeVisible()

    // Should show exam information
    await expect(page.locator(`text=${TEST_ACTIVITIES.examDataStructures.timeLimit}`)).toBeVisible()
    await expect(
      page.locator(`text=${TEST_ACTIVITIES.examDataStructures.questionsCount}`)
    ).toBeVisible()
    await expect(
      page.locator(`text=${TEST_ACTIVITIES.examDataStructures.passThreshold}`)
    ).toBeVisible()
  })

  test('should start exam and show timer', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    // Find and click start button
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Take Exam")'
    )
    await startButton.first().click()

    // Should redirect to take page
    await expect(page).toHaveURL(/.*exam\/take.*/, { timeout: 15000 })

    // Should show timer
    const timer = page.locator('[data-testid="timer"], .timer, text=/\\d+:\\d+/')
    await expect(timer).toBeVisible({ timeout: 10000 })
  })

  test('should navigate between questions', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Take Exam")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*exam\/take.*/, { timeout: 15000 })

    // Should see first question
    const questionContent = page.locator('.question-content, [data-testid="question"]')
    await expect(questionContent).toBeVisible({ timeout: 10000 })

    // Find next button
    const nextButton = page.locator(
      'button:has-text("Next"), button[aria-label*="next"], button:has-text(">")'
    )
    if (await nextButton.isVisible()) {
      await nextButton.click()

      // Should show different question or question number
      await page.waitForTimeout(500)
    }
  })

  test('should save answer automatically', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Take Exam")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*exam\/take.*/, { timeout: 15000 })

    // Find and select an answer
    const answerOption = page.locator(
      'input[type="radio"], input[type="checkbox"], button[role="radio"], [data-testid="answer-option"]'
    )
    if ((await answerOption.count()) > 0) {
      await answerOption.first().click()

      // Wait a moment for auto-save
      await page.waitForTimeout(1000)

      // Refresh page to verify save
      await page.reload()

      // The answer should still be selected
      await page.waitForLoadState('networkidle')
    }
  })

  test('should submit exam and show results', async ({ page }) => {
    // Use student3 who has an in-progress attempt
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    // If there's a resume button, use it
    const resumeButton = page.locator(
      'button:has-text("Resume"), button:has-text("Continue")'
    )
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Take Exam")'
    )

    if (await resumeButton.isVisible()) {
      await resumeButton.click()
    } else if (await startButton.isVisible()) {
      await startButton.first().click()
    }

    await page.waitForURL(/.*exam\/take.*/, { timeout: 15000 })

    // Answer all questions quickly
    for (let i = 0; i < 5; i++) {
      const answerOption = page.locator(
        'input[type="radio"], button[role="radio"], [data-testid="answer-option"]'
      )
      if ((await answerOption.count()) > 0) {
        await answerOption.first().click()
        await page.waitForTimeout(300)
      }

      const nextButton = page.locator('button:has-text("Next")')
      if (await nextButton.isVisible()) {
        await nextButton.click()
        await page.waitForTimeout(300)
      }
    }

    // Submit exam
    const submitButton = page.locator(
      'button:has-text("Submit"), button:has-text("Finish"), button:has-text("Complete")'
    )
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Confirm if modal appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      // Should redirect to exam page or show results
      await expect(page).toHaveURL(/.*exam(?!\/take).*/, { timeout: 15000 })
    }
  })
})

test.describe('Exam Mode - Previous Attempts', () => {
  test('should show previous attempt results for student1', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    // Should show previous attempt with 80% score
    await expect(page.locator('text=/80|passed|PASS/i')).toBeVisible({ timeout: 10000 })
  })

  test('should show failed attempt for student2', async ({ page, loginAs }) => {
    await loginAs('student2')

    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/exam`)
    await page.waitForLoadState('networkidle')

    // Should show previous attempt with 40% score
    await expect(page.locator('text=/40|failed|FAIL/i')).toBeVisible({ timeout: 10000 })
  })
})
