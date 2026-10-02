import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  root: path.resolve(import.meta.dirname, '..'),
  test: {
    environment: 'node',
    include: ['pb/tests/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
})
