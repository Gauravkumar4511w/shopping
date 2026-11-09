import express from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { all, dbConfigured, ensureSchema, get, run } from './db.js'
import { dummyHashOnce, hashPassword, verifyPassword } from './passwords.js'
import { FREE_SHIPPING_AT, PRODUCTS, SHIPPING_FEE } from '../src/data/products.js'

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

/* ───────── newsletter ───────── */

// Club members get ₹200 off their first order with this code.
const CLUB_CODE = 'HAAT200'
const CLUB_DISCOUNT = 200

app.post('/api/newsletter', rateLimit, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address.', fields: { email: 'Please enter a valid email address.' } })
  }
  const { rowsAffected } = await run('INSERT INTO subscribers (email) VALUES (?) ON CONFLICT(email) DO NOTHING', email)
  res.status(rowsAffected ? 201 : 200).json({ ok: true, alreadySubscribed: !rowsAffected, code: CLUB_CODE })
})

/* ───────── contact ───────── */

const TOPICS = ['order', 'returns', 'wholesale', 'other']

app.post('/api/contact', rateLimit, async (req, res) => {
  const body = req.body ?? {}
  const str = (v) => (typeof v === 'string' ? v.trim() : '')
  const clean = {
    name: str(body.name).replace(/\s+/g, ' '),
    email: str(body.email).toLowerCase(),
    topic: TOPICS.includes(body.topic) ? body.topic : 'other',
    message: str(body.message),
  }
  const errors = {}
  if (clean.name.length < 2 || clean.name.length > 60) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(clean.email) || clean.email.length > 254) errors.email = 'Please enter a valid email address.'
  if (clean.message.length < 10 || clean.message.length > 2000) errors.message = 'Please write at least 10 characters.'
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Please fix the highlighted fields.', fields: errors })

  const user = await currentUser(req)
  const { lastInsertRowid } = await run(
    'INSERT INTO messages (name, email, topic, message, user_id) VALUES (?, ?, ?, ?, ?)',
    clean.name,
    clean.email,
    clean.topic,
    clean.message,
    user?.id ?? null,
  )
  res.status(201).json({ ok: true, ticket: `HT-Q${String(lastInsertRowid).padStart(4, '0')}` })
})

/* ───────── orders ───────── */

const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]))
const orderCode = (id) => `HT-${String(id).padStart(5, '0')}`

function publicOrder(row) {
  return {
    id: Number(row.id),
    code: orderCode(row.id),
    items: JSON.parse(row.items),
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount),
    coupon: row.coupon,
    total: Number(row.total),
    name: row.name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    pincode: row.pincode,
    payment: row.payment,
    status: row.status,
    createdAt: `${row.created_at.replace(' ', 'T')}Z`,
  }
}

async function requireUser(req, res, next) {
  req.user = await currentUser(req)
  if (!req.user) return res.status(401).json({ error: 'Please log in to continue.' })
  next()
}

function validateOrder(body, user) {
  const errors = {}
  const str = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '')

  // Merge repeated product ids and cap quantities. Prices always come from the server catalogue.
  const qtyById = new Map()
  for (const item of Array.isArray(body.items) ? body.items.slice(0, 50) : []) {
    const id = Number(item?.id)
    const qty = Number(item?.qty)
    if (!PRODUCT_BY_ID.has(id) || !Number.isInteger(qty) || qty < 1) continue
    qtyById.set(id, Math.min(10, (qtyById.get(id) || 0) + qty))
  }
  const items = [...qtyById].map(([id, qty]) => {
    const p = PRODUCT_BY_ID.get(id)
    return { id, name: p.name, kind: p.kind, bg: p.bg, price: p.price, qty }
  })
  if (!items.length) errors.items = 'Your bag is empty.'

  const phone = str(body.phone).replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')
  const clean = {
    name: str(body.name) || user.name,
    phone,
    address: str(body.address),
    city: str(body.city),
    pincode: str(body.pincode),
  }
  if (clean.name.length < 2 || clean.name.length > 60) errors.name = 'Please enter the name for delivery.'
  if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = 'Enter a 10-digit mobile number.'
  if (clean.address.length < 8 || clean.address.length > 200) errors.address = 'Please enter your full address.'
  if (clean.city.length < 2 || clean.city.length > 60) errors.city = 'Please enter your city.'
  if (!/^[1-9]\d{5}$/.test(clean.pincode)) errors.pincode = 'Enter a 6-digit PIN code.'

  const coupon = str(body.coupon).toUpperCase()
  if (coupon && coupon !== CLUB_CODE) errors.coupon = 'This code is not valid.'

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE
  return { errors, clean, items, subtotal, shipping, coupon: coupon || null }
}

app.post('/api/orders', requireUser, async (req, res) => {
  const { errors, clean, items, subtotal, shipping, coupon } = validateOrder(req.body ?? {}, req.user)
  if (coupon && !errors.coupon) {
    const earlier = await get("SELECT 1 FROM orders WHERE user_id = ? AND status != 'cancelled'", req.user.id)
    if (earlier) errors.coupon = 'This code only works on your first order.'
  }
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: errors.items || 'Please fix the highlighted fields.', fields: errors })
  }
  const discount = coupon ? Math.min(CLUB_DISCOUNT, subtotal) : 0
  const { lastInsertRowid } = await run(
    `INSERT INTO orders (user_id, items, subtotal, shipping, discount, coupon, total, name, phone, address, city, pincode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    req.user.id,
    JSON.stringify(items),
    subtotal,
    shipping,
    discount,
    coupon,
    subtotal + shipping - discount,
    clean.name,
    clean.phone,
    clean.address,
    clean.city,
    clean.pincode,
  )
  const row = await get('SELECT * FROM orders WHERE id = ?', Number(lastInsertRowid))
  res.status(201).json({ order: publicOrder(row) })
})

app.get('/api/orders', requireUser, async (req, res) => {
  const rows = await all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 50', req.user.id)
  res.json({ orders: rows.map(publicOrder) })
})

app.post('/api/orders/:id/cancel', requireUser, async (req, res) => {
  const id = Number(req.params.id)
  const { rowsAffected } = await run(
    "UPDATE orders SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'placed'",
    id,
    req.user.id,
  )
  const row = await get('SELECT * FROM orders WHERE id = ? AND user_id = ?', id, req.user.id)
  if (!row) return res.status(404).json({ error: 'Order not found.' })
  if (!rowsAffected) return res.status(409).json({ error: 'This order can no longer be cancelled.' })
  res.json({ order: publicOrder(row) })
})

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }))

app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
})

export default app
