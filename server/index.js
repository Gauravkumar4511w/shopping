// Long-running server for local dev (`npm run dev`) and self-hosting (`npm start`).
// On Vercel the same app runs as a serverless function instead: see api/index.js.
import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './app.js'

// API_PORT wins in dev (Vite owns PORT there); hosts like Render/Railway set PORT in production.
const PORT = Number(process.env.API_PORT || process.env.PORT) || 8787

// When self-hosting, serve the built site from the same server.
const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (process.env.NODE_ENV === 'production' && existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(join(dist, 'index.html')) : next()))
}

app.listen(PORT, () => console.log(`haat API listening on http://localhost:${PORT}`))
