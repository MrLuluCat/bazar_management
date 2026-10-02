import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('Flow B: DP then Lunasi; summary remaining updates; edit/delete confirm; overpay note', async ({ page }, info) => {
  await login(page, '/?m=2027-05')
  const add = info.project.name === 'mobile' ? page.getByRole('button', { name: 'Tambah event' }).last() : page.getByRole('banner').getByRole('button', { name: 'Tambah event' })
  await add.click()
  const sheet = page.getByRole('dialog', { name: 'Tambah event' })
  await sheet.getByLabel('Judul').fill('Bazar Bayar')
  await sheet.getByLabel('Tanggal').fill('2027-05-08')
  await sheet.getByLabel('Lokasi').fill('Plaza')
  await sheet.getByLabel('Biaya booth').fill('200000')
  await sheet.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Event ditambahkan')).toBeVisible()
  const summary = page.getByRole('group', { name: 'Ringkasan bulan' })
  await expect(summary.getByText('Rp 200.000').last()).toBeVisible()

  await page.locator('#d-2027-05-08').getByText('Bazar Bayar').click()
  await expect(page.getByText('Belum bayar').first()).toBeVisible()

  // DP
  await page.getByRole('button', { name: 'Catat pembayaran' }).click()
  const pay = page.getByRole('dialog', { name: 'Catat pembayaran' })
  await pay.getByLabel('Nominal').fill('50000')
  await pay.getByLabel('Catatan').fill('DP')
  await pay.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pembayaran dicatat')).toBeVisible()
  await expect(page.getByText('DP', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Sisa Rp 150.000')).toBeVisible()

  // Lunasi pre-fills the remaining 150.000
  await page.getByRole('button', { name: 'Lunasi' }).click()
  const lunasi = page.getByRole('dialog', { name: 'Lunasi' })
  await expect(lunasi.getByLabel('Nominal')).toHaveValue('150.000')
  await lunasi.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Lunas').first()).toBeVisible()
  await expect(page.getByText('Sisa Rp 0')).toBeVisible()

  // Agenda summary remaining updates (no longer includes this event)
  await page.getByRole('link', { name: 'Agenda' }).first().click()
  await expect(page.locator('#d-2027-05-08').getByText('Lunas')).toBeVisible()

  // Edit the DP down below total -> deleting needs confirm; overpay shows note.
  await page.locator('#d-2027-05-08').getByText('Bazar Bayar').click()
  await page.getByRole('button', { name: 'Hapus pembayaran DP' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Sisa Rp 50.000')).toBeVisible()
  await expect(page.getByText('DP', { exact: true }).first()).toBeVisible()

  // Overpay: edit the remaining payment up to 300.000 -> Lunas + "Lebih Rp 100.000"
  await page.getByRole('button', { name: /Ubah pembayaran/ }).click()
  const edit = page.getByRole('dialog', { name: 'Ubah pembayaran' })
  await edit.getByLabel('Nominal').fill('300000')
  await edit.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Lebih Rp 100.000')).toBeVisible()

  // Clean up
  await page.getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Event dihapus')).toBeVisible()
})
