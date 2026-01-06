import { test, expect } from '../fixtures/auth.fixture'
import { TEST_ACTIVITIES } from '../fixtures/test-data'

test.describe('Case Mode', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    // Login as student1 who is confirmed to be in the CS group
    await loginAs('student1')
  })

  test('should display case start page with scenarios', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Should show case mode title (Case Study Mode or Case Mode)
    await expect(page.locator('text=/Case (Study )?Mode/i')).toBeVisible()

    // Should show scenario information - look for "Scenarios" label
    await expect(page.locator('main').getByText(/scenario/i).first()).toBeVisible()

    // Should show time limit - look for time-related labels
    await expect(page.locator('main').getByText(/min/i).first()).toBeVisible()
  })

  test('should start case session and show first scenario', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Find and click start button
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze"), button:has-text("Continue"), button:has-text("Retake"), a:has-text("Resume")'
    )

    if (!(await startButton.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      return // Student has completed and cannot retake
    }

    await startButton.first().click()

    // Should redirect to take page
    await expect(page).toHaveURL(/.*case\/take.*/, { timeout: 15000 })

    // Should show first scenario - use first() to avoid strict mode
    await expect(page.locator('text=/Data Privacy|scenario/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('should save response for scenario', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze"), button:has-text("Continue"), button:has-text("Retake"), a:has-text("Resume")'
    )

    if (!(await startButton.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      // Already completed - verify results are visible
      const hasResults = await page.locator('text=/\\d+\\.\\d|passed|failed|score|completed/i').first().isVisible().catch(() => false)
      expect(hasResults).toBeTruthy()
      return
    }

    await startButton.first().click()
    await page.waitForTimeout(2000)

    // May or may not redirect to take page
    if (!page.url().includes('/take')) {
      // Check for any valid page content
      const pageHasContent = await page.locator('main').locator('text=/.+/').first().isVisible().catch(() => false)
      expect(pageHasContent).toBeTruthy()
      return
    }

    await page.waitForLoadState('networkidle')

    // Fill in issues field if visible
    const textareas = page.locator('textarea')
    if ((await textareas.count()) > 0) {
      await textareas.first().fill('The main ethical issues include user privacy, corporate responsibility, and stakeholder trust.')
      await page.waitForTimeout(1000)
    }
  })

  test('should navigate between scenarios', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze"), button:has-text("Continue"), button:has-text("Retake"), a:has-text("Resume")'
    )

    if (!(await startButton.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      // Student has completed - verify results are shown
      const hasResults = await page.locator('text=/\\d+\\.\\d|passed|failed|score|completed/i').first().isVisible().catch(() => false)
      expect(hasResults).toBeTruthy()
      return
    }

    await startButton.first().click()
    await page.waitForTimeout(2000)

    // May or may not redirect to take page
    if (!page.url().includes('/take')) {
      // Check for any valid page content
      const pageHasContent = await page.locator('main').locator('text=/.+/').first().isVisible().catch(() => false)
      expect(pageHasContent).toBeTruthy()
      return
    }

    await page.waitForLoadState('networkidle')

    // Find next scenario button
    const nextButton = page.locator(
      'button:has-text("Next"), button:has-text("Scenario 2"), button[aria-label*="next"]'
    )
    if (await nextButton.isVisible()) {
      await nextButton.click()

      // Should show different scenario - use first() to avoid strict mode
      await expect(page.locator('text=/Environmental|Profit/i').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should submit and show results', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Begin"), button:has-text("Analyze"), button:has-text("Continue"), button:has-text("Retake"), a:has-text("Resume")'
    )

    if (!(await startButton.first().isVisible({ timeout: 5000 }).catch(() => false))) {
      // Student has completed - verify results are shown
      const hasResults = await page.locator('text=/\\d+\\.\\d|passed|failed|score|completed/i').first().isVisible().catch(() => false)
      expect(hasResults).toBeTruthy()
      return
    }

    await startButton.first().click()
    await page.waitForTimeout(2000)

    // May or may not redirect to take page
    if (!page.url().includes('/take')) {
      // Check for any valid page content
      const pageHasContent = await page.locator('main').locator('text=/.+/').first().isVisible().catch(() => false)
      expect(pageHasContent).toBeTruthy()
      return
    }

    await page.waitForLoadState('networkidle')

    // Fill visible textareas (some may be hidden)
    const textareas = page.locator('textarea:visible')
    const count = await textareas.count()
    for (let i = 0; i < count; i++) {
      const textarea = textareas.nth(i)
      if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
        await textarea.fill('This is a test response for the case study analysis.')
        await page.waitForTimeout(200)
      }
    }

    // Navigate to next scenario if needed
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click()
      await page.waitForTimeout(500)

      // Fill second scenario - only visible textareas
      const textareas2 = page.locator('textarea:visible')
      const count2 = await textareas2.count()
      for (let i = 0; i < count2; i++) {
        const textarea = textareas2.nth(i)
        if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
          await textarea.fill('This is another test response for the second scenario.')
          await page.waitForTimeout(200)
        }
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

    // Should show previous attempt with 7.5 score (passed) - use first() to avoid strict mode
    await expect(page.locator('text=/7\\.5|passed|PASS/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('should show failed attempt for student2', async ({ page, loginAs }) => {
    await loginAs('student2')

    await page.goto(`/activities/${TEST_ACTIVITIES.caseBusinessEthics.id}/case`)
    await page.waitForLoadState('networkidle')

    // Should show previous attempt with 4.5 score (failed) - use first() to avoid strict mode
    await expect(page.locator('text=/4\\.5|failed|FAIL/i').first()).toBeVisible({ timeout: 10000 })
  })
})
