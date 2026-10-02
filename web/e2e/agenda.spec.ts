import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('seed month renders grouped by date with status badges', async ({ page }) => {
  await login(page, '/?m=2026-10')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/oktober 2026/i)
  // Three one-off events share Sat 24 Oct (plus a weekly series occurrence).
  const day24 = page.locator('#d-2026-10-24')
  await expect(day24.getByText('CFD South City')).toBeVisible()
  await expect(day24.getByText('Bazar Sekolah')).toBeVisible()
  await expect(day24.getByText('Open House')).toBeVisible()
  await expect(day24.getByText('DP').first()).toBeVisible()
  await expect(day24.getByText('Lunas')).toBeVisible()
  await expect(page.getByText('Dibatalkan')).toHaveClass(/line-through/)
  await expect(page.getByRole('group', { name: 'Ringkasan bulan' })).toBeVisible()
  await page.screenshot({ path: `test-results/agenda-${test.info().project.name}.png`, fullPage: true })
})

test('month navigation and empty month', async ({ page }) => {
  await login(page, '/?m=2026-10')
  await page.getByRole('button', { name: 'Bulan berikutnya' }).click()
  await expect(page.getByText('Bazar Desember')).toBeVisible()
  await page.getByRole('button', { name: 'Bulan berikutnya' }).click()
  await expect(page.getByText('Belum ada event bulan ini.')).toBeVisible()
})
