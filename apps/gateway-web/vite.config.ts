import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Charts are heavy and only needed on analytics surfaces — keep them out of the
        // entry chunk so first paint on auth/checkout stays small.
        codeSplitting: {
          groups: [
            { name: 'charts', test: /node_modules[\\/]recharts/ },
            { name: 'motion', test: /node_modules[\\/](framer-)?motion/ },
            { name: 'vendor', test: /node_modules[\\/](react|react-dom|react-router)/ },
          ],
        },
      },
    },
  },
})
