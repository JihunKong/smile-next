import { test, expect } from './fixtures/auth.fixture'
import { TEST_GROUPS } from './fixtures/test-data'

test.describe('Activities', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('teacher1')
  })

  test.describe('Create Activities', () => {
    test('should create an Open Mode activity', async ({ page }) => {
      await page.goto(`/groups/${TEST_GROUPS.csIntro.id}`)
      await page.waitForLoadState('networkidle')

      // Find create activity button
      const createButton = page.locator(
        'button:has-text("Create Activity"), button:has-text("New Activity"), a:has-text("Create")'
      )
      await createButton.first().click()

      await page.waitForLoadState('networkidle')

      // Fill activity name
      const activityName = `Open Activity ${Date.now()}`
      await page.fill('input[name="name"]', activityName)

      // Select Open mode (usually the first or default option)
      const openModeOption = page.locator(
        '[data-mode="open"], button:has-text("Open"), label:has-text("Open Mode")'
      )
      if (await openModeOption.first().isVisible()) {
        await openModeOption.first().click()
      }

      // Submit
      await page.click('button[type="submit"]')

      // Should redirect to group or activity page
      await expect(page).toHaveURL(/.*groups.*|.*activities.*/, { timeout: 15000 })
    })

    test('should create an Exam Mode activity with settings', async ({ page }) => {
      await page.goto(`/groups/${TEST_GROUPS.csIntro.id}`)
      await page.waitForLoadState('networkidle')

      const createButton = page.locator(
        'button:has-text("Create Activity"), button:has-text("New Activity"), a:has-text("Create")'
      )
      await createButton.first().click()

      await page.waitForLoadState('networkidle')

      const activityName = `Exam Activity ${Date.now()}`
      await page.fill('input[name="name"]', activityName)

      // Select Exam mode
      const examModeOption = page.locator(
        '[data-mode="exam"], button:has-text("Exam"), label:has-text("Exam Mode")'
      )
      if (await examModeOption.first().isVisible()) {
        await examModeOption.first().click()
      }

      // Fill exam settings if visible
      const timeLimitInput = page.locator('input[name="timeLimit"], input[name="examSettings.timeLimit"]')
      if (await timeLimitInput.isVisible()) {
        await timeLimitInput.fill('30')
      }

      const passThresholdInput = page.locator(
        'input[name="passThreshold"], input[name="examSettings.passThreshold"]'
      )
      if (await passThresholdInput.isVisible()) {
        await passThresholdInput.fill('60')
      }

      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/.*groups.*|.*activities.*/, { timeout: 15000 })
    })

    test('should create an Inquiry Mode activity with keywords', async ({ page }) => {
      await page.goto(`/groups/${TEST_GROUPS.csIntro.id}`)
      await page.waitForLoadState('networkidle')

      const createButton = page.locator(
        'button:has-text("Create Activity"), button:has-text("New Activity"), a:has-text("Create")'
      )
      await createButton.first().click()

      await page.waitForLoadState('networkidle')

      const activityName = `Inquiry Activity ${Date.now()}`
      await page.fill('input[name="name"]', activityName)

      // Select Inquiry mode
      const inquiryModeOption = page.locator(
        '[data-mode="inquiry"], button:has-text("Inquiry"), label:has-text("Inquiry Mode")'
      )
      if (await inquiryModeOption.first().isVisible()) {
        await inquiryModeOption.first().click()
      }

      // Fill keywords if visible
      const keywordsInput = page.locator(
        'input[name="keywords"], textarea[name="keywordPool1"], input[name="inquirySettings.keywordPool1"]'
      )
      if (await keywordsInput.isVisible()) {
        await keywordsInput.fill('hypothesis, experiment, observation')
      }

      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/.*groups.*|.*activities.*/, { timeout: 15000 })
    })

    test('should create a Case Mode activity with scenarios', async ({ page }) => {
      await page.goto(`/groups/${TEST_GROUPS.csIntro.id}`)
      await page.waitForLoadState('networkidle')

      const createButton = page.locator(
        'button:has-text("Create Activity"), button:has-text("New Activity"), a:has-text("Create")'
      )
      await createButton.first().click()

      await page.waitForLoadState('networkidle')

      const activityName = `Case Activity ${Date.now()}`
      await page.fill('input[name="name"]', activityName)

      // Select Case mode
      const caseModeOption = page.locator(
        '[data-mode="case"], button:has-text("Case"), label:has-text("Case Mode")'
      )
      if (await caseModeOption.first().isVisible()) {
        await caseModeOption.first().click()
      }

      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/.*groups.*|.*activities.*/, { timeout: 15000 })
    })
  })
})
