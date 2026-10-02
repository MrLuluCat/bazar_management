import { test, expect } from '@playwright/test'

test('home shows wordmark', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Bazar')).toBeVisible()
})
