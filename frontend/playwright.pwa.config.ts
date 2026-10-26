import { defineConfig } from '@playwright/test'

// Runs against the production build (service worker only registers there).
export default defineConfig({
  testDir: './e2e-pwa',
  globalSetup: './e2e/global-setup.ts',
  workers: 1,
  use: { baseURL: 'http://localhost:4173', channel: 'chrome', viewport: { width: 1440, height: 900 } },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { VITE_GROUP_EMAIL: 'grup@bazar.test' },
  },
})
