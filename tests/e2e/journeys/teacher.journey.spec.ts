/**
 * Teacher Journey Tests
 *
 * End-to-end critical flows for teachers.
 *
 * Data Strategy:
 * - Creates groups/activities with unique identifiable names
 * - Cleans up created resources in afterAll hooks
 * - Uses TEST_RUN_ID prefix for easy identification
 */

import { test, expect, type Page } from '../fixtures/auth.fixture'
import { TEST_GROUPS, TEST_ACTIVITIES } from '../fixtures/test-data'

// Generate unique test run ID to identify test data
const TEST_RUN_ID = `e2e-${Date.now()}`

// Track created resources for cleanup
const createdGroups: string[] = []
const createdActivities: string[] = []

/**
 * Cleanup helper - deletes a group via UI
 */
async function deleteGroupViaUI(page: Page, groupId: string, groupName: string) {
  try {
    await page.goto(`/groups/${groupId}`)
    await page.waitForLoadState('networkidle')

    // Look for delete button
    const deleteButton = page.locator('button:has-text("Delete"), [data-testid="delete-group"]')
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteButton.click()

      // Wait for confirmation modal
      await page.waitForTimeout(500)

      // Type group name to confirm
      const confirmInput = page.locator('input[placeholder*="name"], input[data-testid="confirm-group-name"]')
      if (await confirmInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmInput.fill(groupName)
      }

      // Click confirm delete
      const confirmButton = page.locator('button:has-text("Delete Group"), button[data-testid="confirm-delete"]')
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click()
        await page.waitForLoadState('networkidle')
      }
    }
  } catch (error) {
    console.log(`Cleanup: Could not delete group ${groupId}:`, error)
  }
}

test.describe('Teacher Journey: Group Management', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher1')
  })

  // Cleanup after all tests in this describe block
  test.afterAll(async ({ browser }) => {
    if (createdGroups.length === 0) return

    const context = await browser.newContext()
    const page = await context.newPage()

    // Login as teacher
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'teacher1@smile.test')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard.*|.*groups.*/, { timeout: 15000 })

    // Delete each created group
    for (const groupId of createdGroups) {
      await deleteGroupViaUI(page, groupId, `[${TEST_RUN_ID}]`)
    }

    await context.close()
  })

  test('Create a new public group', async ({ page }) => {
    await page.goto('/groups/create')
    await page.waitForLoadState('networkidle')

    // Fill group details
    const groupName = `[${TEST_RUN_ID}] Test Public Group`
    await page.fill('input[name="name"]', groupName)

    const descInput = page.locator('textarea[name="description"], input[name="description"]')
    if (await descInput.isVisible()) {
      await descInput.fill('Automated test group - will be cleaned up')
    }

    // Submit
    await page.click('button[type="submit"]')

    // Wait for redirect
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/.*groups.*/, { timeout: 15000 })

    // Extract group ID from URL if redirected to group page
    const url = page.url()
    const groupIdMatch = url.match(/groups\/([^/]+)/)
    if (groupIdMatch) {
      createdGroups.push(groupIdMatch[1])
    }

    // Verify group was created
    await expect(page.locator(`text=${groupName}`).first()).toBeVisible({ timeout: 10000 })
  })

  test('View and manage existing group', async ({ page }) => {
    // Use seeded CS Intro group
    await page.goto(`/groups/${TEST_GROUPS.csIntro.id}`)
    await page.waitForLoadState('networkidle')

    // Should see group heading
    await expect(page.locator('h1').filter({ hasText: TEST_GROUPS.csIntro.name })).toBeVisible()

    // Should see management options (Edit, Members, Analytics)
    const hasManageOptions = await page
      .locator('text=/edit|member|analytic|settings/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(hasManageOptions).toBeTruthy()
  })

  test('Access group members page', async ({ page }) => {
    await page.goto(`/groups/${TEST_GROUPS.csIntro.id}/members`)
    await page.waitForLoadState('networkidle')

    // Should see members list or management UI
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.locator('text=/member|student|role/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('Access group analytics', async ({ page }) => {
    await page.goto(`/groups/${TEST_GROUPS.csIntro.id}/analytics`)
    await page.waitForLoadState('networkidle')

    // Should load analytics page
    await expect(page.locator('main').first()).toBeVisible()
  })
})

test.describe('Teacher Journey: Activity Management', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher1')
  })

  test('View activities list', async ({ page }) => {
    await page.goto('/activities')
    await page.waitForLoadState('networkidle')

    // Should see activities page
    await expect(page.locator('h1, h2').filter({ hasText: /activit/i }).first()).toBeVisible()

    // Should see some activities (from seed data)
    const hasActivities = await page
      .locator('text=/Open Discussion|Exam|Inquiry|Case/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)
    expect(hasActivities).toBeTruthy()
  })

  test('Access activity create page within group', async ({ page }) => {
    await page.goto(`/groups/${TEST_GROUPS.csIntro.id}`)
    await page.waitForLoadState('networkidle')

    // Find create activity button
    const createButton = page.locator(
      'a:has-text("Create Activity"), button:has-text("Create Activity"), a:has-text("New Activity")'
    )

    if (await createButton.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.first().click()
      await page.waitForLoadState('networkidle')

      // Should see activity creation form
      await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 10000 })
    } else {
      // Alternative: go directly to create page
      await page.goto('/activities/create')
      await page.waitForLoadState('networkidle')
      await expect(page.locator('main').first()).toBeVisible()
    }
  })

  test('View activity details and analytics', async ({ page }) => {
    // View the Open Discussion activity
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}`)
    await page.waitForLoadState('networkidle')

    // Should see activity content
    await expect(page.locator('main').first()).toBeVisible()

    // Navigate to analytics
    await page.goto(`/activities/${TEST_ACTIVITIES.openDiscussion.id}/analytics`)
    await page.waitForLoadState('networkidle')

    // Should load analytics
    await expect(page.locator('main').first()).toBeVisible()
  })

  test('View exam activity settings', async ({ page }) => {
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}`)
    await page.waitForLoadState('networkidle')

    // Should see exam activity
    await expect(page.locator('main').first()).toBeVisible()

    // Try to access edit page
    await page.goto(`/activities/${TEST_ACTIVITIES.examDataStructures.id}/edit`)
    await page.waitForLoadState('networkidle')

    // Should see edit form or activity settings
    await expect(page.locator('main').first()).toBeVisible()
  })
})

test.describe('Teacher Journey: Tools Access', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher1')
  })

  test('Access all teacher tools', async ({ page }) => {
    await page.goto('/tools')
    await page.waitForLoadState('networkidle')

    // Should see tools page
    await expect(page.locator('h1, h2').filter({ hasText: /tool/i }).first()).toBeVisible()

    // Should see key tools
    const tools = ['Activity Maker', 'QR Code', 'Export', 'Duplicator']
    for (const tool of tools) {
      await expect(page.locator(`text=/${tool}/i`).first()).toBeVisible()
    }
  })

  test('Access QR code generator', async ({ page }) => {
    await page.goto('/tools/qr-generator')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Access export tools', async ({ page }) => {
    await page.goto('/tools/export')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Access activity duplicator', async ({ page }) => {
    await page.goto('/tools/activity-duplicator')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })
})

test.describe('Teacher Journey: Certificates', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher1')
  })

  test('View certificates page', async ({ page }) => {
    await page.goto('/certificates')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Access certificate designer', async ({ page }) => {
    await page.goto('/certificates/create')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })

  test('Browse certificate templates', async ({ page }) => {
    await page.goto('/certificates/browse')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('main').first()).toBeVisible()
  })
})
