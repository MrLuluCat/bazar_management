import { test, expect } from '@playwright/test'
import { E2E } from './constants'

test('wrong then right passcode; session survives reload; lock returns to unlock', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/unlock/)

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
})
