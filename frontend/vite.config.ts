import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'zero-icon.png', 'zero-bg.jpeg', 'zero-white.png', 'zero-black.png'],
      // manifest será lido automaticamente de public/manifest.json
    }),
  ],
})
