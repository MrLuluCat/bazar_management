import { test, expect } from '@playwright/test'
import { E2E } from './constants'

test('wrong then right passcode; session survives reload; lock returns to unlock', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/unlock/)
  // No lapak remembered yet: pick one from the list.
  await expect(page.getByRole('heading', { name: 'Pilih lapak' })).toBeVisible()
  await page.getByRole('link', { name: 'Bazar Saya' }).click()
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
  await page.getByRole('button', { name: 'Pilih lapak lain' }).click()
  await expect(page.getByRole('heading', { name: 'Pilih lapak' })).toBeVisible()
})
