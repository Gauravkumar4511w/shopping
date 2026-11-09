// A tiny History API router: enough for three pages without a dependency.
import { useSyncExternalStore } from 'react'

const EVENT = 'haat:navigate'

const subscribe = (cb) => {
  window.addEventListener('popstate', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(EVENT, cb)
  }
}

const snapshot = () => window.location.pathname + window.location.search + window.location.hash

export function useLocation() {
  const href = useSyncExternalStore(subscribe, snapshot)
  const url = new URL(href, window.location.origin)
  return { path: url.pathname.replace(/\/+$/, '') || '/', query: url.searchParams, hash: url.hash.slice(1) }
}

export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, window.location.href)
  if (url.href === window.location.href && !url.hash) return window.scrollTo({ top: 0, behavior: 'smooth' })
  window.history[replace ? 'replaceState' : 'pushState'](null, '', url.pathname + url.search + url.hash)
  window.dispatchEvent(new Event(EVENT))
}
