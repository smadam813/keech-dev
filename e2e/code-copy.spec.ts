import { test, expect } from '@playwright/test'

test.describe('code block copy button', () => {
  test('copies code and shows copied state', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Navigate to blog listing and find a post with code blocks
    await page.goto('/blog')

    // Click the first blog post
    const firstPost = page.locator('a[href^="/blog/"]').first()
    await firstPost.click()
    await page.waitForURL(/\/blog\/.+/)

    // Find a code block (rehype-pretty-code wraps in figure)
    const codeBlock = page.locator('figure[data-rehype-pretty-code-figure]').first()

    // If no code block found on this post, skip gracefully
    if (await codeBlock.count() === 0) {
      test.skip(true, 'No code blocks found on this blog post')
      return
    }

    // Hover to reveal the copy button (it has opacity-0 by default)
    await codeBlock.hover()

    const copyButton = codeBlock.getByRole('button', { name: 'Copy code' })
    await expect(copyButton).toBeVisible()

    // Click copy
    await copyButton.click()

    // Button should change to "Copied!" state
    await expect(codeBlock.getByRole('button', { name: 'Copied!' })).toBeVisible()

    // After 2 seconds it reverts — wait and verify
    await expect(codeBlock.getByRole('button', { name: 'Copy code' })).toBeVisible({ timeout: 3000 })
  })
})
