import { test, expect } from '@playwright/test'

test.describe('view count', () => {
  test('displays view count on blog post', async ({ page }) => {
    // Intercept the view count API to ensure consistent test behavior
    // This makes the test work regardless of Redis availability
    await page.route('**/api/views/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ views: 42 }),
      })
    })

    // Navigate to blog listing
    await page.goto('/blog')

    // Click the first blog post
    const firstPost = page.locator('a[href^="/blog/"]').first()
    await firstPost.click()
    await page.waitForURL(/\/blog\/.+/)

    // View count should appear in the metadata area
    // The formatViewCount(42) returns "42 views"
    await expect(page.getByText('42 views')).toBeVisible({ timeout: 5000 })
  })
})
