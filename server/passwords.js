import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const KEY_LENGTH = 64

// Stored as "scrypt$<salt>$<hash>" so the format can change later without breaking old rows.
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url')
  const hash = await scryptAsync(password, salt, KEY_LENGTH)
  return `scrypt$${salt}$${hash.toString('base64url')}`
}

export async function verifyPassword(password, stored) {
  const [scheme, salt, expected] = String(stored).split('$')
  if (scheme !== 'scrypt' || !salt || !expected) return false
  const actual = await scryptAsync(password, salt, KEY_LENGTH)
  const expectedBuf = Buffer.from(expected, 'base64url')
  return expectedBuf.length === actual.length && timingSafeEqual(expectedBuf, actual)
}

// Checked against when the email does not exist, so a failed login takes the same time either way.
let dummyHash
export async function dummyHashOnce() {
  dummyHash ??= hashPassword(randomBytes(12).toString('hex'))
  return dummyHash
}
