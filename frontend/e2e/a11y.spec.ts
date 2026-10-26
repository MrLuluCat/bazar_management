import AxeBuilder from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'
import { E2E } from './constants'
import { adminLogin, login } from './helpers'

async function scan(page: Page, label: string) {
  await page.waitForTimeout(400) // let colour transitions and sheet animations settle
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(bad.map((v) => `${label}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target}`), label).toEqual([])
}

for (const theme of ['light', 'dark'] as const) {
  test(`axe: 0 serious/critical on every route (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('bazar.theme', t), theme)

    await page.goto(`/l/${E2E.slug}`)
    await expect(page.getByLabel('Kode akses')).toBeVisible()
    await scan(page, 'unlock')

    await login(page, '/?m=2026-10')
    await expect(page.locator('#d-2026-10-24')).toBeVisible()
    await scan(page, 'agenda')

    await page.getByRole('radio', { name: 'Kalender' }).click()
    await expect(page.getByRole('grid')).toBeVisible()
    await scan(page, 'kalender')
    await page.getByRole('radio', { name: 'Agenda' }).click()

    await page.locator('#d-2026-10-24').getByText('CFD South City').click()
    await expect(page.getByRole('heading', { name: 'CFD South City' })).toBeVisible()
    await scan(page, 'event detail')

    await page.getByRole('button', { name: 'Catat pembayaran' }).click()
    await expect(page.getByRole('dialog', { name: 'Catat pembayaran' })).toBeVisible()
    await scan(page, 'payment sheet')
    await page.keyboard.press('Escape')

    await page.goto('/contacts')
    await expect(page.getByText('Bu Rina')).toBeVisible()
    await scan(page, 'contacts')
    await page.getByText('Bu Rina').click()
    await expect(page.getByRole('heading', { name: 'Bu Rina' })).toBeVisible()
    await scan(page, 'contact detail')

    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Pengaturan' })).toBeVisible()
    await scan(page, 'settings')

    await page.goto('/?m=2026-10&new=event')
    await expect(page.getByRole('dialog', { name: 'Tambah event' })).toBeVisible()
    await scan(page, 'event form')
    await page.keyboard.press('Escape')

    await page.goto('/admin/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await scan(page, 'admin login')
    await adminLogin(page)
    await scan(page, 'admin lapak list')
    await page.getByRole('button', { name: 'Lapak baru' }).click()
    await expect(page.getByRole('dialog', { name: 'Lapak baru' })).toBeVisible()
    await scan(page, 'admin create sheet')
    await page.keyboard.press('Escape')
    await page.getByRole('link', { name: /Bazar Saya/ }).click()
    await expect(page.getByRole('heading', { name: 'Bazar Saya', level: 1 })).toBeVisible()
    await scan(page, 'admin lapak detail')
    await page.getByRole('button', { name: 'Hapus lapak…' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await scan(page, 'admin confirm')
    await page.keyboard.press('Escape')
    await page.getByRole('link', { name: 'Backup' }).click()
    await expect(page.getByRole('heading', { name: 'Backup' })).toBeVisible()
    await scan(page, 'admin backups')
  })
}
