// Small client for the auth API in server/index.js. The session lives in an
// httpOnly cookie, so nothing secret is ever stored in JavaScript.

class AuthError extends Error {
  constructor(message, fields = {}) {
    super(message)
    this.fields = fields
  }
}

async function call(path, body) {
  let res
  try {
    res = await fetch(`/api/auth/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    })
  } catch {
    throw new AuthError('Could not reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AuthError(data.error || 'Something went wrong. Please try again.', data.fields)
  return data
}

export const auth = {
  me: () => call('me'),
  login: ({ email, password }) => call('login', { email, password }),
  signup: ({ name, email, password }) => call('signup', { name, email, password }),
  logout: () => call('logout', {}),
}
