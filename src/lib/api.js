// Small JSON client for the API in server/app.js. The session lives in an
// httpOnly cookie, so nothing secret is ever stored in JavaScript.

export class ApiError extends Error {
  constructor(message, fields = {}, status = 0) {
    super(message)
    this.fields = fields
    this.status = status
  }
}

export async function request(path, body) {
  let res
  try {
    res = await fetch(`/api/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong. Please try again.', data.fields, res.status)
  return data
}

export const api = {
  subscribe: (email) => request('newsletter', { email }),
  contact: (form) => request('contact', form),
  placeOrder: (order) => request('orders', order),
  orders: () => request('orders'),
  cancelOrder: (id) => request(`orders/${id}/cancel`, {}),
}
