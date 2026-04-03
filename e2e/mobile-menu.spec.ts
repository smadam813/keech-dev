import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['Pixel 5'] })

test.describe('mobile menu', () => {
  test('toggles open and closed', async ({ page }) => {
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: /navigation menu/i })
    const menu = page.locator('#mobile-menu')

    // Menu starts closed
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).not.toBeVisible()

    // Open menu
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(menu).toBeVisible()

    // Close menu
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).not.toBeVisible()
  })

  test('closes on Escape key', async ({ page }) => {
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: /navigation menu/i })

    await menuButton.click()
    await expect(page.locator('#mobile-menu')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('#mobile-menu')).not.toBeVisible()
  })

  test('navigates to a page and auto-closes', async ({ page }) => {
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: /navigation menu/i })
    await menuButton.click()
    await expect(page.locator('#mobile-menu')).toBeVisible()

    // Click Blog link in mobile menu
    await page.locator('#mobile-menu').getByRole('link', { name: 'Blog' }).click()
    await page.waitForURL('/blog')

    // Menu should auto-close on route change
    await expect(page.locator('#mobile-menu')).not.toBeVisible()
  })
})
