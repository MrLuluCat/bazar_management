import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('Flow A: add event via sheet, appears under its date; Back closes the sheet', async ({ page }, info) => {
  await login(page, '/?m=2026-12')
  await expect(page.getByText('Belum ada event bulan ini.')).toBeVisible()

  const add = info.project.name === 'mobile' ? page.getByRole('button', { name: 'Tambah event' }).last() : page.getByRole('banner').getByRole('button', { name: 'Tambah event' })
  await add.click()
  const sheet = page.getByRole('dialog', { name: 'Tambah event' })
  await expect(sheet).toBeVisible()
  await expect(page).toHaveURL(/new=event/)

  // Back closes the sheet without leaving the page.
  await page.goBack()
  await expect(sheet).toBeHidden()
  await expect(page.getByText('Belum ada event bulan ini.')).toBeVisible()

  await add.click()
  await sheet.getByLabel('Judul').fill('Bazar Natal')
  await sheet.getByLabel('Tanggal').fill('2026-12-20')
  await sheet.getByLabel('Lokasi').fill('Balai Warga')
  await sheet.getByLabel('Mulai').fill('08:00')
  await sheet.getByLabel('Selesai').fill('14:00')
  await sheet.getByLabel('Biaya booth').fill('250000')
  await sheet.getByRole('button', { name: 'Simpan' }).click()

  await expect(page.getByText('Event ditambahkan')).toBeVisible()
  const day = page.locator('#d-2026-12-20')
  await expect(day.getByText('Bazar Natal')).toBeVisible()
  await expect(day.getByText('Belum bayar')).toBeVisible()
  await expect(day.getByText('Rp 250.000')).toBeVisible()

  // Detail: cancel and delete (with Undo toast).
  await day.getByText('Bazar Natal').click()
  await expect(page.getByRole('heading', { name: 'Bazar Natal' })).toBeVisible()
  await page.getByRole('button', { name: 'Batalkan' }).click()
  await expect(page.getByText('Batal', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Hapus' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Event dihapus')).toBeVisible()
  await expect(page).toHaveURL(/\/\?m=2026-12/)
  await expect(page.getByText('Bazar Natal')).toBeHidden()
})
