import express from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './db.js'
import { DUMMY_HASH, hashPassword, verifyPassword } from './passwords.js'

// API_PORT wins in dev (Vite owns PORT there); hosts like Render/Railway set PORT in production.
const PORT = Number(process.env.API_PORT || process.env.PORT) || 8787
const IS_PROD = process.env.NODE_ENV === 'production'
const SESSION_COOKIE = 'haat_session'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 'loopback')
app.use(express.json({ limit: '10kb' }))

/* ───────── helpers ───────── */

const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return null
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ name, email, password }, { signup }) {
  const errors = {}
  const clean = {
    name: typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '',
    email: typeof email === 'string' ? email.trim().toLowerCase() : '',
    password: typeof password === 'string' ? password : '',
  }
  if (signup && (clean.name.length < 2 || clean.name.length > 60)) errors.name = 'Please enter your name (2 to 60 letters).'
  if (!EMAIL_RE.test(clean.email) || clean.email.length > 254) errors.email = 'Please enter a valid email address.'
  if (signup && (clean.password.length < 8 || clean.password.length > 128))
    errors.password = 'Password must be at least 8 characters.'
  if (!signup && !clean.password) errors.password = 'Please enter your password.'
  return { clean, errors }
}

function startSession(res, userId) {
  const token = randomBytes(32).toString('base64url')
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    sha256(token),
    userId,
    Date.now() + SESSION_MS,
  )
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: SESSION_MS,
    path: '/',
  })
}

function currentUser(req) {
  const token = readCookie(req, SESSION_COOKIE)
  if (!token) return null
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(sha256(token), Date.now())
  return row ? publicUser(row) : null
}

// Simple in-memory limiter: at most 10 login/signup attempts per IP every 15 minutes.
const attempts = new Map()
function rateLimit(req, res, next) {
  const key = `${req.ip}:${req.path}`
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return next()
  }
  if (++entry.count > 10) {
    res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
    return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' })
  }
  next()
}

// Browsers cannot send application/json across sites without a CORS preflight,
// so requiring it on writes (plus SameSite=Lax cookies) blocks CSRF.
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Requests must be sent as JSON.' })
  }
  next()
})

/* ───────── routes ───────── */

app.post('/api/auth/signup', rateLimit, async (req, res) => {
  const { clean, errors } = validate(req.body ?? {}, { signup: true })
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })

  const exists = db.prepare('SELECT 1 FROM users WHERE email = ?').get(clean.email)
  if (exists) {
    return res.status(409).json({
      error: 'An account with this email already exists. Try logging in.',
      fields: { email: 'This email is already registered.' },
    })
  }

  const passwordHash = await hashPassword(clean.password)
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(clean.name, clean.email, passwordHash)
  const id = Number(lastInsertRowid)

  startSession(res, id)
  res.status(201).json({ user: { id, name: clean.name, email: clean.email } })
})

app.post('/api/auth/login', rateLimit, async (req, res) => {
  const { clean, errors } = validate(req.body ?? {}, { signup: false })
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(clean.email)
  const ok = await verifyPassword(clean.password, user?.password_hash ?? DUMMY_HASH)
  if (!user || !ok) return res.status(401).json({ error: 'Email or password is incorrect.' })

  startSession(res, user.id)
  res.json({ user: publicUser(user) })
})

app.post('/api/auth/logout', (req, res) => {
  const token = readCookie(req, SESSION_COOKIE)
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token))
  res.clearCookie(SESSION_COOKIE, { path: '/' })
  res.json({ ok: true })
})

app.get('/api/auth/me', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ user: currentUser(req) })
})

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }))

/* ───────── production: serve the built site ───────── */

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(join(dist, 'index.html')) : next()))
}

app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
})

// Drop expired sessions now and every hour.
const sweep = () => db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())
sweep()
setInterval(sweep, 60 * 60 * 1000).unref()

app.listen(PORT, () => console.log(`haat API listening on http://localhost:${PORT}`))
