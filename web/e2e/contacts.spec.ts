import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('Flow A full: new contact inline; contact links; delete keeps event', async ({ page }, info) => {
  await login(page, '/?m=2027-03')
  const add = info.project.name === 'mobile' ? page.getByRole('button', { name: 'Tambah event' }).last() : page.getByRole('banner').getByRole('button', { name: 'Tambah event' })
  await add.click()
  const sheet = page.getByRole('dialog', { name: 'Tambah event' })
  await sheet.getByLabel('Judul').fill('Pasar Kontak')
  await sheet.getByLabel('Tanggal').fill('2027-03-06')
  await sheet.getByLabel('Lokasi').fill('Lapangan')
  await sheet.getByRole('button', { name: '+ Kontak baru' }).click()
  await sheet.getByLabel('Nama kontak').fill('Pak Joko')
  await sheet.getByLabel('Nomor WhatsApp').fill('0812-9999-0000')
  await sheet.getByRole('button', { name: 'Simpan' }).click()

  await expect(page.getByText('Event ditambahkan')).toBeVisible()
  await page.locator('#d-2027-03-06').getByText('Pasar Kontak').click()

  // Event detail shows the contact card with WhatsApp + Telepon links.
  const wa = page.getByRole('link', { name: 'WhatsApp' })
  await expect(wa).toHaveAttribute('href', 'https://wa.me/6281299990000')
  await expect(page.getByRole('link', { name: 'Telepon' })).toHaveAttribute('href', 'tel:+6281299990000')
  await expect(page.getByText('0812-9999-0000')).toBeVisible()

  // Contact detail lists the linked event; deleting the contact keeps the event.
  await page.getByRole('link', { name: 'Pak Joko' }).click()
  await expect(page.getByRole('heading', { name: 'Pak Joko' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Pasar Kontak/ })).toBeVisible()
  await page.getByRole('button', { name: 'Hapus' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page).toHaveURL(/\/contacts$/)
  await expect(page.getByText('Pak Joko')).toBeHidden()

  await page.goto('/?m=2027-03')
  await expect(page.locator('#d-2027-03-06').getByText('Pasar Kontak')).toBeVisible()
  await page.locator('#d-2027-03-06').getByText('Pasar Kontak').click()
  await expect(page.getByRole('link', { name: 'WhatsApp' })).toBeHidden()

  // Clean up so the shared E2E database stays predictable.
  await page.getByRole('button', { name: 'Hapus' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page.getByText('Event dihapus')).toBeVisible()
})

test('contact list is alphabetical and searchable', async ({ page }) => {
  await login(page, '/contacts')
  const names = await page.getByRole('listitem').allInnerTexts()
  await expect(page.getByText('Bu Rina')).toBeVisible()
  expect(names.length).toBeGreaterThanOrEqual(4)
  const first = names.map((n) => n.split('
')[0])
  expect(first).toEqual([...first].sort((a, b) => a.localeCompare(b)))
  await page.getByRole('searchbox').fill('budi')
  await expect(page.getByText('Pak Budi')).toBeVisible()
  await expect(page.getByText('Bu Rina')).toBeHidden()
})
