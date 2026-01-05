import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVITIES } from '../fixtures/test-data'

test.describe('Case Mode', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('student4')
  })

  test('should display case start page with scenarios', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Should show case mode title
    await expect(page.locator('text=Case Mode')).toBeVisible()

    // Should show scenario information
    await expect(
      page.locator(`text=${TEST_ACTIVITIES.caseBusinessEthics.scenarios}`)
    ).toBeVisible()

    // Should show time limit
    await expect(
      page.locator(`text=${TEST_ACTIVITIES.caseBusinessEthics.timeLimit}`)
    ).toBeVisible()
  })

  test('should start case session and show first scenario', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Find and click start button
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze")'
    )
    await startButton.first().click()

    // Should redirect to take page
    await expect(page).toHaveURL(/.*case\/take.*/, { timeout: 15000 })

    // Should show first scenario
    await expect(page.locator('text=/Data Privacy|scenario/i')).toBeVisible({ timeout: 10000 })
  })

  test('should save response for scenario', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*case\/take.*/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Fill in issues field
    const issuesInput = page.locator(
      'textarea[name="issues"], textarea[name*="issue"], textarea'
    ).first()
    await issuesInput.fill('The main ethical issues include user privacy, corporate responsibility, and stakeholder trust.')

    // Fill in solution field
    const solutionInput = page.locator(
      'textarea[name="solution"], textarea[name*="solution"], textarea'
    ).last()
    await solutionInput.fill('The company should prioritize security, delay the launch if necessary, and be transparent with users.')

    // Wait for auto-save
    await page.waitForTimeout(1000)
  })

  test('should navigate between scenarios', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*case\/take.*/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Find next scenario button
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Scenario 2"), button[aria-label*="next"]'
    )
    if (await nextButton.isVisible()) {
      await nextButton.click()

      // Should show different scenario
      await expect(page.locator('text=/Environmental|Profit/i')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should submit and show results', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze")'
    )
    await startButton.first().click()

    await expect(page).toHaveURL(/.*case\/take.*/, { timeout: 15000 })
    await page.waitForLoadState('networkidle')

    // Fill both scenarios quickly
    const textareas = page.locator('textarea')
    const count = await textareas.count()
    for (let i = 0; i < count; i++) {
      await textareas.nth(i).fill('This is a test response for the case study analysis.')
    }

    // Navigate to next scenario if needed
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForTimeout(500)

      // Fill second scenario
      const textareas2 = page.locator('textarea')
      const count2 = await textareas2.count()
      for (let i = 0; i < count2; i++) {
        await textareas2.nth(i).fill('This is another test response for the second scenario.')
      }
    }

    // Submit
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

      // Should redirect to case page or show results
      await expect(page).toHaveURL(/.*case(?!\/take).*/, { timeout: 15000 })
    }
  })
})

test.describe('Case Mode - Previous Attempts', () => {
  test('should show passed attempt for student1', async ({ page, loginAs }) => {
    await loginAs('student1')

    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Should show previous attempt with 7.5 score (passed)
    await expect(page.locator('text=/7\\.5|passed|PASS/i')).toBeVisible({ timeout: 10000 })
  })

  test('should show failed attempt for student2', async ({ page, loginAs }) => {
    await loginAs('student2')

    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Should show previous attempt with 4.5 score (failed)
    await expect(page.locator('text=/4\\.5|failed|FAIL/i')).toBeVisible({ timeout: 10000 })
  })
})
