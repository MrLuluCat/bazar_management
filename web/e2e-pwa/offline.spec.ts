import { test, expect } from '@playwright/test'
import { E2E } from '../e2e/constants'

test('installable, last month renders offline, writes disabled, Lock clears caches', async ({ page, context }) => {
  await page.goto('/unlock')
  await page.getByLabel('Kode akses').fill(E2E.passcode)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.getByRole('banner').getByText('Bazar Saya')).toBeVisible()

  // Manifest + service worker present.
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href
    return href ? (await fetch(href)).json() : null
  })
  expect(manifest).toMatchObject({ name: 'Bazar Manager', short_name: 'Bazar', display: 'standalone', start_url: '/' })
  await page.evaluate(() => navigator.serviceWorker.ready)

  await page.goto('/?m=2026-10')
  await expect(page.locator('#d-2026-10-24').getByText('CFD South City')).toBeVisible()
  await page.reload() // now controlled by the SW; runtime caches warm
  await expect(page.locator('#d-2026-10-24').getByText('CFD South City')).toBeVisible()

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Offline — data terakhir')).toBeVisible()
  await expect(page.locator('#d-2026-10-24').getByText('CFD South City')).toBeVisible()
  const add = page.getByRole('button', { name: 'Tambah event' }).first()
  await expect(add).toBeDisabled()

  // Lock clears persisted data and the api cache.
  await context.setOffline(false)
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Kunci' }).click()
  await expect(page).toHaveURL(/\/unlock/)
  const read = () => page.evaluate(async () => {
    const names = await caches.keys()
    const stored = await new Promise<string>((resolve) => {
      const req = indexedDB.open('keyval-store')
      req.onsuccess = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('keyval')) return resolve('')
        const all = db.transaction('keyval').objectStore('keyval').getAll()
        all.onsuccess = () => resolve(JSON.stringify(all.result))
      }
      req.onerror = () => resolve('')
    })
    // Seed contact phones start with 62; persisted data must not hold any after Lock.
    return { api: names.includes('api-v1'), files: names.includes('files-v1'), hasPhones: stored.includes('phone') || stored.includes('CFD South City') }
  })
  await expect.poll(read, { timeout: 8000 }).toEqual({ api: false, files: false, hasPhones: false })
})
