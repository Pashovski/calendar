import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ttf,woff2,svg,png}'],
      },
      manifest: {
        name: 'Garbage Rotation',
        short_name: 'Garbage',
        display: 'fullscreen',
        background_color: '#c8b89a',
        theme_color: '#7a1f2b',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 7)),
  },
})
