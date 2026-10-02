import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { 'virtual:pwa-register/react': path.resolve(import.meta.dirname, 'src/test/pwa-stub.ts') } },
  define: { __APP_VERSION__: JSON.stringify('test') },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
})
