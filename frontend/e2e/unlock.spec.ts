import { test, expect } from '@playwright/test'
import { E2E } from './constants'

test('wrong then right passcode; session survives reload; lock returns to unlock', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/unlock/)
  await expect(page.getByRole('heading', { name: 'Buka link lapak' })).toBeVisible()

  await page.goto(`/l/${E2E.slug}`)
  await expect(page).toHaveURL(/\/unlock/)
  await expect(page.getByRole('heading', { name: 'Bazar Saya' })).toBeVisible()

  await page.getByLabel('Kode akses').fill('salah-banget')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByText('Kode salah')).toBeVisible()

  await page.getByLabel('Kode akses').fill(E2E.passcode)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('banner').getByText('Bazar Saya')).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL('/')

  await page.goto('/settings')
  await page.getByRole('button', { name: 'Kunci' }).click()
  await expect(page).toHaveURL(/\/unlock/)
  await page.goto('/')
  await expect(page).toHaveURL(/\/unlock/)
  // Lock clears data, but the device still remembers which lapak it belongs to.
  await expect(page.getByRole('heading', { name: 'Bazar Saya' })).toBeVisible()
})
