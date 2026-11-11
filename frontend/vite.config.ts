import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Same-origin /api calls in dev, so the backend needs no CORS setup.
  server: { proxy: { '/api': 'http://localhost:3000' } },
})
