import express from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { dbConfigured, ensureSchema, get, run } from './db.js'
import { dummyHashOnce, hashPassword, verifyPassword } from './passwords.js'

const IS_PROD = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)
const SESSION_COOKIE = 'haat_session'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000

const app = express()
app.disable('x-powered-by')
// Behind Vercel's proxy the visitor's IP comes from X-Forwarded-For.
app.set('trust proxy', process.env.VERCEL ? true : 'loopback')
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

const publicUser = (u) => ({ id: Number(u.id), name: u.name, email: u.email })

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

async function startSession(res, userId) {
  const token = randomBytes(32).toString('base64url')
  await run(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
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

async function currentUser(req) {
  const token = readCookie(req, SESSION_COOKIE)
  if (!token) return null
  const row = await get(
    `SELECT u.id, u.name, u.email FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    sha256(token),
    Date.now(),
  )
  return row ? publicUser(row) : null
}

// In-memory limiter: at most 10 login/signup attempts per IP every 15 minutes.
// On Vercel each warm instance keeps its own count, so treat this as a speed bump.
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

/* ───────── guards ───────── */

app.use('/api', async (req, res, next) => {
  res.set('Cache-Control', 'no-store')

  // Browsers cannot send application/json across sites without a CORS preflight,
  // so requiring it on writes (plus SameSite=Lax cookies) blocks CSRF.
  if (req.method !== 'GET' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Requests must be sent as JSON.' })
  }

  if (!dbConfigured) {
    if (req.method === 'GET' && req.path === '/auth/me') return res.json({ user: null })
    return res.status(503).json({ error: 'Accounts are not switched on for this site yet. Please try again later.' })
  }

  try {
    await ensureSchema()
  } catch (err) {
    return next(err)
  }

  // Expired sessions are cleaned up lazily, at most once an hour per instance.
  if (Date.now() - lastSweep > 60 * 60 * 1000) {
    lastSweep = Date.now()
    run('DELETE FROM sessions WHERE expires_at <= ?', Date.now()).catch(() => {})
  }
  next()
})

let lastSweep = 0

/* ───────── routes ───────── */

app.post('/api/auth/signup', rateLimit, async (req, res) => {
  const { clean, errors } = validate(req.body ?? {}, { signup: true })
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })

  if (await get('SELECT 1 FROM users WHERE email = ?', clean.email)) {
    return res.status(409).json({
      error: 'An account with this email already exists. Try logging in.',
      fields: { email: 'This email is already registered.' },
    })
  }

  const passwordHash = await hashPassword(clean.password)
  try {
    const { lastInsertRowid } = await run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      clean.name,
      clean.email,
      passwordHash,
    )
    const id = Number(lastInsertRowid)
    await startSession(res, id)
    res.status(201).json({ user: { id, name: clean.name, email: clean.email } })
  } catch (err) {
    // Two signups for the same email at once: the UNIQUE index catches the second.
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' })
    }
    throw err
  }
})

app.post('/api/auth/login', rateLimit, async (req, res) => {
  const { clean, errors } = validate(req.body ?? {}, { signup: false })
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })

  const user = await get('SELECT id, name, email, password_hash FROM users WHERE email = ?', clean.email)
  const ok = await verifyPassword(clean.password, user?.password_hash ?? (await dummyHashOnce()))
  if (!user || !ok) return res.status(401).json({ error: 'Email or password is incorrect.' })

  await startSession(res, Number(user.id))
  res.json({ user: publicUser(user) })
})

app.post('/api/auth/logout', async (req, res) => {
  const token = readCookie(req, SESSION_COOKIE)
  if (token) await run('DELETE FROM sessions WHERE token_hash = ?', sha256(token))
  res.clearCookie(SESSION_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure: IS_PROD })
  res.json({ ok: true })
})

app.get('/api/auth/me', async (req, res) => {
  res.json({ user: await currentUser(req) })
})

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }))

app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
})

export default app
