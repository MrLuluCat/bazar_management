import { test, expect, type Page } from '@playwright/test'
import { login } from './helpers'

const noHScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)

// 320 px wide; 200% zoom is the same layout width at half the CSS px, i.e. a 320 px viewport (WCAG reflow).
test('320 px: no horizontal scroll on any route', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await login(page, '/?m=2026-10')
  await expect(page.locator('#d-2026-10-24')).toBeVisible()
  expect(await noHScroll(page), 'agenda').toBe(true)

  await page.getByRole('radio', { name: 'Kalender' }).click()
  await expect(page.getByRole('grid')).toBeVisible()
  expect(await noHScroll(page), 'kalender').toBe(true)
  await page.getByRole('radio', { name: 'Agenda' }).click()

  await page.locator('#d-2026-10-24').getByText('CFD South City').click()
  await expect(page.getByRole('heading', { name: 'CFD South City' })).toBeVisible()
  expect(await noHScroll(page), 'event detail').toBe(true)

  for (const [path, heading] of [['/contacts', 'Kontak'], ['/settings', 'Pengaturan']] as const) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    expect(await noHScroll(page), path).toBe(true)
  }

  await page.goto('/?m=2026-10&new=event')
  await expect(page.getByRole('dialog', { name: 'Tambah event' })).toBeVisible()
  expect(await noHScroll(page), 'event form').toBe(true)
})
