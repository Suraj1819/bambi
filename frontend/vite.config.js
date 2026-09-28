import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // The Android (Capacitor) build must NOT ship a service worker:
  // it caches the old bundle inside the app and causes stale / broken
  // backend connections after updates. Build it with:  npm run build:android
  const isAndroid = mode === 'android';

  return {
    plugins: [
      react(),

      VitePWA({
        disable: isAndroid,

        registerType: 'autoUpdate',

        includeAssets: [
          'favicon.svg',
          'favicon.ico',
          'apple-touch-icon.png',
        ],

        manifest: {
          name: 'WebDrop',
          short_name: 'WebDrop',
          description:
            'Fast, private, browser-based peer-to-peer file transfer.',

          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait-primary',

          theme_color: '#1A1A1A',
          background_color: '#1A1A1A',

          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },

        workbox: {
          cleanupOutdatedCaches: true,

          // Never serve the SPA shell for API / socket calls
          navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
        },

        devOptions: {
          enabled: false,
        },
      }),
    ],

    server: {
      host: '0.0.0.0',
      port: 5173,
    },
  };
});