import { expect, type Page } from '@playwright/test'
import { E2E } from './constants'

/** Log in (if needed), then land on `path`. */
export async function login(page: Page, path = '/') {
  await page.goto('/unlock')
  const field = page.getByLabel('Kode akses')
  // Either the unlock form shows, or an existing session redirects to the app.
  await expect(field.or(page.getByRole('banner'))).toBeVisible()
  if (await field.isVisible()) {
    await field.fill(E2E.passcode)
    await page.getByRole('button', { name: 'Masuk' }).click()
  }
  await expect(page.getByRole('banner').getByText('Bazar Saya')).toBeVisible()
  if (path !== '/') await page.goto(path)
  await expect(page.getByRole('banner').getByText('Bazar Saya')).toBeVisible()
}
