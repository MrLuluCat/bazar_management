import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

const PAPER = '#f8f4ec' // --paper, hex for the manifest

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.png', 'fonts/*.woff2'],
      manifest: {
        name: 'Bazar Manager',
        short_name: 'Bazar',
        description: 'Atur jadwal bazar, kontak penanggung jawab dan pembayaran booth.',
        lang: 'id',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: PAPER,
        background_color: PAPER,
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/_\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => /^\/api\/collections\/[^/]+\/records/.test(url.pathname),
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              cacheName: 'api-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/files/'),
            handler: 'CacheFirst',
            options: { cacheName: 'files-v1', expiration: { maxEntries: 100 }, cacheableResponse: { statuses: [200] } },
          },
        ],
      },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { proxy: { '/api': 'http://127.0.0.1:8090' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:8090' } },
})
