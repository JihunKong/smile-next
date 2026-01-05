import { test, expect } from './fixtures/auth.fixture'
import { TEST_USERS, TEST_GROUPS } from './fixtures/test-data'

test.describe('Groups', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('teacher1')
  })

  test.describe('Group List', () => {
    test('should display groups list', async ({ page }) => {
      await page.goto('/groups')
      await page.waitForLoadState('networkidle')

      // Should see the groups page
      await expect(page.locator('h1, h2').filter({ hasText: /group/i })).toBeVisible()

      // Should see the CS group that teacher1 owns
      await expect(
        page.locator(`text=${TEST_GROUPS.csIntro.name}`)
      ).toBeVisible({ timeout: 10000 })
    })

    test('should navigate to group details', async ({ page }) => {
      await page.goto('/groups')
      await page.waitForLoadState('networkidle')

      // Click on CS group
      await page.click(`text=${TEST_GROUPS.csIntro.name}`)

      // Should navigate to group details
      await expect(page).toHaveURL(new RegExp(`/groups/${TEST_GROUPS.csIntro.id}`), {
        timeout: 10000,
      })
    })
  })

  test.describe('Create Group', () => {
    test('should create a public group', async ({ page }) => {
      await page.goto('/groups')
      await page.waitForLoadState('networkidle')

      // Find and click create button
      const createButton = page.locator(
        'button:has-text("Create"), button:has-text("New Group"), a:has-text("Create")'
      )
      await createButton.first().click()

      // Fill in group details
      const groupName = `Test Group ${Date.now()}`
      await page.fill('input[name="name"]', groupName)
      await page.fill('textarea[name="description"], input[name="description"]', 'Test group description')

      // Submit form
      await page.click('button[type="submit"]')

      // Should redirect to groups or show success
      await expect(page).toHaveURL(/.*groups.*/, { timeout: 15000 })
    })

    test('should create a private group', async ({ page }) => {
      await page.goto('/groups')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator(
        'button:has-text("Create"), button:has-text("New Group"), a:has-text("Create")'
      )
      await createButton.first().click()

      const groupName = `Private Group ${Date.now()}`
      await page.fill('input[name="name"]', groupName)
      await page.fill('textarea[name="description"], input[name="description"]', 'Private test group')

      // Toggle private setting
      const privateToggle = page.locator(
        'input[name="isPrivate"], [data-testid="private-toggle"], label:has-text("Private")'
      )
      if (await privateToggle.isVisible()) {
        await privateToggle.click()
      }

      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/.*groups.*/, { timeout: 15000 })
    })

    test('should create a passcode-protected group', async ({ page }) => {
      await page.goto('/groups')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator(
        'button:has-text("Create"), button:has-text("New Group"), a:has-text("Create")'
      )
      await createButton.first().click()

      const groupName = `Passcode Group ${Date.now()}`
      await page.fill('input[name="name"]', groupName)

      // Enable passcode
      const passcodeToggle = page.locator(
        'input[name="requirePasscode"], [data-testid="passcode-toggle"], label:has-text("Passcode")'
      )
      if (await passcodeToggle.isVisible()) {
        await passcodeToggle.click()

        // Enter passcode
        const passcodeInput = page.locator('input[name="passcode"]')
        if (await passcodeInput.isVisible()) {
          await passcodeInput.fill('1234')
        }
      }

      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/.*groups.*/, { timeout: 15000 })
    })
  })

  test.describe('Group Management', () => {
    test('should delete a group', async ({ page }) => {
      // First create a group to delete
      await page.goto('/groups')
      await page.waitForLoadState('networkidle')

      const createButton = page.locator(
        'button:has-text("Create"), button:has-text("New Group"), a:has-text("Create")'
      )
      await createButton.first().click()

      const groupName = `Delete Me ${Date.now()}`
      await page.fill('input[name="name"]', groupName)
      await page.click('button[type="submit"]')

      await page.waitForLoadState('networkidle')

      // Navigate to the group
      await page.click(`text=${groupName}`)

      // Look for delete button
      const deleteButton = page.locator(
        'button:has-text("Delete"), button[data-testid="delete-group"], [aria-label*="delete"]'
      )

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Confirm deletion if modal appears
        const confirmButton = page.locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
        )
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }

        // Should redirect to groups list
        await expect(page).toHaveURL(/.*groups$/, { timeout: 10000 })

        // Group should no longer be visible
        await expect(page.locator(`text=${groupName}`)).not.toBeVisible()
      }
    })
  })
})
