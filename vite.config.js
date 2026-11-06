import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The auth API runs on its own port in dev (see server/index.js).
    proxy: { '/api': 'http://localhost:8787' },
  },
})
