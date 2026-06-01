import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname ist in modernen ES-Modulen nicht automatisch verfügbar – hier manuell definiert
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // "@" als Abkürzung für den "src"-Ordner, z.B. "@/components/Button"
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
