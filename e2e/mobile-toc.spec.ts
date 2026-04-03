import { test, expect, devices } from '@playwright/test'

test.use({ ...devices['Pixel 5'] })

test.describe('mobile table of contents', () => {
  test('expands and collapses on tap', async ({ page }) => {
    // Navigate to a blog post that has headings
    await page.goto('/blog')

    const firstPost = page.locator('a[href^="/blog/"]').first()
    await firstPost.click()
    await page.waitForURL(/\/blog\/.+/)

    const tocToggle = page.getByRole('button', { name: /contents/i })

    // Skip if no TOC on this post (no headings)
    if (await tocToggle.count() === 0) {
      test.skip(true, 'No TOC on this blog post')
      return
    }

    const tocContent = page.locator('#mobile-toc-content')

    // TOC starts collapsed
    await expect(tocToggle).toHaveAttribute('aria-expanded', 'false')

    // Expand TOC
    await tocToggle.click()
    await expect(tocToggle).toHaveAttribute('aria-expanded', 'true')

    // Content should contain heading links
    const links = tocContent.locator('a')
    await expect(links.first()).toBeVisible()

    // Collapse TOC
    await tocToggle.click()
    await expect(tocToggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('heading link navigates to section', async ({ page }) => {
    await page.goto('/blog')

    const firstPost = page.locator('a[href^="/blog/"]').first()
    await firstPost.click()
    await page.waitForURL(/\/blog\/.+/)

    const tocToggle = page.getByRole('button', { name: /contents/i })

    if (await tocToggle.count() === 0) {
      test.skip(true, 'No TOC on this blog post')
      return
    }

    // Expand TOC
    await tocToggle.click()

    // Click the first heading link
    const firstLink = page.locator('#mobile-toc-content a').first()
    const href = await firstLink.getAttribute('href')
    await firstLink.click()

    // URL should contain the anchor
    if (href) {
      await expect(page).toHaveURL(new RegExp(href.replace('#', '#')))
    }
  })

  test('TOC toggle remains visible after scrolling down', async ({ page }) => {
    await page.goto('/blog')
    const firstPost = page.locator('a[href^="/blog/"]').first()
    await firstPost.click()
    await page.waitForURL(/\/blog\/.+/)

    const tocToggle = page.getByRole('button', { name: /contents/i })

    if (await tocToggle.count() === 0) {
      test.skip(true, 'No TOC on this blog post')
      return
    }

    // Scroll down significantly (past the TOC's natural position)
    await page.evaluate(() => window.scrollTo(0, 1000))
    await page.waitForTimeout(300) // allow scroll + sticky to settle

    // The TOC toggle button should still be visible (sticky)
    await expect(tocToggle).toBeVisible()
    await expect(tocToggle).toBeInViewport()
  })

  test('auto-collapses after heading link click', async ({ page }) => {
    await page.goto('/blog')
    const firstPost = page.locator('a[href^="/blog/"]').first()
    await firstPost.click()
    await page.waitForURL(/\/blog\/.+/)

    const tocToggle = page.getByRole('button', { name: /contents/i })

    if (await tocToggle.count() === 0) {
      test.skip(true, 'No TOC on this blog post')
      return
    }

    // Expand TOC
    await tocToggle.click()
    await expect(tocToggle).toHaveAttribute('aria-expanded', 'true')

    // Click a heading link
    const firstLink = page.locator('#mobile-toc-content a').first()
    await firstLink.click()

    // TOC should auto-collapse
    await expect(tocToggle).toHaveAttribute('aria-expanded', 'false')
  })
})
