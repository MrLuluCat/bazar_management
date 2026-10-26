import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('assistant answers, proposes an event from a message, and saves it only on Simpan', async ({ page }, info) => {
  await login(page, '/?m=2026-11')
  await page.getByRole('button', { name: 'Asisten' }).click()
  const panel = page.getByRole('dialog', { name: 'Asisten' })
  await expect(panel).toBeVisible()

  await panel.getByRole('button', { name: 'Sabtu ini ada event apa?' }).click()
  await expect(panel.getByText('Sabtu ini ada CFD Mingguan.')).toBeVisible()

  await panel.getByLabel('Pesan untuk asisten').fill(`Ini isi poster bazar (${info.project.name})`)
  await panel.getByLabel('Pesan untuk asisten').press('Enter')
  const card = panel.getByRole('article', { name: 'Usulan: Bazar Ramadhan' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Rp 250.000')
  await expect(card).toContainText('Lapangan Merdeka')

  // Not saved yet.
  await page.keyboard.press('Escape')
  await expect(page.locator('#d-2026-11-21')).toHaveCount(0)

  await page.getByRole('button', { name: 'Asisten' }).click()
  await card.getByRole('button', { name: 'Simpan', exact: true }).click()
  await expect(card.getByText('Tersimpan')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#d-2026-11-21').getByText('Bazar Ramadhan')).toBeVisible()

  // Clean up so the other project starts from the same data.
  // Keyboard: on mobile the row can sit under the floating + button.
  await page.locator('#d-2026-11-21').getByRole('link', { name: /Bazar Ramadhan/ }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Hapus' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hapus' }).click()
  await expect(page).not.toHaveURL(/\/event\//)
})
