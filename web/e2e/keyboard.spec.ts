import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('desktop shortcuts: n opens the sheet, arrows change month, t returns to today, / focuses search', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'keyboard shortcuts are a desktop feature')
  await login(page, '/?m=2026-10')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/november 2026/i)
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/september 2026/i)
  await page.keyboard.press('t')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/oktober 2026/i)
  await page.keyboard.press('/')
  await expect(page.getByRole('searchbox', { name: 'Cari' })).toBeFocused()
  await page.keyboard.type('nt') // typing must not trigger shortcuts
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Cari' }).blur()
  await page.keyboard.press('n')
  await expect(page.getByRole('dialog', { name: 'Tambah event' })).toBeVisible()
})

test('keyboard only: add an event (Flow A) and record a payment (Flow B)', async ({ page }) => {
  await login(page, '/?m=2027-06&new=event')
  const sheet = page.getByRole('dialog', { name: 'Tambah event' })
  await expect(sheet.getByLabel('Judul')).toBeFocused()
  await page.keyboard.type('Bazar Keyboard')
  await page.keyboard.press('Tab') // Tanggal
  await sheet.getByLabel('Tanggal').fill('2027-06-12')
  await sheet.getByLabel('Lokasi').focus()
  await page.keyboard.type('Aula')
  await sheet.getByLabel('Biaya booth').focus()
  await page.keyboard.type('90000')
  await sheet.getByRole('button', { name: 'Simpan' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Event ditambahkan')).toBeVisible()

  await page.locator('#d-2027-06-12').getByRole('link', { name: /Bazar Keyboard/ }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Bazar Keyboard' })).toBeVisible()
  await page.getByRole('button', { name: 'Lunasi' }).focus()
  await page.keyboard.press('Enter')
  const pay = page.getByRole('dialog', { name: 'Lunasi' })
  await expect(pay.getByLabel('Nominal')).toBeFocused()
  await expect(pay.getByLabel('Nominal')).toHaveValue('90.000')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Escape') // Esc closes the sheet
  await expect(pay).toBeHidden()
  await page.getByRole('button', { name: 'Lunasi' }).focus()
  await page.keyboard.press('Enter')
  await pay.getByRole('button', { name: 'Simpan' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Sisa Rp 0')).toBeVisible()

  // Clean up.
  await page.getByRole('button', { name: 'Hapus', exact: true }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).not.toHaveURL(/\/event\//)
})

test('sheets trap focus: Tab cycles inside the dialog', async ({ page }) => {
  await login(page, '/?m=2026-10&new=event')
  const sheet = page.getByRole('dialog', { name: 'Tambah event' })
  await expect(sheet).toBeVisible()
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab')
    const inside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))
    expect(inside).toBe(true)
  }
})
