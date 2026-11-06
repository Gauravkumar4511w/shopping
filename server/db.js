import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'

// Production (Vercel): a Turso database, set by TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
// Local dev: the same libSQL client on a plain SQLite file in data/ (git-ignored).
const remoteUrl = process.env.TURSO_DATABASE_URL

// Vercel's filesystem is temporary, so a local file there would silently lose accounts.
export const dbConfigured = Boolean(remoteUrl) || !process.env.VERCEL

let client
function getDb() {
  if (!client) {
    if (remoteUrl) {
      client = createClient({ url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN })
    } else {
      const here = dirname(fileURLToPath(import.meta.url))
      const file = process.env.DB_FILE || join(here, '..', 'data', 'haat.db')
      mkdirSync(dirname(file), { recursive: true })
      client = createClient({ url: `file:${file}` })
    }
  }
  return client
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id            INTEGER PRIMARY KEY AUTOINCREMENT,
     name          TEXT    NOT NULL,
     email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
     password_hash TEXT    NOT NULL,
     created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash TEXT    PRIMARY KEY,
     user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at INTEGER NOT NULL
   )`,
  'CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id)',
]

// Create tables once per server instance (each Vercel cold start runs this once).
let ready
export function ensureSchema() {
  ready ??= getDb()
    .batch(SCHEMA, 'write')
    .catch((err) => {
      ready = undefined
      throw err
    })
  return ready
}

export async function get(sql, ...args) {
  const { rows } = await getDb().execute({ sql, args })
  return rows[0] ?? null
}

export async function run(sql, ...args) {
  return getDb().execute({ sql, args })
}
