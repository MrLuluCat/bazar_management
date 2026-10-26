import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('Kalender: dots on event days, tap day opens the list, choice persists', async ({ page }) => {
  await login(page, '/?m=2026-10')
  await page.getByRole('radio', { name: 'Kalender' }).click()

  const grid = page.getByRole('grid', { name: /Oktober 2026/i })
  await expect(grid).toBeVisible()
  // 24 Okt: 3 one-offs + a series occurrence -> "3+"
  await expect(grid.getByRole('gridcell', { name: /24 Oktober/ })).toContainText('3+')
  // 11 Okt: one event
  await expect(grid.getByRole('gridcell', { name: /11 Oktober/ })).toContainText('•')
  // 25 Okt: no events
  await expect(grid.getByRole('gridcell', { name: /25 Oktober/ })).not.toContainText('•')

  await grid.getByRole('gridcell', { name: /24 Oktober/ }).click()
  const list = page.getByRole('region', { name: /Event 24 Okt/ }).or(page.getByRole('dialog', { name: /Event 24 Okt/ }))
  await expect(list).toBeVisible()
  await expect(list.getByText('CFD South City')).toBeVisible()
  await expect(list.getByText('Bazar Sekolah')).toBeVisible()
  await expect(list.getByText('Open House')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('radio', { name: 'Kalender', checked: true })).toBeVisible()
  // The selected day (URL state) reopens its sheet on mobile: wait for it before closing, or Escape can land first.
  const reopened = page.getByRole('dialog', { name: /Event 24 Okt/ })
  if (test.info().project.name === 'mobile') await expect(reopened).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(reopened).toBeHidden()
  await page.getByRole('radio', { name: 'Agenda' }).click()
  await expect(page.locator('#d-2026-10-24')).toBeVisible()
})
