import { test, expect } from '@playwright/test'
import { adminLogin } from './helpers'

test('admin creates a lapak, the team opens its link and logs in; data is separate; admin deletes it', async ({ page, browser }, info) => {
  const slug = `toko-${info.project.name}`
  await adminLogin(page)

  await page.getByRole('button', { name: 'Lapak baru' }).click()
  const sheet = page.getByRole('dialog', { name: 'Lapak baru' })
  await sheet.getByLabel('Nama lapak').fill(`Toko ${info.project.name}`)
  await expect(sheet.getByLabel('Link')).toHaveValue(slug)
  await sheet.getByLabel('Kode akses').fill('toko-123456')
  await sheet.getByRole('button', { name: 'Buat lapak' }).click()

  const done = page.getByRole('dialog', { name: 'Lapak siap' })
  await expect(done.getByText(`/l/${slug}`)).toBeVisible()
  await expect(done.getByText('toko-123456')).toBeVisible()
  await done.getByRole('button', { name: 'Selesai' }).click()
  await expect(page.getByRole('link', { name: new RegExp(`Toko ${info.project.name}`) })).toBeVisible()

  // The team, on another device.
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport })
  const team = await ctx.newPage()
  await team.goto(`/l/${slug}`)
  await expect(team.getByRole('heading', { name: `Toko ${info.project.name}` })).toBeVisible()
  await team.getByLabel('Kode akses').fill('toko-123456')
  await team.getByRole('button', { name: 'Masuk' }).click()
  await expect(team.getByRole('banner').getByText(`Toko ${info.project.name}`)).toBeVisible()
  await team.goto('/?m=2026-10')
  await expect(team.getByText('CFD South City')).toHaveCount(0)
  await ctx.close()

  // Delete: needs the slug typed.
  await page.getByRole('link', { name: new RegExp(`Toko ${info.project.name}`) }).click()
  await page.getByRole('button', { name: 'Hapus lapak…' }).click()
  const confirm = page.getByRole('dialog', { name: /Hapus Toko/ })
  const go = confirm.getByRole('button', { name: 'Hapus lapak' })
  await expect(go).toBeDisabled()
  await confirm.getByLabel(`Ketik ${slug} untuk melanjutkan`).fill(slug)
  await go.click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('link', { name: new RegExp(`Toko ${info.project.name}`) })).toHaveCount(0)
})

test('admin pages need an admin session', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/admin\/login/)
})
