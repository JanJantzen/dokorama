import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname ist in modernen ES-Modulen nicht automatisch verfügbar – hier manuell definiert
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Der Service Worker wird automatisch registriert und bei neuer Version aktualisiert
      registerType: 'autoUpdate',
      // manifest: false – wir verwenden public/manifest.json direkt (liegt im Repository,
      // ist lesbar, und wird von index.html manuell verlinkt). Das Plugin kümmert sich
      // nur um den Service Worker, nicht um ein eigenes Manifest.
      manifest: false,
      // Welche Dateien soll der Service Worker beim ersten Laden cachen?
      // Glob-Muster relativ zum Build-Output (dist/)
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      // "@" als Abkürzung für den "src"-Ordner, z.B. "@/components/Button"
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
