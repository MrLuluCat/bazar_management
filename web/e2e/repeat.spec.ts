import { test, expect, type Page } from '@playwright/test'
import { login } from './helpers'

const addButton = (page: Page, project: string) =>
  project === 'mobile' ? page.getByRole('button', { name: 'Tambah event' }).last() : page.getByRole('banner').getByRole('button', { name: 'Tambah event' })

test('Flow C: duplicate to 3 dates, payments not copied', async ({ page }, info) => {
  await login(page, '/?m=2027-10')
  await addButton(page, info.project.name).click()
  const sheet = page.getByRole('dialog', { name: 'Tambah event' })
  await sheet.getByLabel('Judul').fill('Sumber Duplikat')
  await sheet.getByLabel('Tanggal').fill('2027-10-02')
  await sheet.getByLabel('Lokasi').fill('Kampus')
  await sheet.getByLabel('Biaya booth').fill('100000')
  await sheet.getByRole('button', { name: 'Simpan' }).click()
  await page.locator('#d-2027-10-02').getByText('Sumber Duplikat').click()

  await page.getByRole('button', { name: 'Catat pembayaran' }).click()
  const pay = page.getByRole('dialog', { name: 'Catat pembayaran' })
  await pay.getByLabel('Nominal').fill('40000')
  await pay.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Sisa Rp 60.000')).toBeVisible()

  await page.getByRole('button', { name: 'Duplikat' }).click()
  const dup = page.getByRole('dialog', { name: 'Duplikat ke tanggal' })
  await dup.getByRole('button', { name: 'Bulan berikutnya' }).click()
  for (const d of ['6', '13', '20']) await dup.getByRole('button', { name: new RegExp(`^\\S+ ${d} November$`) }).click()
  await dup.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('3 event dibuat')).toBeVisible()

  await expect(page).toHaveURL(/m=2027-11/)
  for (const d of ['06', '13', '20']) {
    const day = page.locator(`#d-2027-11-${d}`)
    await expect(day.getByText('Sumber Duplikat')).toBeVisible()
    await expect(day.getByText('Belum bayar')).toBeVisible()
  }

  // Clean up the 3 copies and the source.
  for (const d of ['06', '13', '20']) {
    await page.locator(`#d-2027-11-${d}`).getByText('Sumber Duplikat').click()
    await page.getByRole('button', { name: 'Hapus', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
    await expect(page).not.toHaveURL(/\/event\//)
  }
  await page.goto('/?m=2027-10')
  await page.locator('#d-2027-10-02').getByText('Sumber Duplikat').click()
  await page.getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page).not.toHaveURL(/\/event\//)
})

test('Ulangi weekly x6; edit "ini & seterusnya" changes this + later only; delete "hanya ini"', async ({ page }, info) => {
  await login(page, '/?m=2027-08')
  await addButton(page, info.project.name).click()
  const sheet = page.getByRole('dialog', { name: 'Tambah event' })
  await sheet.getByLabel('Judul').fill('CFD Seri')
  await sheet.getByLabel('Tanggal').fill('2027-08-07')
  await sheet.getByLabel('Lokasi').fill('Lokasi Lama')
  await sheet.getByRole('checkbox', { name: 'Ulangi' }).check()
  await sheet.getByLabel('Sampai tanggal').fill('2027-09-11')
  await expect(sheet.getByRole('checkbox', { name: /Sab/ })).toHaveCount(6)
  await sheet.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('6 event dibuat')).toBeVisible()

  for (const d of ['07', '14', '21', '28']) await expect(page.locator(`#d-2027-08-${d}`).getByText('CFD Seri')).toBeVisible()

  // Edit the 3rd (21 Aug), scope "Ini & seterusnya".
  await page.locator('#d-2027-08-21').getByText('CFD Seri').click()
  await page.getByRole('button', { name: 'Edit' }).click()
  const edit = page.getByRole('dialog', { name: 'Ubah event' })
  await edit.getByLabel('Lokasi').fill('Lokasi Baru')
  await edit.getByRole('button', { name: 'Simpan' }).click()
  await page.getByRole('dialog', { name: /Ubah event berulang/ }).getByRole('button', { name: 'Ini & seterusnya' }).click()
  await expect(page.getByText('Event disimpan')).toBeVisible()

  await page.goto('/?m=2027-08')
  await expect(page.locator('#d-2027-08-14').getByText('Lokasi Lama')).toBeVisible()
  await expect(page.locator('#d-2027-08-21').getByText('Lokasi Baru')).toBeVisible()
  await expect(page.locator('#d-2027-08-28').getByText('Lokasi Baru')).toBeVisible()
  await page.goto('/?m=2027-09')
  await expect(page.locator('#d-2027-09-11').getByText('Lokasi Baru')).toBeVisible()

  // Delete only 14 Aug.
  await page.goto('/?m=2027-08')
  await page.locator('#d-2027-08-14').getByText('CFD Seri').click()
  await page.getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.getByRole('dialog', { name: /Hapus event berulang/ }).getByRole('button', { name: 'Hanya event ini' }).click()
  await expect(page).not.toHaveURL(/\/event\//)
  await expect(page.locator('#d-2027-08-14')).toHaveCount(0)
  await expect(page.locator('#d-2027-08-07').getByText('CFD Seri')).toBeVisible()
  await expect(page.locator('#d-2027-08-21').getByText('CFD Seri')).toBeVisible()

  // Clean up the rest: delete "ini & seterusnya" from the first.
  await page.locator('#d-2027-08-07').getByText('CFD Seri').click()
  await page.getByRole('button', { name: 'Hapus', exact: true }).click()
  await page.getByRole('dialog', { name: /Hapus event berulang/ }).getByRole('button', { name: 'Ini & seterusnya' }).click()
  await expect(page).not.toHaveURL(/\/event\//)
  await page.goto('/?m=2027-09')
  await expect(page.getByText('Belum ada event bulan ini.')).toBeVisible()
})
