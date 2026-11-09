import { request } from './api'

export const auth = {
  me: () => request('auth/me'),
  login: ({ email, password }) => request('auth/login', { email, password }),
  signup: ({ name, email, password }) => request('auth/signup', { name, email, password }),
  logout: () => request('auth/logout', {}),
}
